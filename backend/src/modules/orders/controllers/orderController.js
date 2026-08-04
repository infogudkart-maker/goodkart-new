'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');
const invoiceService = require('../../../shared/services/invoiceService');
const emailService = require('../../../shared/services/emailService');
const { reduceStock, replenishStock } = require('../../../utils/stockUtils');
const shiprocketService = require('../../../shared/services/shiprocketService');

const ORDERS_CACHE_TTL = 120; // 2 minutes in seconds

/**
 * Handles placing a new order.
 */
const placeOrder = async (req, res) => {
    try {
        const { uid, orderData } = req.body;
        if (!uid || !orderData) return res.status(400).json({ success: false, message: "Missing data" });

        const orderRef = await db.collection("orders").add({
            ...orderData,
            userId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "Placed",
            invoiceGenerated: false
        });

        const orderId = orderRef.id;
        const fullOrder = { ...orderData, orderId: orderData.orderId || orderId, documentId: orderId };

        try {
            const invoiceUrl = await invoiceService.generateInvoice(fullOrder);
            await orderRef.update({ invoiceGenerated: true, invoiceUrl });
            if (orderData.email) {
                emailService.sendOrderConfirmation(orderData.email, fullOrder, invoiceUrl).catch(err => console.error(err));
            }
            // Notify sellers about the new order
            emailService.notifySellers(fullOrder).catch(err => console.error('[PlaceOrder] Seller notification error:', err));
        } catch (e) {
            console.error("Invoice skip:", e.message);
        }

        // Invalidate user's order cache
        cache.invalidate(`userOrders_${uid}`, 'adminAllOrders');
        cache.invalidatePrefix('adminStats');

        // Reduce stock atomically
        if (orderData.items) {
            reduceStock(orderData.items).catch(err => console.error("Stock reduction error:", err));
        }

        return res.status(200).json({ success: true, orderId, message: "Order placed successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Order placement failed" });
    }
};

/**
 * Get orders for a specific user.
 * Cached per user for 2 minutes.
 */
const getUserOrders = async (req, res) => {
    try {
        const { uid } = req.params;
        const cacheKey = `userOrders_${uid}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, orders: cached });

        const snapshot = await db.collection("orders").where("userId", "==", uid).get();
        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                deliveredAt: data.deliveredAt?.toDate?.() ? data.deliveredAt.toDate().toISOString() : data.deliveredAt,
                cancelledAt: data.cancelledAt?.toDate?.() ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
                paymentCollectedAt: data.paymentCollectedAt?.toDate?.() ? data.paymentCollectedAt.toDate().toISOString() : data.paymentCollectedAt,
                shiprocketCreatedAt: data.shiprocketCreatedAt?.toDate?.() ? data.shiprocketCreatedAt.toDate().toISOString() : data.shiprocketCreatedAt
            };
        });
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        cache.set(cacheKey, orders, ORDERS_CACHE_TTL);
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

/**
 * Get an order by ID.
 * Cached per order for 5 minutes.
 */
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const cacheKey = `order_${orderId}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, order: cached });

        const doc = await db.collection("orders").doc(orderId).get();
        let order;
        if (!doc.exists) {
            const query = await db.collection("orders").where("orderId", "==", orderId).limit(1).get();
            if (query.empty) return res.status(404).json({ success: false, message: "Order not found" });
            const data = query.docs[0].data();
            order = {
                id: query.docs[0].id,
                ...data,
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                deliveredAt: data.deliveredAt?.toDate?.() ? data.deliveredAt.toDate().toISOString() : data.deliveredAt,
                cancelledAt: data.cancelledAt?.toDate?.() ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
                paymentCollectedAt: data.paymentCollectedAt?.toDate?.() ? data.paymentCollectedAt.toDate().toISOString() : data.paymentCollectedAt,
                shiprocketCreatedAt: data.shiprocketCreatedAt?.toDate?.() ? data.shiprocketCreatedAt.toDate().toISOString() : data.shiprocketCreatedAt
            };
        } else {
            const data = doc.data();
            order = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                deliveredAt: data.deliveredAt?.toDate?.() ? data.deliveredAt.toDate().toISOString() : data.deliveredAt,
                cancelledAt: data.cancelledAt?.toDate?.() ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
                paymentCollectedAt: data.paymentCollectedAt?.toDate?.() ? data.paymentCollectedAt.toDate().toISOString() : data.paymentCollectedAt,
                shiprocketCreatedAt: data.shiprocketCreatedAt?.toDate?.() ? data.shiprocketCreatedAt.toDate().toISOString() : data.shiprocketCreatedAt
            };
        }

        cache.set(cacheKey, order);
        return res.status(200).json({ success: true, order });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch order" });
    }
};

