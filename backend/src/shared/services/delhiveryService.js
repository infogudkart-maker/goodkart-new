'use strict';
const axios = require('axios');
const { admin, db } = require('../../config/firebase');

const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com';
const API_TOKEN = process.env.DELHIVERY_API_TOKEN;

/**
 * Maps Goodkart order data to Delhivery's package creation payload.
 */
const formatOrderForDelhivery = (orderData) => {
    // Delhivery expects specific formats. This is a standard B2C payload.
    // Note: This will be refined based on the exact UCP API documentation.

    let totalWeight = 0;
    const items = orderData.items || [];
    items.forEach(item => {
        totalWeight += parseFloat(item.weight || 0.5) * parseInt(item.quantity || 1);
    });
    // Fallback if no weights were provided
    if (totalWeight === 0) totalWeight = 0.5;

    return {
        format: "json",
        data: {
            shipments: [
                {
                    name: orderData.customerName || "Customer",
                    add: orderData.shippingAddress.addressLine1 || "Address",
                    pin: orderData.shippingAddress.pincode,
                    city: orderData.shippingAddress.city,
                    state: orderData.shippingAddress.state,
                    country: orderData.shippingAddress.country || "India",
                    phone: orderData.phone,
                    order: orderData.orderId,
                    payment_mode: orderData.paymentMethod === 'COD' ? 'COD' : 'Pre-paid',
                    return_pin: orderData.sellerAddress?.pincode || process.env.STORE_RETURN_PINCODE || orderData.shippingAddress.pincode,
                    return_city: orderData.sellerAddress?.city || process.env.STORE_RETURN_CITY || orderData.shippingAddress.city,
                    return_phone: orderData.sellerPhone || process.env.STORE_PHONE || "9999999999",
                    return_add: orderData.sellerAddress?.addressLine || process.env.STORE_ADDRESS || "Store Address",
                    return_state: orderData.sellerAddress?.state || process.env.STORE_STATE || orderData.shippingAddress.state,
                    return_country: "India",
                    products_desc: items.map(i => i.name).join(", "),
                    hsn_code: "", // Optional
                    cod_amount: orderData.paymentMethod === 'COD' ? orderData.total : 0,
                    order_date: new Date().toISOString().split('T')[0],
                    total_amount: orderData.total,
                    seller_add: orderData.sellerAddress?.addressLine || "",
                    seller_name: orderData.businessName || "Goodkart",
                    seller_inv: orderData.orderId,
                    quantity: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
                    waybill: "",
                    shipment_width: 10,
                    shipment_height: 10,
                    shipment_depth: 10,
                    weight: totalWeight,
                    pickup_location: orderData.businessName || process.env.STORE_NAME || "Goodkart Warehouse"
                }
            ],
            pickup_location: {
                name: orderData.businessName || process.env.STORE_NAME || "Goodkart Warehouse",
                add: orderData.sellerAddress?.addressLine || process.env.STORE_ADDRESS || "Warehouse Address",
                city: orderData.sellerAddress?.city || process.env.STORE_CITY || "Warehouse City",
                pin_code: orderData.sellerAddress?.pincode || process.env.STORE_PINCODE || "110001",
                country: "India",
                phone: orderData.sellerPhone || process.env.STORE_PHONE || "9999999999"
            }
        }
    };
};

/**
 * Creates a shipment in Delhivery
 */
