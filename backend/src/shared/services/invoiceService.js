const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { PassThrough } = require('stream');
const cloudinary = require('../../config/cloudinary');
const { db, admin } = require('../../config/firebase');

const COMPANY_INFO = {
    name: 'Goodkart Private Limited',
    addressLine1: 'No. 123, MG Road, Koramangala',
    addressLine2: 'Bangalore, Karnataka, India',
    addressLine3: 'Bangalore, 560034, Karnataka, IN-KA, IN- 560034',
    city: 'Bangalore',
    pincode: '560034',
    state: 'Karnataka',
    country: 'IN',
    gstin: '29AABCS1234M1ZX',
    pan: 'AABCS1234M'
};

async function getLogoBase64() {
    try {
        const logoPathBackend = path.join(__dirname, '..', 'assets', 'goodkart-logo.png');
        if (fs.existsSync(logoPathBackend)) {
            const logoBuffer = fs.readFileSync(logoPathBackend);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function uploadToCloudinary(buffer, orderId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                public_id: `invoices/Invoice-${orderId}`,
                format: 'pdf',
                access_mode: 'public'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
}

exports.generateInvoice = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Disable auto-page creation to have full control
            const doc = new PDFDocument({ margin: 30, size: 'A4', autoFirstPage: false });
            const buffers = [];
            const stream = new PassThrough();

            doc.pipe(stream);
            stream.on('data', chunk => buffers.push(chunk));
            stream.on('end', async () => {
                try {
                    const pdfBuffer = Buffer.concat(buffers);
                    const invoiceUrl = await uploadToCloudinary(pdfBuffer, order.orderId);
                    
                    const invoiceData = {
                        invoiceId: `INV-${Date.now()}`,
                        orderId: order.orderId,
                        userId: order.userId || order.uid || 'guest',
                        invoiceUrl: invoiceUrl,
                        amount: order.total || 0,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    
                    await db.collection('invoices').add(invoiceData);
                    resolve(invoiceUrl);
                } catch (err) {
                    reject(err);
                }
            });

            doc.on('error', reject);

            const getName = (addr) => addr ? `${addr.firstName || ''} ${addr.lastName || ''}`.trim() : 'Customer';
            const logoDataUrl = await getLogoBase64();

            // PAGE 1: Bill of Supply
            doc.addPage();
            await renderPage(doc, order, logoDataUrl, getName, 'Bill of Supply', false);
            
            // PAGE 2: Platform Charges
            // Only add a page if we are still on the first page
            if (doc.bufferedPageRange().count === 1) {
                doc.addPage();
            }
            await renderPage(doc, order, logoDataUrl, getName, 'Bill of Supply - Platform Charges', true);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

async function renderPage(doc, order, logoDataUrl, getName, title, isDetailed) {
    renderHeader(doc, logoDataUrl, title, order.orderId);
    
    let y = 100;
    // Section Header
    doc.fontSize(10).font('Helvetica-Bold').text('BILL OF SUPPLY DETAILS', 30, y);
    y += 15;
    
    // Details Grid
    doc.fontSize(8).font('Helvetica-Bold').text('Bill of Supply Number: ', 30, y, { continued: true }).font('Helvetica').text(order.orderId);
    doc.font('Helvetica-Bold').text('Nature of transaction: ', 350, y, { continued: true }).font('Helvetica').text('INTRA');
    y += 12;
    doc.font('Helvetica-Bold').text('Bill of Supply Date: ', 30, y, { continued: true }).font('Helvetica').text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
    doc.font('Helvetica-Bold').text('Nature Of Supply: ', 350, y, { continued: true }).font('Helvetica').text('Service');
    y += 12;
    doc.font('Helvetica-Bold').text('Order Number: ', 30, y, { continued: true }).font('Helvetica').text(order.orderId);
    
    y += 25;
    // Billed From/To headers
    doc.fontSize(10).font('Helvetica-Bold').text('BILLED FROM', 30, y);
    doc.text('BILLED TO', 350, y);
    y += 15;
    
    // Billed From content
    const fromStart = y;
    doc.fontSize(9).font('Helvetica-Bold').text(COMPANY_INFO.name, 30, y);
    y += 12;
    doc.fontSize(8).font('Helvetica').text(`${COMPANY_INFO.addressLine1}\n${COMPANY_INFO.addressLine2}\n${COMPANY_INFO.addressLine3}`, 30, y, { width: 280 });
    y += 30;
    doc.font('Helvetica-Bold').text('GSTIN: ', 30, y, { continued: true }).font('Helvetica').text(COMPANY_INFO.gstin);
    y += 10;
    doc.font('Helvetica-Bold').text('PAN: ', 30, y, { continued: true }).font('Helvetica').text(COMPANY_INFO.pan);
    const fromEnd = y;
    
    // Billed To content
    y = fromStart;
    const bAddr = order.billingAddress || order.shippingAddress || {};
    doc.fontSize(9).font('Helvetica-Bold').text(getName(bAddr), 350, y);
    y += 12;
    doc.fontSize(8).font('Helvetica').text(`${bAddr.addressLine || 'N/A'}\n${bAddr.city || 'N/A'}, ${bAddr.state || 'Karnataka'} - ${bAddr.pincode || 'N/A'}`, 350, y, { width: 220 });
    y += 20;
    const gst = order.gstNumber || order.customerInfo?.gstNumber || bAddr.gstNumber;
    if (gst) {
        doc.font('Helvetica-Bold').text('GSTIN: ', 350, y, { continued: true }).font('Helvetica').text(gst);
        y += 10;
    }
    doc.font('Helvetica-Bold').text('State Code: ', 350, y, { continued: true }).font('Helvetica').text('IN-KA');
    y += 10;
    doc.font('Helvetica-Bold').text('Place of Supply: ', 350, y, { continued: true }).font('Helvetica').text((bAddr.state || 'KARNATAKA').toUpperCase());
    const toEnd = y;

    y = Math.max(fromEnd, toEnd) + 20;
    
    if (!isDetailed) {
        doc.moveTo(30, y).lineTo(565, y).lineWidth(0.5).stroke('#000000');
        y += 10;
        doc.fontSize(10).font('Helvetica-Bold').text('SHIPPED FROM', 30, y);
        doc.text('SHIPPED TO', 350, y);
        y += 15;
        
        const sFromAddr = order.sellerAddress || {};
        doc.fontSize(8).font('Helvetica').text(`Survey No. 48, 486, 487, 488... Kotur Dharwad Dist.\nKarnataka - 580011, IN-KA`, 30, y, { width: 280 });
        
        const sToAddr = order.shippingAddress || bAddr;
        doc.fontSize(9).font('Helvetica-Bold').text(getName(sToAddr), 350, y);
        y += 12;
        doc.fontSize(8).font('Helvetica').text(`${sToAddr.addressLine || 'N/A'}\n${sToAddr.city || 'N/A'}, ${sToAddr.state || 'Karnataka'}, IN-KA`, 350, y, { width: 220 });
        
        y += 45;
        doc.moveTo(30, y).lineTo(565, y).lineWidth(0.5).stroke('#000000');
        y += 15;
    } else {
        y += 5;
        doc.moveTo(30, y).lineTo(565, y).lineWidth(0.5).stroke('#000000');
        y += 15;
    }

    if (isDetailed) {
        y = renderPlatformTable(doc, order, y);
    } else {
        y = renderItemsTable(doc, order, y);
    }
    
    renderFooter(doc, order, Math.min(y + 20, 650));
}

function renderHeader(doc, logoDataUrl, title, orderId) {
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#000000').text(title.toUpperCase(), 30, 35);
    doc.fontSize(12).font('Helvetica').text(`#${orderId}`, 30, 65);

    if (logoDataUrl) {
        try {
            const logoBuffer = Buffer.from(logoDataUrl.split(',')[1], 'base64');
            doc.image(logoBuffer, 410, 22, { width: 45 });
        } catch (e) {}
    }
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1800AD').text('Good', 460, 30, { continued: true });
    doc.fontSize(18).font('Helvetica').fillColor('#5BB8FF').text('kart');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1800AD').text('Good Deals. Good Life', 460, 52, { width: 80, align: 'center' });

    doc.moveTo(30, 90).lineTo(565, 90).lineWidth(1.5).stroke('#000000');
}

function renderItemsTable(doc, order, y) {
    const cols = [30, 210, 250, 280, 350, 420, 475, 525];
    doc.fontSize(7).font('Helvetica-Bold').rect(30, y, 535, 20).fill('#f9fafb').stroke('#000000');
    doc.fillColor('#000000').text('Particulars', 35, y + 6).text('SAC', cols[1], y + 6).text('Qty', cols[2], y + 6).text('Gross', cols[3], y + 6).text('Taxable', cols[4], y + 6).text('SGST', cols[5], y + 6).text('CGST', cols[6], y + 6).text('Total', cols[7], y + 6);
    y += 20;
    
    let tGross = 0;
    (order.items || []).forEach(item => {
        const qty = item.quantity || 1, price = item.priceWithGST || item.price || 0, gst = item.gstPercent || 18;
        const taxable = price / (1 + (gst / 100)) * qty, gross = price * qty;
        tGross += gross;
        
        doc.fontSize(7).font('Helvetica').rect(30, y, 535, 25).stroke('#000000');
        doc.text(item.name || 'Product', 35, y + 5, { width: 170 });
        doc.fontSize(6).fillColor('#666666').text(`SAC: 996511 | GST ${gst}%`, 35, y + 15);
        doc.fillColor('#000000').fontSize(7).text('996511', cols[1], y + 10).text(qty.toFixed(1), cols[2], y + 10).text(`₹${gross.toFixed(2)}`, cols[3], y + 10).text(`₹${taxable.toFixed(2)}`, cols[4], y + 10).text(`₹${((gross-taxable)/2).toFixed(2)}`, cols[5], y + 10).text(`₹${((gross-taxable)/2).toFixed(2)}`, cols[6], y + 10).font('Helvetica-Bold').text(`₹${gross.toFixed(2)}`, cols[7], y + 10);
        y += 25;
    });
    
    doc.rect(30, y, 535, 20).fill('#f3f4f6').stroke('#000000').fillColor('#000000').fontSize(8).text('GRAND TOTAL (PRODUCTS)', 380, y + 6).text(`₹${tGross.toFixed(2)}`, cols[7], y + 6);
    return y + 20;
}

function renderPlatformTable(doc, order, y) {
    const cols = [30, 210, 250, 320, 390, 460, 525];
    doc.fontSize(7).font('Helvetica-Bold').rect(30, y, 535, 20).fill('#f9fafb').stroke('#000000');
    doc.fillColor('#000000').text('Particulars', 35, y + 6).text('SAC', cols[1], y + 6).text('Fee', cols[2], y + 6).text('Taxable', cols[3], y + 6).text('CGST', cols[4], y + 6).text('SGST', cols[5], y + 6).text('Total', cols[6], y + 6);
    y += 20;
    
    let tTaxable = 0;
    (order.items || []).forEach(i => tTaxable += (i.priceWithGST || i.price || 0) / (1 + (i.gstPercent || 18) / 100) * (i.quantity || 1));
    const pfBase = tTaxable * 0.035, pfTotal = pfBase * 1.18;
    
    doc.fontSize(7).font('Helvetica').rect(30, y, 535, 25).stroke('#000000').text('Platform Service Fee', 35, y + 5).fontSize(6).fillColor('#666666').text('SAC: 998314', 35, y + 15).fillColor('#000000').fontSize(7).text('998314', cols[1], y + 10).text(`₹${pfBase.toFixed(2)}`, cols[2], y + 10).text(`₹${pfBase.toFixed(2)}`, cols[3], y + 10).text(`₹${(pfBase*0.09).toFixed(2)}`, cols[4], y + 10).text(`₹${(pfBase*0.09).toFixed(2)}`, cols[5], y + 10).font('Helvetica-Bold').text(`₹${pfTotal.toFixed(2)}`, cols[6], y + 10);
    y += 25;
    
    const shipping = order.estimatedShippingCharge || 0, disc = order.couponDiscount || 0;
    doc.rect(30, y, 535, 20).fill('#f3f4f6').stroke('#000000').fillColor('#000000').fontSize(8).text('GRAND TOTAL', 380, y + 6).text(`₹${(pfTotal + shipping - disc).toFixed(2)}`, cols[6], y + 6);
    return y + 20;
}

function renderFooter(doc, order, y) {
    const paid = (order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected');
    doc.rect(30, y, 535, 40).fill(paid ? '#f0fdf4' : '#fffbeb').stroke('#cccccc');
    doc.fillColor('#666666').fontSize(7).font('Helvetica-Bold').text('PAYMENT METHOD', 50, y + 10).text('PAYMENT STATUS', 450, y + 10);
    doc.fillColor('#000000').fontSize(10).text((order.paymentMethod || 'N/A').toUpperCase(), 50, y + 22);
    doc.fillColor(paid ? '#059669' : '#d97706').text(paid ? 'PAID' : 'PENDING', 450, y + 22);
    
    y += 50;
    doc.fillColor('#666666').fontSize(8).font('Helvetica-Oblique').text('Computer generated invoice.', 30, y, { align: 'center', width: 535 });
    y += 20;
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text('Thank you!', 30, y);
    doc.rect(500, y, 60, 60).stroke('#000000').text('QR', 500, y + 25, { align: 'center', width: 60 });
}
