'use strict';
const { admin, db } = require('../../../config/firebase');
const razorpay = require('../../../config/razorpay');
const crypto = require('crypto');
const invoiceService = require('../../../shared/services/invoiceService');
const emailService = require('../../../shared/services/emailService');
const shiprocketService = require('../../../shared/services/shiprocketService');
const { reduceStock } = require('../../../utils/stockUtils');

/**
 * Handle Razorpay order creation.
 */
const createOrder = async (req, res) => {
    try {
        const { amount, cartItems, customerInfo } = req.body;
        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: 'order_' + Date.now(),
            notes: { customerName: customerInfo?.firstName || 'Customer', itemCount: String(cartItems?.length || 0) },
        };
        const order = await razorpay.orders.create(options);
        return res.status(200).json({ success: true, order: { id: order.id, amount: order.amount, currency: order.currency }, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to create payment" });
    }
};

/**
 * Process post-order tasks in the background.
 * This prevents HTTP timeouts during long operations like PDF generation or Shiprocket API calls.
 */
const processPostOrderTasks = async (orderData, orderRef) => {
    try {
        console.log(`[Background] Processing post-order tasks for Order ID: ${orderData.orderId}`);

        // 1. Generate Invoice & Send Emails
        try {
            const invoiceUrl = await invoiceService.generateInvoice({ ...orderData, documentId: orderRef.id });
            await orderRef.update({ invoiceGenerated: true, invoiceUrl: invoiceUrl });
            
            if (orderData.email) {
                emailService.sendOrderConfirmation(orderData.email, { ...orderData, documentId: orderRef.id }, invoiceUrl)
                    .catch(err => console.error('[Background] Confirmation email error:', err));
            }
            
            // Notify sellers about the new order
            emailService.notifySellers({ ...orderData, documentId: orderRef.id })
                .catch(err => console.error('[Background] Seller notification error:', err));
        } catch (invoiceErr) {
            console.error("[Background] Invoice/Email logic error:", invoiceErr.message);
        }

        // 2. Handle Shiprocket Shipment
        try {
            const shipmentResult = await shiprocketService.createShipment({ ...orderData, orderId: orderData.orderId });
            if (shipmentResult.success) {
                await orderRef.update({ 
                    shiprocketOrderId: shipmentResult.shiprocketOrderId, 
                    shipmentId: shipmentResult.shipmentId, 
                    awbNumber: shipmentResult.awbNumber, 
                    courierName: shipmentResult.courierName,
                    courierRate: shipmentResult.courierRate || null,
                    actualShippingCharge: shipmentResult.courierRate || null,
                    estimatedDeliveryDays: shipmentResult.estimatedDeliveryDays || null,
                    shiprocketCreatedAt: admin.firestore.FieldValue.serverTimestamp() 
                });
            }
        } catch (shiprocketErr) {
            console.error("[Background] Shiprocket logic error:", shiprocketErr.message);
        }

        // 3. Reduce stock atomically
        if (orderData.items) {
            reduceStock(orderData.items).catch(err => console.error("[Background] Stock reduction error:", err));
        }

        console.log(`[Background] Completed tasks for Order ID: ${orderData.orderId}`);
    } catch (criticalErr) {
        console.error("[Background] Critical error in post-order processing:", criticalErr);
    }
};

/**
 * Handle payment verification and result processing.
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, cartItems, customerInfo, amount, uid, platformFeeBreakdown, couponDiscount, effectivePlatformFee } = req.body;
        const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');

        if (expected !== razorpay_signature) return res.status(400).json({ success: false, message: "Invalid signature" });

        const orderId = "OD" + Date.now();
        const sellerId = (cartItems || []).find(i => i?.sellerId)?.sellerId || null;

        const orderData = {
            orderId, userId: uid || "guest", sellerId,
            customerName: `${customerInfo?.firstName || ""} ${customerInfo?.lastName || ""}`.trim(),
            email: customerInfo?.email || "", phone: customerInfo?.phone || "",
            shippingAddress: customerInfo?.shippingAddress || customerInfo?.address || {},
            billingAddress: customerInfo?.billingAddress || customerInfo?.address || {},
            customerInfo: customerInfo,
            gstNumber: customerInfo?.gstNumber || null,
            businessName: customerInfo?.businessName || null,
            items: cartItems || [],
            total: amount || 0, paymentMethod: "RAZORPAY", paymentId: razorpay_payment_id,
            estimatedShippingCharge: customerInfo?.estimatedShippingCharge || 0,
            actualShippingCharge: null,
            platformFeeBreakdown: platformFeeBreakdown || null,
            effectivePlatformFee: effectivePlatformFee || null,
            couponDiscount: couponDiscount || 0,
            paymentStatus: "Completed",
            status: "Processing", createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const orderRef = await db.collection("orders").add(orderData);

        // START BACKGROUND TASKS - use setImmediate for true non-blocking
        setImmediate(() => processPostOrderTasks(orderData, orderRef));

        return res.status(200).json({ success: true, orderId: orderData.orderId, documentId: orderRef.id });
    } catch (error) {
        console.error("verifyPayment Error:", error);
        return res.status(500).json({ success: false, message: "Verification failed" });
    }
};

const codOrder = async (req, res) => {
    try {
        const { cartItems, customerInfo, amount, uid, platformFeeBreakdown, couponDiscount, effectivePlatformFee } = req.body;
        const orderId = "OD" + Date.now();
        const resolvedSellerId = (cartItems || []).find(i => i?.sellerId)?.sellerId || null;

        const orderData = {
            orderId,
            uid: uid || "guest",
            userId: uid || "guest",
            sellerId: resolvedSellerId,
            customerName: `${customerInfo?.firstName || ""} ${customerInfo?.lastName || ""}`.trim(),
            email: customerInfo?.email || "",
            phone: customerInfo?.phone || "",
            shippingAddress: customerInfo?.shippingAddress || customerInfo?.address || {},
            billingAddress: customerInfo?.billingAddress || customerInfo?.address || {},
            customerInfo: customerInfo,
            gstNumber: customerInfo?.gstNumber || null,
            businessName: customerInfo?.businessName || null,
            items: cartItems || [],
            total: amount || 0,
            estimatedShippingCharge: customerInfo?.estimatedShippingCharge || 0,
            actualShippingCharge: null,
            platformFeeBreakdown: platformFeeBreakdown || null,
            effectivePlatformFee: effectivePlatformFee || null,
            couponDiscount: couponDiscount || 0,
            paymentMethod: "COD",
            paymentStatus: "Pending",
            status: "Processing",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const orderRef = await db.collection("orders").add(orderData);

        // START BACKGROUND TASKS - use setImmediate for true non-blocking
        setImmediate(() => processPostOrderTasks(orderData, orderRef));

        return res.status(200).json({ success: true, orderId: orderData.orderId, documentId: orderRef.id });
    } catch (error) {
        console.error("codOrder Error:", error);
        return res.status(500).json({ success: false, message: "COD placement failed" });
    }
};

module.exports = { createOrder, verifyPayment, codOrder };
