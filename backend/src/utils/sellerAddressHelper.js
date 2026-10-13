'use strict';
const { db } = require('../config/firebase');

/**
 * Resolves seller profile information (business name, pickup warehouse address, contact info)
 * dynamically from the Firestore `sellers` collection.
 * 
 * @param {string|null} sellerId - The UID of the seller
 * @param {Array} [cartItems] - Optional cart items array to discover sellerId if not provided directly
 * @returns {Promise<{ sellerId?: string, sellerAddress: Object, sellerPhone: string, sellerEmail: string, businessName: string }>}
 */
const resolveSellerDetails = async (sellerId, cartItems = []) => {
    // Attempt to discover sellerId from cart items if not directly provided
    const resolvedSellerId = sellerId || (cartItems || []).find(i => i?.sellerId)?.sellerId || null;

    const fallbackDetails = {
        sellerAddress: {
            addressLine: process.env.STORE_ADDRESS || 'Industrial Area, Electronic City',
            city: process.env.STORE_CITY || 'Bangalore',
            state: process.env.STORE_STATE || 'Karnataka',
            pincode: process.env.STORE_PINCODE || '560100',
            country: 'India'
        },
        sellerPhone: process.env.STORE_PHONE || '9876543210',
        sellerEmail: process.env.STORE_EMAIL || 'logistics@goodkart.com',
        businessName: process.env.STORE_NAME || 'Goodkart Hub'
    };

    if (!resolvedSellerId) {
        return fallbackDetails;
    }

    try {
        const sellerDoc = await db.collection('sellers').doc(resolvedSellerId).get();
        if (!sellerDoc.exists) {
            console.warn(`[resolveSellerDetails] Seller ${resolvedSellerId} not found in Firestore. Using default hub address.`);
            return fallbackDetails;
        }

        const sellerData = sellerDoc.data();
        const pickupInfo = sellerData.pickupInfo || sellerData.pickupAddress;

        let addressLine = '';
        let city = '';
        let state = '';
        let pincode = '';

        if (typeof pickupInfo === 'string' && pickupInfo.trim().length > 0) {
            addressLine = pickupInfo.trim();
        } else if (pickupInfo && typeof pickupInfo === 'object') {
            addressLine = pickupInfo.pickupAddress || pickupInfo.address || pickupInfo.addressLine || '';
            city = pickupInfo.pickupCity || pickupInfo.city || '';
            state = pickupInfo.pickupState || pickupInfo.state || '';
            pincode = pickupInfo.pickupPincode || pickupInfo.pincode || '';
        }

        // Fallbacks to top-level seller document properties
        addressLine = addressLine || sellerData.pickupAddress || sellerData.address || fallbackDetails.sellerAddress.addressLine;
        city = city || sellerData.pickupCity || sellerData.city || fallbackDetails.sellerAddress.city;
        state = state || sellerData.pickupState || sellerData.state || fallbackDetails.sellerAddress.state;
        pincode = pincode || sellerData.pickupPincode || sellerData.pincode || fallbackDetails.sellerAddress.pincode;

        const phone = sellerData.contactPhone || sellerData.phone || sellerData.phoneNumber || fallbackDetails.sellerPhone;
        const email = sellerData.contactEmail || sellerData.email || fallbackDetails.sellerEmail;
        const businessName = sellerData.shopName || sellerData.businessName || sellerData.supplierName || fallbackDetails.businessName;

        return {
            sellerId: resolvedSellerId,
            sellerAddress: {
                addressLine: String(addressLine).trim(),
                city: String(city).trim(),
                state: String(state).trim(),
                pincode: String(pincode).trim(),
                country: 'India'
            },
            sellerPhone: String(phone).trim(),
            sellerEmail: String(email).trim(),
            businessName: String(businessName).trim()
        };
    } catch (error) {
        console.error(`[resolveSellerDetails] Error fetching seller ${resolvedSellerId}:`, error.message);
        return fallbackDetails;
    }
};

module.exports = { resolveSellerDetails };