exports.createShipment = async (orderData) => {
    try {
        if (!API_TOKEN || API_TOKEN === 'dummy_token_for_now') {
            console.log(`[Delhivery] Sandbox Mode: Skipping real API call for order ${orderData.orderId} due to dummy token.`);
            return {
                success: true,
                waybill: "DUMMY_AWB_" + Date.now(),
                delhiveryOrderId: "DUMMY_ORDER_" + Date.now(),
                courierName: "Delhivery Direct (Test)",
                status: "Pending"
            };
        }

        // Auto-register seller pickup warehouse dynamically with Delhivery if provided
        const pickupName = orderData.businessName || process.env.STORE_NAME || "Goodkart Warehouse";
        if (orderData.sellerAddress || orderData.businessName) {
            try {
                await exports.createPickupAddress({
                    pickup_location: pickupName,
                    name: pickupName,
                    phone: orderData.sellerPhone || process.env.STORE_PHONE || "9999999999",
                    email: process.env.STORE_EMAIL || "seller@goodkart.com",
                    address: orderData.sellerAddress?.addressLine || process.env.STORE_ADDRESS || "Warehouse Address",
                    pin_code: orderData.sellerAddress?.pincode || process.env.STORE_PINCODE || "110001",
                    city: orderData.sellerAddress?.city || process.env.STORE_CITY || "Warehouse City",
                    state: orderData.sellerAddress?.state || process.env.STORE_STATE || "State",
                    country: "India"
                });
            } catch (whErr) {
                console.log(`[Delhivery] Warehouse auto-registration note for "${pickupName}":`, whErr.message);
            }
        }

        const payload = formatOrderForDelhivery(orderData);
        // Using form data string format because Delhivery's /api/cmu/create.json expects `format=json&data={...}`
        const formData = new URLSearchParams();
        formData.append('format', 'json');
        formData.append('data', JSON.stringify(payload.data));

        const response = await axios.post(`${DELHIVERY_API_URL}/api/cmu/create.json`, formData.toString(), {
            headers: {
                'Authorization': `Token ${API_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = response.data;
        if (data?.packages?.[0]?.remarks) {
            console.error("[Delhivery] Package Remarks:", data.packages[0].remarks);
        }

        if (data && data.success === true && data.packages && data.packages.length > 0 && data.packages[0].waybill) {
            const pkg = data.packages[0];
            return {
                success: true,
                waybill: pkg.waybill,
                delhiveryOrderId: pkg.refnum, // reference number usually acts as order id
                status: pkg.status,
                courierName: "Delhivery Direct"
            };
        } else {
            console.error("[Delhivery] Shipment Creation Failed:", data);
            const remarkMsg = data?.packages?.[0]?.remarks?.join(', ') || data?.rmk || "Failed to create Delhivery shipment";
            return {
                success: false,
                error: remarkMsg
            };
        }

    } catch (error) {
        console.error('[Delhivery] API Error in createShipment:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Maps Delhivery webhook status to Goodkart internal status
 */
exports.mapDelhiveryStatus = (status) => {
    const statusMap = {
        'Manifested': 'MANIFESTED',
        'In Transit': 'IN_TRANSIT',
        'Dispatched': 'SHIPPED',
        'Pending': 'PENDING',
        'Delivered': 'DELIVERED',
        'RTO': 'RTO',
        'Returned': 'RETURNED',
        'Cancelled': 'CANCELLED'
    };
    return statusMap[status] || 'PENDING';
};

/**
 * Verify webhook signature (Delhivery doesn't always use signatures, sometimes they use IP whitelisting or custom headers. We will refine this).
 */
exports.verifyWebhookSignature = (req) => {
    // Basic check for now. You might want to check against a specific token in the headers.
    return true;
};

/**
 * Cancels an order in Delhivery
 */
exports.cancelOrder = async (waybill, orderId) => {
    try {
        if (!API_TOKEN || API_TOKEN === 'dummy_token_for_now') {
            console.log(`[Delhivery] Sandbox Mode: Skipping cancel API call for order ${orderId} / AWB ${waybill}.`);
            return { success: true };
        }

        const payload = {
            waybill: waybill,
            cancellation: true
        };

        const response = await axios.post(`${DELHIVERY_API_URL}/api/p/edit`, payload, {
            headers: {
                'Authorization': `Token ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.status === true) {
            return { success: true };
        } else {
            return { success: false, error: response.data.error || 'Cancellation failed' };
        }
    } catch (error) {
        console.error('[Delhivery] Cancel Error:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Fetches shipping label URL
 */
exports.getShippingLabel = async (waybill) => {
    try {
        if (!API_TOKEN || API_TOKEN === 'dummy_token_for_now') {
            return { success: true, labelUrl: 'https://track.delhivery.com/dummy-label.pdf' };
        }

        const response = await axios.get(`${DELHIVERY_API_URL}/api/p/packing_slip?wbns=${waybill}`, {
            headers: {
                'Authorization': `Token ${API_TOKEN}`
            }
        });

        if (response.data && response.data.packages && response.data.packages.length > 0) {
            // Delhivery might return binary PDF or a link. Assuming it returns a link or base64 here.
            // Needs refinement based on actual API payload for labels.
            return { success: true, labelUrl: `https://track.delhivery.com/api/p/packing_slip?wbns=${waybill}` }; // Or real URL from response
        } else {
            return { success: false, error: 'Label not found' };
        }
    } catch (error) {
        console.error('[Delhivery] Label Error:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Creates a pickup location/address in Delhivery
 */
exports.createPickupAddress = async (sellerData) => {
    try {
        if (!API_TOKEN || API_TOKEN === 'dummy_token_for_now') {
            console.log(`[Delhivery] Sandbox Mode: Skipping createPickupAddress for ${sellerData.pickup_location}`);
            return {
                success: true,
                message: "Pickup address created successfully (Sandbox)",
                pickupId: sellerData.pickup_location || "DUMMY_PICKUP_" + Date.now()
            };
        }

        const pickupName = sellerData.pickup_location || sellerData.name;
        const payload = {
            name: pickupName,
            phone: sellerData.phone,
            email: sellerData.email,
            address: sellerData.address,
            pin: sellerData.pin_code || sellerData.pin,
            city: sellerData.city,
            state: sellerData.state,
            country: sellerData.country || "India",
            return_address: sellerData.address,
            return_pin: sellerData.pin_code || sellerData.pin,
            return_city: sellerData.city,
            return_state: sellerData.state,
            return_country: sellerData.country || "India"
        };

        const response = await axios.post(`${DELHIVERY_API_URL}/api/backend/clientwarehouse/create/`, payload, {
            headers: {
                'Authorization': `Token ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && (response.data.success || response.data.status === true)) {
            return {
                success: true,
                message: "Pickup address created successfully",
                pickupId: sellerData.pickup_location
            };
        } else {
            return {
                success: false,
                error: response.data.error || response.data.message || "Failed to create pickup location"
            };
        }
    } catch (error) {
        console.error('[Delhivery] createPickupAddress Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message
        };
    }
};


