require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const shiprocketService = require('../src/shared/services/shiprocketService');

async function testShiprocketFlow() {
    console.log('----------------------------------------------------');
    console.log('🚀 TESTING SHIPROCKET INTEGRATION & AWB GENERATION');
    console.log('----------------------------------------------------');

    const testOrderId = 'TEST_OD_' + Date.now();

    const sampleOrderData = {
        orderId: testOrderId,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '9876543210',
        paymentMethod: 'COD',
        total: 499,
        shippingAddress: {
            addressLine: '123 Main St, Koramangala',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560034',
            country: 'India'
        },
        items: [
            {
                id: 'prod_1',
                name: 'Test Product Item',
                price: 499,
                quantity: 1,
                sku: 'SKU-TEST-001'
            }
        ]
    };

    console.log(`\n1️⃣ Step 1: Creating Shipment for Order ${testOrderId}...`);
    const shipmentResult = await shiprocketService.createShipment(sampleOrderData);

    console.log('\n📦 Shipment Result:', JSON.stringify(shipmentResult, null, 2));

    if (!shipmentResult.success) {
        console.error('\n❌ Shipment creation failed. Cannot proceed to AWB generation.');
        process.exit(1);
    }

    const { shiprocketOrderId, shipmentId } = shipmentResult;

    console.log(`\n2️⃣ Step 2: Testing AWB Generation for Shipment ID ${shipmentId} (Order ID ${shiprocketOrderId})...`);
    console.log('Running autoAssignCourierAndGenerateAWB with multi-courier fallback...');

    const awbResult = await shiprocketService.autoAssignCourierAndGenerateAWB(
        shiprocketOrderId,
        shipmentId,
        testOrderId,
        1000
    );

    console.log('\n📄 AWB Generation Result:', JSON.stringify(awbResult, null, 2));

    if (awbResult.success) {
        console.log('\n🎉 SUCCESS! AWB code generated:', awbResult.awbNumber);
        console.log('Assigned Courier:', awbResult.courierName);
    } else {
        console.log('\n⚠️ AWB Generation completed with error diagnostic:', awbResult.error);
    }

    console.log('----------------------------------------------------');
}

testShiprocketFlow().catch(console.error);
