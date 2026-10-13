const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const delhiveryService = require('../src/shared/services/delhiveryService');

async function runTest() {
    console.log("Starting Delhivery Integration Test...");
    console.log("Using API Token starting with:", (process.env.DELHIVERY_API_TOKEN || '').substring(0, 10) + '...');

    const dummyOrder = {
        orderId: "TEST_ORD_" + Date.now(),
        customerName: "Sumanth HP",
        phone: "8618570325",
        paymentMethod: "COD",
        total: 1500,
        businessName: "Goodkart Test",
        shippingAddress: {
            addressLine1: "#1078, Vidyaranyapura last bus stop",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560097",
            country: "India"
        },
        items: [
            { name: "Test Product 1", quantity: 1, weight: 0.5 },
            { name: "Test Product 2", quantity: 2, weight: 0.2 }
        ]
    };

    console.log("\nPlacing order to Delhivery...");
    
    try {
        const result = await delhiveryService.createShipment(dummyOrder);
        console.log("\n--- RESULT ---");
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log("\n✅ SUCCESS! AWB Number Generated:", result.waybill);
            console.log("You can now go to your Delhivery Dashboard and cancel this order so you don't get charged!");
        } else {
            console.log("\n❌ FAILED. Error from Delhivery:", result.error);
        }
    } catch (err) {
        console.error("\n❌ SCRIPT ERROR:", err);
    }
    
    process.exit(0);
}

runTest();
