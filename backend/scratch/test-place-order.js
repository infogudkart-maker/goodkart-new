require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { db, admin } = require('../src/config/firebase');
const invoiceService = require('../src/shared/services/invoiceService');
const emailService = require('../src/shared/services/emailService');
const shiprocketService = require('../src/shared/services/shiprocketService');

async function testFullOrderProcessing() {
    console.log('====================================================');
    console.log('🧪 TESTING COMPLETE POST-ORDER PROCESSING');
    console.log('====================================================');

    const orderId = 'OD_TEST_' + Date.now();
    const testEmail = 'reachshreyas.s@gmail.com';

    const orderData = {
        orderId,
        uid: 'test_917676879059',
        userId: 'test_917676879059',
        sellerId: '0Ru3uX4hrMcDXuHMfldhTDY4vaW2',
        customerName: 'Shreyas',
        email: testEmail,
        phone: '7676879059',
        paymentMethod: 'COD',
        total: 5442.60,
        shippingAddress: {
            firstName: 'Shreyas',
            lastName: 'Shreyas',
            addressLine: '975, 5th Cross',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560097',
            phone: '7676879059'
        },
        items: [
            {
                id: 'item_1',
                productId: 'prod_1',
                name: 'Levi\'s 511 Slim Fit Jeans',
                price: 5310,
                quantity: 1
            }
        ]
    };

    console.log(`\n1️⃣ Creating order document in Firestore (${orderId})...`);
    const orderRef = await db.collection('orders').add({
        ...orderData,
        status: 'Processing',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Firestore order document created with ID:', orderRef.id);

    console.log('\n2️⃣ Testing Invoice Generation & Email Sending...');
    try {
        const invoiceResult = await invoiceService.generateInvoice({ ...orderData, documentId: orderRef.id });
        const invoiceUrl = typeof invoiceResult === 'object' ? invoiceResult.invoiceUrl : invoiceResult;
        const pdfBuffer = typeof invoiceResult === 'object' ? invoiceResult.pdfBuffer : null;

        console.log('✅ Invoice Generated. URL:', invoiceUrl);
        console.log('✅ PDF Buffer Present:', !!pdfBuffer, pdfBuffer?.length ? `(${pdfBuffer.length} bytes)` : '');

        await orderRef.update({ invoiceGenerated: true, invoiceUrl: invoiceUrl });
        console.log('✅ Firestore document updated with invoiceUrl string!');

        if (orderData.email) {
            console.log(`\n📧 Sending Order Confirmation Email to ${orderData.email}...`);
            const mailResult = await emailService.sendOrderConfirmation(
                orderData.email,
                { ...orderData, documentId: orderRef.id },
                invoiceUrl,
                pdfBuffer
            );
            if (mailResult) {
                console.log('🎉 EMAIL SENT SUCCESSFULLY! MessageId:', mailResult.messageId || mailResult);
            } else {
                console.error('❌ Email sending failed.');
            }
        }
    } catch (invErr) {
        console.error('❌ Invoice/Email Error:', invErr);
    }

    console.log('\n3️⃣ Testing Shiprocket Shipment Creation & AWB Generation...');
    try {
        const shipmentResult = await shiprocketService.createShipment({ ...orderData, orderId: orderData.orderId });
        console.log('Shiprocket Shipment Result:', JSON.stringify(shipmentResult, null, 2));

        if (shipmentResult.success && shipmentResult.shipmentId) {
            console.log('\n4️⃣ Testing Auto Courier Assignment & AWB Generation...');
            const awbResult = await shiprocketService.autoAssignCourierAndGenerateAWB(
                shipmentResult.shiprocketOrderId,
                shipmentResult.shipmentId,
                orderData.orderId,
                1000
            );
            console.log('Shiprocket AWB Result:', JSON.stringify(awbResult, null, 2));
        }
    } catch (srErr) {
        console.error('Shiprocket Error:', srErr.message);
    }

    console.log('====================================================');
}

testFullOrderProcessing().catch(console.error);
