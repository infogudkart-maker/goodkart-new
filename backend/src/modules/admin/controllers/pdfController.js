'use strict';
const path = require('path');
const fs = require('fs');
const { admin, db } = require('../../../config/firebase');
const PDFDocument = require('pdfkit');
const { getAdminConfig } = require('../../../shared/services/adminConfigService');
const { resolveMrpAndSelling, computeSellerItemEarnings, isItemRevenueEligible, sumFeePercent } = require('../../../utils/pricing');

const inr = (n) => `Rs.${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const maskAcc = (a) => (a && a.length > 4 && a !== 'Not provided') ? `${'X'.repeat(a.length - 4)}${a.slice(-4)}` : a;

// Brand constants
const BRAND = {
    name: 'Goodkart',
    tagline: 'Your Trusted E-Commerce Platform',
    primary: '#3B7CF1',
    dark: '#1D5FD4',
    lightBg: '#EBF0FF',
    border: '#BFCFFA',
    logoPath: path.join(__dirname, '../../../assets/goodkart-logo.png')
};

// Shared PDF header renderer
function renderPDFHeader(doc, adminConfig, title, subtitle) {
    const siteInfo = adminConfig.websiteInfo || BRAND.tagline;

    // Centered logo + two-tone brand name header
    const logoH = 70;
    const logoW = 70;
    const logoX = 160;
    const logoY = 28;
    const textX = logoX + logoW + 14;
    const textY = 42;

    if (fs.existsSync(BRAND.logoPath)) {
        doc.image(BRAND.logoPath, logoX, logoY, { height: logoH });
    }

    // "Good" in dark navy bold
    doc.fontSize(38).fillColor('#1a1a6e').font('Helvetica-Bold').text('Good', textX, textY, { continued: true });
    // "kart" in Goodkart blue
    doc.fontSize(38).fillColor('#3B7CF1').font('Helvetica').text('kart');

    // Tagline below brand name
    doc.fontSize(9).fillColor('#888888').font('Helvetica').text(siteInfo, textX, textY + 44);

    // Date top right
    const reportDate = new Date().toLocaleDateString('en-GB');
    doc.fontSize(9).fillColor('#666666').text('Report Date:', 430, 35);
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text(reportDate, 430, 48);

    // Divider
    doc.moveTo(50, 112).lineTo(545, 112).strokeColor(BRAND.primary).lineWidth(2).stroke();

    // Title
    doc.fontSize(16).fillColor('#000000').font('Helvetica-Bold').text(title, 50, 124, { align: 'center' });
    if (subtitle) {
        doc.fontSize(10).fillColor('#666666').font('Helvetica').text(subtitle, 50, 144, { align: 'center' });
    }

    return reportDate;
}

// Shared section header
function renderSectionHeader(doc, label, y) {
    doc.rect(50, y, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
    doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text(label, 55, y + 5);
    return y + 18;
}

// Shared table header
function renderTableHeader(doc, y, columns) {
    doc.rect(50, y, 495, 22).fillAndStroke(BRAND.primary, BRAND.primary);
    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
    columns.forEach(col => doc.text(col.label, col.x, y + 7));
    return y + 27;
}

// Shared stat box
function renderStatBox(doc, x, y, w, h, label, value) {
    doc.rect(x, y, w, h).fillAndStroke(BRAND.lightBg, BRAND.primary);
    doc.fontSize(9).fillColor(BRAND.primary).font('Helvetica').text(label, x, y + 10, { width: w, align: 'center' });
    doc.fontSize(16).fillColor(BRAND.dark).font('Helvetica-Bold').text(value, x, y + 30, { width: w, align: 'center' });
}

// Shared seller info block
function renderSellerInfo(doc, sellerData, sellerContact, y) {
    y = renderSectionHeader(doc, 'SELLER INFORMATION', y) + 10;
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('Shop Name:', 55, y);       doc.font('Helvetica-Bold').text(sellerData.shopName || 'N/A', 160, y);
    doc.font('Helvetica').text('Category:', 320, y); doc.font('Helvetica-Bold').text(sellerData.category || 'N/A', 400, y);
    doc.font('Helvetica').text('GST Number:', 55, y + 20); doc.font('Helvetica-Bold').text(sellerData.gstNumber || 'N/A', 160, y + 20);
    doc.font('Helvetica').text('Contact:', 320, y + 20); doc.font('Helvetica-Bold').text(sellerContact || 'N/A', 400, y + 20);
    return y + 50;
}

// Shared bank details block
function renderBankDetails(doc, bankDetails, y) {
    y = renderSectionHeader(doc, 'BANK DETAILS', y) + 10;
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('Bank Name:', 55, y);       doc.font('Helvetica-Bold').text(bankDetails.bankName, 160, y);
    doc.text('Account Holder:', 320, y); doc.font('Helvetica-Bold').text(bankDetails.accountHolderName, 430, y);
    doc.font('Helvetica').text('Account Number:', 55, y + 20); doc.font('Helvetica-Bold').text(bankDetails.accountNumber, 160, y + 20);
    doc.text('IFSC Code:', 320, y + 20); doc.font('Helvetica-Bold').text(bankDetails.ifscCode, 430, y + 20);
    doc.font('Helvetica').text('UPI ID:', 55, y + 40); doc.font('Helvetica-Bold').text(bankDetails.upiId, 160, y + 40);
    return y + 65;
}

/**
 * Generate Analytics PDF for a seller (Payout)
 */
const generateAnalyticsPDF = async (req, res) => {
    try {
        const { uid } = req.params;
        const { fromDate, toDate } = req.query;
        const adminConfig = await getAdminConfig();

        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) return res.status(404).send("Seller not found");
        const sellerData = sellerSnap.data();

        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const sellerContact = userData.phone || userData.email || "N/A";

        const bankDetails = {
            bankName: sellerData.bankName || 'Not provided',
            accountHolderName: sellerData.accountHolderName || 'Not provided',
            accountNumber: sellerData.accountNumber || 'Not provided',
            ifscCode: sellerData.ifscCode || 'Not provided',
            upiId: sellerData.upiId || 'Not provided'
        };

        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        let totalProducts = 0, totalStockLeft = 0, totalInventoryValue = 0;
        const productStats = {};

        productsSnap.forEach(p => {
            const prod = p.data();
            totalProducts++;
            const stock = prod.stock || 0;
            const { mrp: price, selling: discountedPrice } = resolveMrpAndSelling(prod);
            totalStockLeft += stock;
            totalInventoryValue += (discountedPrice * stock);
            productStats[p.id] = {
                name: prod.title || 'N/A',
                price, discountedPrice: discountedPrice < price ? discountedPrice : null,
                stock, sold: 0, revenue: 0,
                platformFee: 0, platformFeeGST: 0, netEarnings: 0
            };
        });

        // Get seller platform fee breakdown and cap ranges
        const platformFeeBreakdownSeller = adminConfig.platformFeeBreakdownSeller || {};
        const platformFeeCapRanges = adminConfig.platformFeeCapRanges || [];
        
        // Calculate total seller platform fee percentage
        const sellerFeePercent = Object.values(platformFeeBreakdownSeller).reduce((sum, val) => {
            return sum + (typeof val === 'number' ? val : (val.percent || 0));
        }, 0);

        // Helper function to get cap amount for a price
        const getCapAmount = (price) => {
            if (!platformFeeCapRanges || platformFeeCapRanges.length === 0) return null;
            for (const range of platformFeeCapRanges) {
                if (price >= range.min && (range.max === null || price <= range.max)) {
                    return range.capAmount || 0;
                }
            }
            return null;
        };

        let unitsSold = 0, grossRevenue = 0, totalPlatformFees = 0, totalPlatformFeeGST = 0, netPayout = 0;
        const ordersSnap = await db.collection("orders").get();
        ordersSnap.forEach(o => {
            const order = o.data();
            const orderDate = order.createdAt?.toDate();
            let inRange = true;
            if (fromDate || toDate) {
                if (orderDate) {
                    if (fromDate && new Date(fromDate) > orderDate) inRange = false;
                    if (toDate) { const to = new Date(toDate); to.setHours(23,59,59,999); if (to < orderDate) inRange = false; }
                } else { inRange = false; }
            }
            if (inRange && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.sellerId === uid && isItemRevenueEligible(order, item)) {
                        // Revenue = SELLING price (after discount, ex-GST), never the MRP
                        const e = computeSellerItemEarnings(item, adminConfig);
                        const qty = e.qty, itemRevenue = e.revenue, platformFee = e.fee, platformFeeGST = e.feeGST, netItemEarnings = e.net;

                        unitsSold += qty;
                        grossRevenue += itemRevenue;
                        totalPlatformFees += platformFee;
                        totalPlatformFeeGST += platformFeeGST;
                        netPayout += netItemEarnings;
                        
                        if (productStats[item.productId]) {
                            productStats[item.productId].sold += qty;
                            productStats[item.productId].revenue += itemRevenue;
                            productStats[item.productId].platformFee += platformFee;
                            productStats[item.productId].platformFeeGST += platformFeeGST;
                            productStats[item.productId].netEarnings += netItemEarnings;
                        }
                    }
                });
            }
        });

        let filename = `analytics_${sellerData.shopName?.replace(/\s+/g, '_') || 'seller'}`;
        if (fromDate && toDate) filename += `_${fromDate}_to_${toDate}`;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
        doc.pipe(res);

        const subtitle = (fromDate && toDate)
            ? `Date Range: ${new Date(fromDate).toLocaleDateString('en-GB')} to ${new Date(toDate).toLocaleDateString('en-GB')}`
            : null;
        const reportDate = renderPDFHeader(doc, adminConfig, 'SELLER ANALYTICS REPORT', subtitle);

        let y = subtitle ? 175 : 162;

        // Seller Info
        y = renderSellerInfo(doc, sellerData, sellerContact, y);
        y += 10;

        // Bank Details
        y = renderBankDetails(doc, bankDetails, y);
        y += 15;

        // Performance Summary
        y = renderSectionHeader(doc, 'PERFORMANCE SUMMARY', y) + 15;
        const bw = 99, bh = 65, bg = 8;
        renderStatBox(doc, 50, y, bw, bh, 'Total Products', totalProducts.toString());
        renderStatBox(doc, 50 + bw + bg, y, bw, bh, 'Units Sold', unitsSold.toString());
        renderStatBox(doc, 50 + (bw+bg)*2, y, bw, bh, 'Stock Left', totalStockLeft.toString());
        renderStatBox(doc, 50 + (bw+bg)*3, y, bw, bh, 'Gross Revenue', `Rs.${Math.round(grossRevenue).toLocaleString('en-IN')}`);
        renderStatBox(doc, 50 + (bw+bg)*4, y, bw, bh, 'Net Payout', `Rs.${Math.round(netPayout).toLocaleString('en-IN')}`);
        y += bh + 20;

        // Platform Fee Summary
        y = renderSectionHeader(doc, 'PLATFORM FEE SUMMARY', y) + 15;
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text('Seller Platform Fee Rate:', 55, y);
        doc.font('Helvetica-Bold').text(`${sellerFeePercent.toFixed(2)}%`, 250, y);
        doc.font('Helvetica').text('Total Platform Fees:', 320, y);
        doc.font('Helvetica-Bold').fillColor('#dc2626').text(`Rs.${totalPlatformFees.toFixed(2)}`, 470, y);
        
        doc.font('Helvetica').fillColor('#000000').text('GST on Platform Fees (18%):', 55, y + 20);
        doc.font('Helvetica-Bold').text(`Rs.${totalPlatformFeeGST.toFixed(2)}`, 250, y + 20);
        doc.font('Helvetica').text('Total Deductions:', 320, y + 20);
        doc.font('Helvetica-Bold').fillColor('#dc2626').text(`Rs.${(totalPlatformFees + totalPlatformFeeGST).toFixed(2)}`, 470, y + 20);
        
        y += 55;

        // Product Table with Platform Fees
        y = renderSectionHeader(doc, 'PRODUCT EARNINGS BREAKDOWN', y) + 5;
        const prodCols = [
            { label: 'Product', x: 55 }, { label: 'Sold', x: 200 },
            { label: 'Revenue', x: 240 }, { label: 'Platform Fee', x: 310 },
            { label: 'GST', x: 395 }, { label: 'Net Earnings', x: 455 }
        ];
        y = renderTableHeader(doc, y, prodCols);

        const sortedProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
        sortedProducts.forEach((p, i) => {
            if (y > 720) { doc.addPage(); y = 50; y = renderTableHeader(doc, y, prodCols); }
            if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillAndStroke('#f9fafb', '#f9fafb');
            doc.fontSize(8).fillColor('#000000').font('Helvetica');
            doc.text((p.name || '').substring(0, 22), 55, y);
            doc.text(p.sold.toString(), 200, y);
            doc.text(`Rs.${p.revenue.toFixed(0)}`, 240, y);
            doc.fillColor('#dc2626').text(`-Rs.${p.platformFee.toFixed(2)}`, 310, y);
            doc.text(`-Rs.${p.platformFeeGST.toFixed(2)}`, 395, y);
            doc.fillColor('#059669').font('Helvetica-Bold').text(`Rs.${p.netEarnings.toFixed(0)}`, 455, y);
            doc.fillColor('#000000').font('Helvetica');
            y += 18;
        });

        // Footer
        doc.fontSize(8).fillColor('#999999').font('Helvetica')
            .text(`Generated by ${(adminConfig.websiteName !== 'SellSathi' ? adminConfig.websiteName : BRAND.name)} | ${reportDate}`, 50, 770, { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("ANALYTICS PDF ERROR:", err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

/**
 * Generate Seller Settlement Invoice PDF (Goodkart -> Seller).
 *  - Revenue is the SELLING price (after discount, ex-GST) - never the MRP.
 *  - Platform fee = admin-configured seller fee % of selling price (with caps), + 18% GST (CGST 9% + SGST 9%).
 *  - Only delivered, non-cancelled/returned lines are included.
 */
const generateInvoicePDF = async (req, res) => {
    try {
        const { uid } = req.params;
        const { fromDate, toDate } = req.query;
        const adminConfig = await getAdminConfig();
        const COMPANY = require('../../../config/company');

        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) return res.status(404).send("Seller not found");
        const sellerData = sellerSnap.data();

        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const sellerContact = userData.phone || userData.email || sellerData.contactEmail || "N/A";
        const pa = sellerData.pickupAddress || {};
        const sellerAddress = [pa.address || sellerData.address, pa.city, pa.state, pa.pincode].filter(Boolean).join(', ') || 'N/A';

        const bankDetails = {
            bankName: sellerData.bankName || 'Not provided',
            accountHolderName: sellerData.accountHolderName || 'Not provided',
            accountNumber: maskAcc(sellerData.accountNumber || 'Not provided'),
            ifscCode: sellerData.ifscCode || 'Not provided',
            upiId: sellerData.upiId || 'Not provided'
        };

        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        const totalProducts = productsSnap.size;
        const sellerProducts = [];
        productsSnap.forEach(p => {
            const prod = p.data();
            const { mrp, selling } = resolveMrpAndSelling(prod);
            sellerProducts.push({
                name: prod.title || 'N/A', category: prod.category || 'N/A',
                mrp, selling, stock: prod.stock || 0,
                offPercent: mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0
            });
        });

        const feePercent = sumFeePercent(adminConfig.platformFeeBreakdownSeller);
        const ordersSnap = await db.collection("orders").where("status", "==", "Delivered").get();
        let totalRevenue = 0, totalPlatformFees = 0, totalPlatformFeeGST = 0, unitsSold = 0;
        const orderDetails = [];

        ordersSnap.forEach(o => {
            const order = o.data();
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
            let inRange = true;
            if (fromDate || toDate) {
                if (!orderDate) inRange = false;
                else {
                    if (fromDate && new Date(fromDate) > orderDate) inRange = false;
                    if (toDate) { const to = new Date(toDate); to.setHours(23, 59, 59, 999); if (to < orderDate) inRange = false; }
                }
            }
            if (!inRange || !Array.isArray(order.items)) return;
            order.items.forEach(item => {
                if (item.sellerId !== uid || !isItemRevenueEligible(order, item)) return;
                const e = computeSellerItemEarnings(item, adminConfig);
                totalRevenue += e.revenue; totalPlatformFees += e.fee; totalPlatformFeeGST += e.feeGST; unitsSold += e.qty;
                orderDetails.push({
                    orderId: order.orderId || o.id,
                    orderDate: orderDate ? orderDate.toLocaleDateString('en-GB') : 'N/A',
                    productName: item.name || 'N/A', quantity: e.qty, unit: e.unit,
                    total: e.revenue, platformFee: e.fee, platformFeeGST: e.feeGST, netEarnings: e.net
                });
            });
        });

        const totalDeductions = totalPlatformFees + totalPlatformFeeGST;
        const amountToReceive = totalRevenue - totalDeductions;
        const today = new Date();
        const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
        const invoiceNo = `GK-SI-${String(uid).slice(-6).toUpperCase()}-${ymd}`;

        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${sellerData.shopName?.replace(/\s+/g, '_') || 'seller'}.pdf`);
        doc.pipe(res);

        const subtitle = (fromDate && toDate)
            ? `Invoice Period: ${new Date(fromDate).toLocaleDateString('en-GB')} to ${new Date(toDate).toLocaleDateString('en-GB')}`
            : (fromDate ? `From: ${new Date(fromDate).toLocaleDateString('en-GB')}` : 'Invoice Period: All delivered orders');
        const reportDate = renderPDFHeader(doc, adminConfig, 'SELLER SETTLEMENT INVOICE', subtitle);

        let y = 165;
        doc.fontSize(9).fillColor('#000000');
        doc.font('Helvetica').text('Invoice No:', 55, y);   doc.font('Helvetica-Bold').text(invoiceNo, 125, y);
        doc.font('Helvetica').text('Invoice Date:', 340, y); doc.font('Helvetica-Bold').text(today.toLocaleDateString('en-GB'), 410, y);
        y += 20;

        // Billed by / Seller
        y = renderSectionHeader(doc, 'BILLED BY (PLATFORM)', y) + 8;
        doc.fontSize(9).font('Helvetica-Bold').text(COMPANY.name, 55, y);
        doc.font('Helvetica').text(`${COMPANY.addressLine1}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, 55, y + 12);
        doc.text(`GSTIN: ${COMPANY.gstin}    PAN: ${COMPANY.pan}    State Code: ${COMPANY.stateCode}`, 55, y + 24);
        y += 48;

        y = renderSectionHeader(doc, 'SELLER INFORMATION', y) + 8;
        doc.fontSize(9).font('Helvetica').text('Shop Name:', 55, y);    doc.font('Helvetica-Bold').text(sellerData.shopName || 'N/A', 125, y, { width: 190 });
        doc.font('Helvetica').text('Category:', 330, y);                doc.font('Helvetica-Bold').text(sellerData.category || 'N/A', 395, y, { width: 145 });
        doc.font('Helvetica').text('GSTIN:', 55, y + 16);               doc.font('Helvetica-Bold').text(sellerData.gstNumber || 'Unregistered', 125, y + 16);
        doc.font('Helvetica').text('PAN:', 330, y + 16);                doc.font('Helvetica-Bold').text(sellerData.panNumber || 'N/A', 395, y + 16);
        doc.font('Helvetica').text('Contact:', 55, y + 32);             doc.font('Helvetica-Bold').text(String(sellerContact), 125, y + 32, { width: 190 });
        doc.font('Helvetica').text('Address:', 55, y + 48);             doc.font('Helvetica-Bold').text(sellerAddress, 125, y + 48, { width: 415 });
        y += 72;

        y = renderBankDetails(doc, bankDetails, y) + 5;

        // Summary
        y = renderSectionHeader(doc, 'SETTLEMENT SUMMARY', y) + 10;
        const bw = 99, bh = 60, bg = 8;
        renderStatBox(doc, 50, y, bw, bh, 'Products Listed', totalProducts.toString());
        renderStatBox(doc, 50 + bw + bg, y, bw, bh, 'Net Sales (ex-GST)', inr(totalRevenue).replace('.00', ''));
        renderStatBox(doc, 50 + (bw + bg) * 2, y, bw, bh, 'Platform Fee', inr(totalPlatformFees).replace('.00', ''));
        renderStatBox(doc, 50 + (bw + bg) * 3, y, bw, bh, 'GST on Fee', inr(totalPlatformFeeGST).replace('.00', ''));
        renderStatBox(doc, 50 + (bw + bg) * 4, y, bw, bh, 'Net Payout', inr(amountToReceive).replace('.00', ''));
        y += bh + 15;

        // Fee tax invoice block
        y = renderSectionHeader(doc, 'PLATFORM FEE - TAX DETAILS (SAC 998314)', y) + 10;
        const cgst = totalPlatformFeeGST / 2;
        const rows = [
            ['Units Sold', String(unitsSold)],
            ['Sales Value at Selling Price (ex-GST)', inr(totalRevenue)],
            [`Platform Fee @ ${feePercent.toFixed(2)}% (Taxable Value)`, inr(totalPlatformFees)],
            ['CGST @ 9%', inr(cgst)],
            ['SGST @ 9%', inr(cgst)],
            ['Total Deductions (Fee + GST)', inr(totalDeductions)],
            ['Amount Payable to Seller', inr(amountToReceive)],
        ];
        rows.forEach(([k, v], i) => {
            const last = i === rows.length - 1;
            doc.fontSize(9).font(last ? 'Helvetica-Bold' : 'Helvetica').fillColor(last ? '#059669' : '#000000').text(k, 55, y, { width: 300 });
            doc.font('Helvetica-Bold').text(v, 400, y, { width: 140, align: 'right' });
            y += 15;
        });
        doc.fillColor('#000000');
        y += 10;

        // Products table (MRP vs selling)
        y = renderSectionHeader(doc, 'PRODUCTS LISTED BY SELLER', y) + 5;
        const prodCols = [
            { label: 'Product Name', x: 55 }, { label: 'Category', x: 250 },
            { label: 'MRP', x: 340 }, { label: 'Selling Price', x: 395 }, { label: 'Off', x: 465 }, { label: 'Stock', x: 505 }
        ];
        y = renderTableHeader(doc, y, prodCols);
        if (sellerProducts.length === 0) {
            doc.fontSize(10).fillColor('#999999').text('No products listed.', 55, y, { align: 'center', width: 495 });
            y += 25;
        } else {
            sellerProducts.forEach((p, i) => {
                if (y > 740) { doc.addPage(); y = 50; y = renderTableHeader(doc, y, prodCols); }
                if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillAndStroke('#f9fafb', '#f9fafb');
                doc.fontSize(8).fillColor('#000000').font('Helvetica');
                doc.text(p.name.substring(0, 36), 55, y);
                doc.text(String(p.category).substring(0, 16), 250, y);
                doc.text(inr(p.mrp).replace('.00', ''), 340, y);
                doc.font('Helvetica-Bold').text(inr(p.selling).replace('.00', ''), 395, y).font('Helvetica');
                doc.text(p.offPercent ? `${p.offPercent}%` : '-', 465, y);
                doc.text(String(p.stock), 505, y);
                y += 18;
            });
        }
        y += 15;

        // Orders
        if (y > 640) { doc.addPage(); y = 50; }
        y = renderSectionHeader(doc, 'DELIVERED ORDER DETAILS WITH EARNINGS', y) + 5;
        const orderCols = [
            { label: 'Order ID', x: 52 }, { label: 'Date', x: 118 }, { label: 'Product', x: 170 },
            { label: 'Qty', x: 280 }, { label: 'Unit', x: 305 }, { label: 'Sales', x: 350 },
            { label: 'Fee', x: 402 }, { label: 'GST', x: 447 }, { label: 'Net', x: 492 }
        ];
        y = renderTableHeader(doc, y, orderCols);
        if (orderDetails.length === 0) {
            doc.fontSize(10).fillColor('#999999').text('No delivered orders found.', 55, y, { align: 'center', width: 495 });
            y += 25;
        } else {
            orderDetails.forEach((o, i) => {
                if (y > 740) { doc.addPage(); y = 50; y = renderTableHeader(doc, y, orderCols); }
                if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillAndStroke('#f9fafb', '#f9fafb');
                doc.fontSize(7).fillColor('#000000').font('Helvetica');
                doc.text(String(o.orderId), 52, y, { width: 64, lineBreak: false });
                doc.text(o.orderDate, 118, y);
                doc.text(o.productName.substring(0, 20), 170, y, { width: 108, lineBreak: false });
                doc.text(String(o.quantity), 280, y);
                doc.text(o.unit.toFixed(0), 305, y);
                doc.text(o.total.toFixed(2), 350, y);
                doc.fillColor('#dc2626').text(`-${o.platformFee.toFixed(2)}`, 402, y);
                doc.text(`-${o.platformFeeGST.toFixed(2)}`, 447, y);
                doc.fillColor('#059669').font('Helvetica-Bold').text(o.netEarnings.toFixed(2), 492, y);
                doc.fillColor('#000000').font('Helvetica');
                y += 18;
            });
            // Totals row
            if (y > 740) { doc.addPage(); y = 50; }
            doc.rect(50, y - 3, 495, 20).fillAndStroke('#EBF0FF', '#BFCFFA');
            doc.fontSize(8).fillColor('#000000').font('Helvetica-Bold').text('TOTAL', 52, y + 2);
            doc.text(String(unitsSold), 280, y + 2).text(totalRevenue.toFixed(2), 350, y + 2)
               .fillColor('#dc2626').text(`-${totalPlatformFees.toFixed(2)}`, 402, y + 2).text(`-${totalPlatformFeeGST.toFixed(2)}`, 447, y + 2)
               .fillColor('#059669').text(amountToReceive.toFixed(2), 492, y + 2);
            y += 24;
        }

        // Footer note
        if (y > 730) { doc.addPage(); y = 50; }
        doc.fontSize(7.5).fillColor('#666666').font('Helvetica-Oblique').text(
            'All amounts in INR. Sales are computed on the selling price (after seller discount) excluding GST collected from the customer. ' +
            'Platform fee is charged on the selling price as per Goodkart seller fee schedule; GST @18% applies on the fee. This is a computer generated document.',
            50, y + 5, { width: 495, align: 'left' });
        doc.fontSize(8).fillColor('#999999').font('Helvetica')
            .text(`Generated by ${(adminConfig.websiteName !== 'SellSathi' ? adminConfig.websiteName : BRAND.name)} | ${reportDate}`, 50, y + 40, { align: 'center', width: 495 });

        doc.end();
    } catch (err) {
        console.error("INVOICE PDF ERROR:", err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

module.exports = { generateAnalyticsPDF, generateInvoicePDF };