/**
 * Cancel an order.
 */
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cancellationReason } = req.body;
        const uid = req.user?.uid;
        
        console.log(`[CANCEL REQUEST] Order: ${orderId} | User: ${uid} | Reason: ${cancellationReason}`);
        
        if (!uid) {
            console.error("[CANCEL] Missing user UID in request");
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (!cancellationReason || !cancellationReason.trim()) {
            return res.status(400).json({ success: false, message: "Cancellation reason is required" });
        }

        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderData = orderSnap.data();

        // Ensure the user owns the order
        if (orderData.uid !== uid && orderData.userId !== uid) {
            console.warn(`[CANCEL] Access Denied: User ${uid} trying to cancel order owned by ${orderData.userId || orderData.uid}`);
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Check if order can be cancelled
        if (orderData.status === "Cancelled") {
            console.log(`[CANCEL] Order ${orderId} is already cancelled. Returning success.`);
            return res.status(200).json({ success: true, message: "Order is already cancelled" });
        }

        if (["Shipped", "Delivered"].includes(orderData.status)) {
            console.warn(`[CANCEL] Invalid state: Order ${orderId} is in ${orderData.status} state`);
            return res.status(400).json({ success: false, message: `Cannot cancel order in ${orderData.status} state` });
        }

        // Handle Shiprocket cancellation if applicable
        if (orderData.shiprocketOrderId) {
            try {
                const shiprocketResult = await shiprocketService.cancelOrder(orderData.shiprocketOrderId, orderId);
                if (!shiprocketResult.success) {
                    console.error("Failed to cancel Shiprocket order:", shiprocketResult.error);
                }
            } catch (shiprocketErr) {
                console.error("SHIPROCKET SERVICE CRASH:", shiprocketErr);
            }
        }

        // Determine refund information
        let refundInfo = null;
        if (orderData.paymentMethod === 'razorpay' || orderData.paymentMethod === 'online') {
            refundInfo = {
                message: 'Your refund will be processed shortly.',
                refundAmount: orderData.total || 0,
                refundMethod: 'Original Payment Method',
                processingTime: '5-7 business days'
            };
        } else if (orderData.paymentMethod === 'cod') {
            refundInfo = {
                message: 'No refund applicable for Cash on Delivery orders.',
                refundAmount: 0,
                refundMethod: 'Not Applicable',
                processingTime: 'N/A'
            };
        }

        // Update status with cancellation reason and refund details
        const updateData = {
            status: "Cancelled",
            cancellationReason: cancellationReason.trim(),
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelledBy: uid
        };

        if (refundInfo && refundInfo.refundAmount > 0) {
            updateData.refundStatus = 'Pending';
            updateData.refundAmount = refundInfo.refundAmount;
            updateData.refundMethod = refundInfo.refundMethod;
            updateData.refundProcessingTime = refundInfo.processingTime;
        } else {
            updateData.refundStatus = 'Not Applicable';
            updateData.refundAmount = 0;
        }

        try {
            await orderRef.update(updateData);
        } catch (updateErr) {
            console.error("FIRESTORE UPDATE ERROR:", updateErr);
            throw updateErr;
        }

        // Replenish stock
        if (orderData.items) {
            replenishStock(orderData.items).catch(err => console.error("Stock replenishment error:", err));
        }

        // Invalidate caches
        try {
            cache.invalidate(`userOrders_${uid}`, 'adminAllOrders');
            
            // Invalidate cache for ALL sellers in this order
            if (orderData.sellerId) {
                cache.invalidate(`sellerDash_${orderData.sellerId}`);
            }
            
            // Also invalidate cache for sellers of individual items
            if (orderData.items && Array.isArray(orderData.items)) {
                const sellerIds = new Set();
                orderData.items.forEach(item => {
                    if (item.sellerId) {
                        sellerIds.add(item.sellerId);
                    }
                });
                sellerIds.forEach(sellerId => {
                    cache.invalidate(`sellerDash_${sellerId}`);
                });
            }
            
            cache.invalidate('adminStats', 'allSellers');
        } catch (cacheErr) {
            console.error("CACHE INVALIDATION ERROR:", cacheErr);
            // Don't throw, cache failure shouldn't block cancellation success message
        }

        // Optional: Send cancellation email
        if (orderData.email) {
            emailService.sendOrderCancellation(orderData.email, {
                orderId: orderData.orderId,
                customerName: orderData.customerName,
                total: orderData.total,
                items: orderData.items
            }).catch(e => console.error("Cancellation email error:", e));
        }

        return res.status(200).json({ 
            success: true, 
            message: "Order cancelled successfully",
            refundInfo
        });
    } catch (error) {
        console.error("CANCEL ORDER ERROR:", error);
        return res.status(500).json({ success: false, message: `Failed to cancel order: ${error.message}` });
    }
};

