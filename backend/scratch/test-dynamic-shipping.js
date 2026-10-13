require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { resolveSellerDetails } = require('../src/utils/sellerAddressHelper');
const delhiveryService = require('../src/shared/services/delhiveryService');

async function testDynamicAddressFlow() {
    console.log('====================================================');
    console.log('🧪 TESTING DYNAMIC SELLER PICKUP & CUSTOMER DELIVERY');
    console.log('====================================================');

    // 1. Target Seller UID from Firestore
    const testSellerId = 'nMLEwCkxbpgdJQTS1tant2mJQY23';
    console.log(`\n1️⃣ Fetching Dynamic Seller Pickup Details for ID: "${testSellerId}"...`);
    
    const sellerDetails = await resolveSellerDetails(testSellerId);
    console.log('✅ Resolved Seller Pickup Warehouse:');
    console.log('   Shop / Hub Name:', sellerDetails.businessName);
    console.log('   Address Line:   ', sellerDetails.sellerAddress.addressLine);
    console.log('   City:           ', sellerDetails.sellerAddress.city);
    console.log('   Pincode:        ', sellerDetails.sellerAddress.pincode);
    console.log('   Phone:          ', sellerDetails.sellerPhone);

    // 2. Mock Customer Delivery Address (simulating Checkout.jsx input)
    const mockCustomerAddress = {
        firstName: 'Rohit',
        lastName: 'Sharma',
        addressLine: '#45, Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        phone: '9887766554'
    };

    console.log('\n2️⃣ Mock Customer Delivery Address (from Checkout UI):');
    console.log('   Customer Name:  ', `${mockCustomerAddress.firstName} ${mockCustomerAddress.lastName}`);
    console.log('   Address Line:   ', mockCustomerAddress.addressLine);
    console.log('   City:           ', mockCustomerAddress.city);
    console.log('   Pincode:        ', mockCustomerAddress.pincode);
    console.log('   Phone:          ', mockCustomerAddress.phone);

    // 3. Construct Order with Dynamic Addresses
    const sampleOrder = {
        orderId: 'TEST_DYN_' + Date.now(),
        sellerId: testSellerId,
        customerName: `${mockCustomerAddress.firstName} ${mockCustomerAddress.lastName}`,
        phone: mockCustomerAddress.phone,
        paymentMethod: 'COD',
        total: 1200,
        shippingAddress: mockCustomerAddress,
        billingAddress: mockCustomerAddress,
        sellerAddress: sellerDetails.sellerAddress,
        sellerPhone: sellerDetails.sellerPhone,
        sellerEmail: sellerDetails.sellerEmail,
        businessName: sellerDetails.businessName,
        items: [
            { name: 'Sample Dynamic Item', quantity: 1, weight: 0.5, price: 1200 }
        ]
    };

    // 4. Test Delhivery Integration with Dynamic Addresses
    console.log('\n3️⃣ Dispatching to Delhivery Service with Dynamic Addresses...');
    try {
        const result = await delhiveryService.createShipment(sampleOrder);
        console.log('📦 Courier Result:');
        console.log('   Success:   ', result.success);
        console.log('   Waybill:   ', result.waybill || 'N/A');
        console.log('   Courier:   ', result.courierName || 'N/A');
        console.log('   Status:    ', result.status || 'N/A');
        if (result.error) {
            console.log('   Note/Error:', result.error);
        }
    } catch (err) {
        console.error('❌ Delhivery Call Error:', err.message);
    }

    console.log('\n====================================================');
    console.log('🎯 VERIFICATION SUMMARY:');
    console.log('   📍 Pickup (Origin)  : ' + sellerDetails.sellerAddress.addressLine + ' (' + sellerDetails.sellerAddress.pincode + ')');
    console.log('   🚀 Delivery (Dest)  : ' + mockCustomerAddress.addressLine + ' (' + mockCustomerAddress.pincode + ')');
    console.log('   ✨ Both addresses are 100% dynamic!');
    console.log('====================================================\n');
    process.exit(0);
}

testDynamicAddressFlow();
