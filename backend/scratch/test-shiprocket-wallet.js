require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const shiprocketService = require('../src/shared/services/shiprocketService');

async function testWalletAndAWB() {
    console.log('====================================================');
    console.log('🧪 DIAGNOSING SHIPROCKET ACCOUNT & AWB GENERATION');
    console.log('====================================================');

    const token = await shiprocketService.getAuthToken();
    console.log('🔐 Auth Token obtained:', !!token);

    if (!token) {
        console.error('❌ Failed to authenticate with Shiprocket');
        return;
    }

    // 1. Fetch Company & Wallet Details if endpoint available
    try {
        console.log('\n1️⃣ Checking Shiprocket Pickup Locations & Company Settings...');
        const pickupRes = await shiprocketService.makeApiRequest(
            `${shiprocketService.apiUrl}/settings/company/pickup`,
            null,
            { retries: 1, requiresAuth: true, method: 'GET' }
        );
        console.log('📍 Registered Pickup Locations count:', pickupRes?.data?.shipping_address?.length || 0);
        if (pickupRes?.data?.shipping_address) {
            pickupRes.data.shipping_address.forEach(loc => {
                console.log(`   - Location: "${loc.pickup_location}", Pin: ${loc.pin_code}, Status: ${loc.status}, ID: ${loc.id}`);
            });
        }
    } catch (e) {
        console.error('Error fetching settings:', e.message);
    }

    // 2. Create a test order to get fresh shipmentId
    const testOrderId = 'OD_TEST_' + Date.now();
    console.log(`\n2️⃣ Creating shipment for test order (${testOrderId})...`);
    
    const orderData = {
        orderId: testOrderId,
        customerName: 'Shreyas S',
        email: 'reachshreyas.s@gmail.com',
        phone: '7676879059',
        paymentMethod: 'COD',
        total: 5442.60,
        shippingAddress: {
            firstName: 'Shreyas',
            lastName: 'S',
            addressLine: '975, 5th Cross, Koramangala',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560097',
            phone: '7676879059'
        },
        items: [
            {
                id: 'item_1',
                name: 'Levi\'s Jeans',
                price: 5310,
                quantity: 1
            }
        ]
    };

    const shipmentRes = await shiprocketService.createShipment(orderData);
    console.log('📦 Shipment Creation Result:', JSON.stringify(shipmentRes, null, 2));

    if (shipmentRes.success && shipmentRes.shipmentId) {
        console.log(`\n3️⃣ Fetching available couriers for Shipment ${shipmentRes.shipmentId}...`);
        const couriersRes = await shiprocketService.getAvailableCouriers(
            orderData.shippingAddress.pincode,
            orderData.shippingAddress.pincode, // use same pin or seller pin
            0.5,
            orderData.paymentMethod === 'COD' ? 1 : 0
        );
        console.log('🚚 Available Couriers Result:', JSON.stringify(couriersRes, null, 2));

        console.log(`\n4️⃣ Attempting AWB assignment for Shipment ${shipmentRes.shipmentId}...`);
        const awbRes = await shiprocketService.autoAssignCourierAndGenerateAWB(
            shipmentRes.shiprocketOrderId,
            shipmentRes.shipmentId,
            testOrderId,
            1000
        );
        console.log('🏷️ Final AWB Assignment Result:', JSON.stringify(awbRes, null, 2));
    }
}

testWalletAndAWB().catch(console.error);