/**
 * Get reviewable orders for a user
 */
const getReviewableOrders = async (req, res) => {
    try {
        const { uid } = req.params;
        
        // Get all delivered orders for the user
        const snapshot = await db.collection("orders")
            .where("userId", "==", uid)
            .where("status", "==", "Delivered")
            .get();

        // Get all reviews by this user to filter out already reviewed products
        const reviewsSnapshot = await db.collection("reviews")
            .where("userId", "==", uid)
            .get();
        
        const reviewedProductIds = new Set();
        reviewsSnapshot.forEach(doc => {
            const reviewData = doc.data();
            if (reviewData.productId) {
                reviewedProductIds.add(reviewData.productId);
            }
        });

        const reviewableOrders = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            for (const item of data.items || []) {
                const productId = item.productId || item.id;
                // Only include if not already reviewed
                if (!reviewedProductIds.has(productId)) {
                    reviewableOrders.push({
                        orderId: data.orderId || doc.id,
                        productId: productId,
                        productName: item.name,
                        productImage: item.imageUrl || item.image,
                        deliveredAt: data.deliveredAt || data.updatedAt || data.createdAt
                    });
                }
            }
        }
        return res.status(200).json({ success: true, orders: reviewableOrders });
    } catch (error) {
        console.error("Fetch Reviewable orders error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch reviewable orders" });
    }
}

/**
 * Download/Redirect to Invoice
 */
const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { regenerate } = req.query;
        const query = await db.collection("orders").where("orderId", "==", orderId).limit(1).get();

        let docSnap;
        if (query.empty) {
            docSnap = await db.collection("orders").doc(orderId).get();
            if (!docSnap.exists) return res.status(404).json({ success: false, message: "Order not found" });
        } else {
            docSnap = query.docs[0];
        }

        const order = docSnap.data();
        
        // Force regeneration during development/testing to see layout changes immediately
        console.log(`[INVOICE] Generating fresh invoice for order: ${orderId}`);
        const invoiceUrl = await invoiceService.generateInvoice({ ...order, documentId: docSnap.id });
        await docSnap.ref.update({ invoiceGenerated: true, invoiceUrl });
        return res.redirect(invoiceUrl);
    } catch (error) {
        console.error("Invoice download error:", error);
        return res.status(500).json({ success: false, message: "Failed to download invoice" });
    }
}

/**
 * Fetch shipping label for an order.
 */
const getShippingLabel = async (req, res) => {
    try {
        let { orderId } = req.params;
        let orderDoc = await db.collection("orders").doc(orderId).get();
        let orderData;

        if (!orderDoc.exists) {
            const query = await db.collection("orders").where("orderId", "==", orderId).limit(1).get();
            if (query.empty) return res.status(404).json({ success: false, message: "Order not found" });
            orderDoc = query.docs[0];
            orderId = orderDoc.id; // Assign Firebase ID
            orderData = orderDoc.data();
        } else {
            orderData = orderDoc.data();
        }

        if (!orderData.shipmentId) {
            return res.status(400).json({
                success: false,
                message: "Shipment not yet created for this order. AWB must be generated first."
            });
        }

        // Return cached label URL if already fetched
        if (orderData.labelUrl) {
            return res.status(200).json({ success: true, labelUrl: orderData.labelUrl });
        }

        const labelResult = await shiprocketService.getShippingLabel([orderData.shipmentId]);

        if (labelResult.success && labelResult.labelUrl) {
            // Cache result in Firestore
            await db.collection("orders").doc(orderId).update({ labelUrl: labelResult.labelUrl });
            return res.status(200).json({ success: true, labelUrl: labelResult.labelUrl });
        } else {
            return res.status(400).json({
                success: false,
                message: labelResult.error || "Failed to generate shipping label"
            });
        }
    } catch (error) {
        console.error("[LABEL] Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch shipping label" });
    }
};

module.exports = {
    placeOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getReviewableOrders,
    downloadInvoice,
    getShippingLabel
};
