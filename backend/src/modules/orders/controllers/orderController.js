'use strict';

const { admin, db } = require('../../../config/firebase');

const cache = require('../../../utils/cache');

const invoiceService = require('../../../shared/services/invoiceService');

const emailService = require('../../../shared/services/emailService');

const { reduceStock, replenishStock } = require('../../../utils/stockUtils');

const shiprocketService = require('../../../shared/services/shiprocketService');

const path = require('path');

const fs = require('fs');

const ORDERS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// ============================================================
// HELPERS
// ============================================================

const toIso = (value) =>
    value?.toDate?.() ? value.toDate().toISOString() : value;

const serializeOrder = (id, data) => ({
    id,
    ...data,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    deliveredAt: toIso(data.deliveredAt),
    cancelledAt: toIso(data.cancelledAt),
    paymentCollectedAt: toIso(data.paymentCollectedAt),
    shiprocketCreatedAt: toIso(data.shiprocketCreatedAt)
});

const isValidEmail = (value) =>
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Find the customer's email address.
 * Order data first, then users collection, then Firebase Auth.
 */
const resolveCustomerEmail = async (uid, orderData = {}) => {
    const candidates = [
        orderData.email,
        orderData.customerEmail,
        orderData.customerInfo?.email,
        orderData.shippingAddress?.email,
        orderData.billingAddress?.email
    ];

    for (const candidate of candidates) {
        if (isValidEmail(candidate)) return candidate.trim();
    }

    if (!uid) return null;

    try {
        const userDoc = await db.collection('users').doc(uid).get();

        if (userDoc.exists) {
            const userEmail = userDoc.data()?.email;

            if (isValidEmail(userEmail)) {
                return userEmail.trim();
            }
        }
    } catch (err) {
        console.error('[Email] users lookup failed:', err.message);
    }

    try {
        const authUser = await admin.auth().getUser(uid);

        if (isValidEmail(authUser?.email)) {
            return authUser.email.trim();
        }
    } catch (err) {
        console.error('[Email] auth lookup failed:', err.message);
    }

    return null;
};

const resolveCustomerName = (orderData = {}) => {
    if (orderData.customerName) return orderData.customerName;

    const addr =
        orderData.shippingAddress ||
        orderData.billingAddress ||
        {};

    const name =
        `${addr.firstName || ''} ${addr.lastName || ''}`.trim();

    return name || 'Customer';
};

// ============================================================
// PLACE ORDER
// ============================================================

const placeOrder = async (req, res) => {
    try {
        const { uid, orderData } = req.body;

        if (!uid || !orderData) {
            return res.status(400).json({
                success: false,
                message: 'Missing data'
            });
        }

        const orderRef = await db.collection('orders').add({
            ...orderData,
            userId: uid,
            createdAt:
                admin.firestore.FieldValue.serverTimestamp(),
            status: 'Placed',
            invoiceGenerated: false
        });

        const orderId = orderRef.id;

        const customerEmail =
            await resolveCustomerEmail(
                uid,
                orderData
            );

        const fullOrder = {
            ...orderData,
            orderId:
                orderData.orderId ||
                orderId,
            documentId: orderId,
            customerName:
                resolveCustomerName(
                    orderData
                ),
            email:
                customerEmail ||
                orderData.email
        };

        // Save the resolved email on the order
        // Used by cancellation email and other flows.
        if (
            customerEmail &&
            customerEmail !== orderData.email
        ) {
            orderRef
                .update({
                    email: customerEmail
                })
                .catch((err) =>
                    console.error(
                        '[PlaceOrder] Failed to save email on order:',
                        err.message
                    )
                );
        }

        // ====================================================
        // 1) GENERATE INVOICE
        //
        // invoiceService.generateInvoice() should return:
        //
        // {
        //     invoiceUrl: 'https://...',
        //     pdfBuffer: Buffer
        // }
        //
        // invoiceUrl  -> saved in Firestore / Cloudinary
        // pdfBuffer   -> directly attached to Brevo email
        // ====================================================

        let invoicePath = null;
        let invoicePdfBuffer = null;

        try {
            const invoiceResult =
                await invoiceService.generateInvoice(
                    fullOrder
                );

            // New invoiceService format
            if (
                invoiceResult &&
                typeof invoiceResult === 'object' &&
                !Buffer.isBuffer(invoiceResult)
            ) {
                invoicePath =
                    invoiceResult.invoiceUrl ||
                    invoiceResult.invoicePath ||
                    null;

                invoicePdfBuffer =
                    Buffer.isBuffer(
                        invoiceResult.pdfBuffer
                    )
                        ? invoiceResult.pdfBuffer
                        : null;
            } else {
                // Backward compatibility:
                // old invoiceService returned only URL/path
                invoicePath =
                    invoiceResult || null;
            }

            await orderRef.update({
                invoiceGenerated:
                    !!invoicePath,
                invoicePath:
                    invoicePath || null
            });

            console.log(
                `[Invoice] Invoice generated successfully for order ${fullOrder.orderId}`
            );

            if (invoicePath) {
                console.log(
                    `[Invoice] Cloudinary invoice URL: ${invoicePath}`
                );
            }

            if (invoicePdfBuffer) {
                console.log(
                    `[Invoice] PDF buffer ready for email: ${invoicePdfBuffer.length} bytes`
                );
            } else {
                console.warn(
                    `[Invoice] PDF buffer was not returned for order ${fullOrder.orderId}. Email will be sent without attachment.`
                );
            }
        } catch (e) {
            console.error(
                '[Invoice] Invoice generation failed:',
                e
            );

            // Invoice failure must never prevent
            // customer order confirmation.
            invoicePath = null;
            invoicePdfBuffer = null;
        }

        // ====================================================
        // 2) CUSTOMER ORDER CONFIRMATION
        //
        // IMPORTANT:
        // Send PDF BUFFER to emailService.
        //
        // DO NOT send Cloudinary URL here.
        //
        // emailService will convert the Buffer to Base64
        // and send it directly to Brevo.
        // ====================================================

        if (customerEmail) {
            emailService
                .sendOrderConfirmation(
                    customerEmail,
                    fullOrder,
                    invoicePdfBuffer
                )
                .then((result) => {
                    if (!result) {
                        console.error(
                            `[PlaceOrder] Customer confirmation FAILED for order ${fullOrder.orderId}`
                        );
                    } else {
                        console.log(
                            `[PlaceOrder] Customer confirmation sent for order ${fullOrder.orderId}`
                        );

                        if (invoicePdfBuffer) {
                            console.log(
                                `[PlaceOrder] Invoice PDF attached to customer email for order ${fullOrder.orderId}`
                            );
                        }
                    }
                })
                .catch((err) =>
                    console.error(
                        '[PlaceOrder] Customer email error:',
                        err
                    )
                );
        } else {
            console.warn(
                `[PlaceOrder] No customer email found for uid ${uid}, order ${fullOrder.orderId}`
            );
        }

        // ====================================================
        // 3) SELLER NOTIFICATIONS
        //
        // Independent from customer email.
        // ====================================================

        emailService
            .notifySellers(fullOrder)
            .catch((err) =>
                console.error(
                    '[PlaceOrder] Seller notification error:',
                    err
                )
            );

        // ====================================================
        // INVALIDATE USER ORDER CACHE
        // ====================================================

        cache.invalidate(
            `userOrders_${uid}`,
            'adminAllOrders'
        );

        cache.invalidatePrefix(
            'adminStats'
        );

        // ====================================================
        // REDUCE STOCK ATOMICALLY
        // ====================================================

        if (orderData.items) {
            reduceStock(
                orderData.items
            ).catch((err) =>
                console.error(
                    'Stock reduction error:',
                    err
                )
            );
        }

        // ====================================================
        // RESPONSE
        // ====================================================

        return res.status(200).json({
            success: true,
            orderId,
            message: 'Order placed successfully'
        });
    } catch (error) {
        console.error(
            'PLACE ORDER ERROR:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Order placement failed'
        });
    }
};

// ============================================================
// GET USER ORDERS
// ============================================================

const getUserOrders = async (req, res) => {
    try {
        const { uid } = req.params;

        const cacheKey =
            `userOrders_${uid}`;

        const cached =
            cache.get(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                orders: cached
            });
        }

        const snapshot =
            await db
                .collection('orders')
                .where(
                    'userId',
                    '==',
                    uid
                )
                .get();

        const orders =
            snapshot.docs.map(
                (doc) =>
                    serializeOrder(
                        doc.id,
                        doc.data()
                    )
            );

        orders.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

        cache.set(
            cacheKey,
            orders,
            ORDERS_CACHE_TTL
        );

        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error(
            'GET USER ORDERS ERROR:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Failed to fetch orders'
        });
    }
};

// ============================================================
// GET ORDER BY ID
// ============================================================

const getOrderById = async (
    req,
    res
) => {
    try {
        const { orderId } =
            req.params;

        const cacheKey =
            `order_${orderId}`;

        const cached =
            cache.get(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                order: cached
            });
        }

        const doc =
            await db
                .collection('orders')
                .doc(orderId)
                .get();

        let order;

        if (!doc.exists) {
            const query =
                await db
                    .collection('orders')
                    .where(
                        'orderId',
                        '==',
                        orderId
                    )
                    .limit(1)
                    .get();

            if (query.empty) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Order not found'
                });
            }

            order =
                serializeOrder(
                    query.docs[0].id,
                    query.docs[0].data()
                );
        } else {
            order =
                serializeOrder(
                    doc.id,
                    doc.data()
                );
        }

        cache.set(
            cacheKey,
            order
        );

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error(
            'GET ORDER ERROR:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Failed to fetch order'
        });
    }
};

// ============================================================
// CANCEL ORDER
// ============================================================

const cancelOrder = async (
    req,
    res
) => {
    try {
        const { orderId } =
            req.params;

        const {
            cancellationReason
        } = req.body;

        const uid =
            req.user?.uid;

        console.log(
            `[CANCEL REQUEST] Order: ${orderId} | User: ${uid} | Reason: ${cancellationReason}`
        );

        if (!uid) {
            console.error(
                '[CANCEL] Missing user UID in request'
            );

            return res.status(401).json({
                success: false,
                message:
                    'Authentication required'
            });
        }

        if (
            !cancellationReason ||
            !cancellationReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Cancellation reason is required'
            });
        }

        const orderRef =
            db
                .collection('orders')
                .doc(orderId);

        const orderSnap =
            await orderRef.get();

        if (!orderSnap.exists) {
            return res.status(404).json({
                success: false,
                message:
                    'Order not found'
            });
        }

        const orderData =
            orderSnap.data();

        if (
            orderData.uid !== uid &&
            orderData.userId !== uid
        ) {
            console.warn(
                `[CANCEL] Access Denied: User ${uid} trying to cancel order owned by ${orderData.userId || orderData.uid}`
            );

            return res.status(403).json({
                success: false,
                message:
                    'Access denied'
            });
        }

        if (
            orderData.status ===
            'Cancelled'
        ) {
            console.log(
                `[CANCEL] Order ${orderId} is already cancelled. Returning success.`
            );

            return res.status(200).json({
                success: true,
                message:
                    'Order is already cancelled'
            });
        }

        if (
            ['Shipped', 'Delivered']
                .includes(
                    orderData.status
                )
        ) {
            console.warn(
                `[CANCEL] Invalid state: Order ${orderId} is in ${orderData.status} state`
            );

            return res.status(400).json({
                success: false,
                message:
                    `Cannot cancel order in ${orderData.status} state`
            });
        }

        // ====================================================
        // SHIPROCKET CANCELLATION
        // ====================================================

        if (
            orderData.shiprocketOrderId
        ) {
            try {
                const shiprocketResult =
                    await shiprocketService
                        .cancelOrder(
                            orderData.shiprocketOrderId,
                            orderId
                        );

                if (
                    !shiprocketResult.success
                ) {
                    console.error(
                        'Failed to cancel Shiprocket order:',
                        shiprocketResult.error
                    );
                }
            } catch (
                shiprocketErr
            ) {
                console.error(
                    'SHIPROCKET SERVICE CRASH:',
                    shiprocketErr
                );
            }
        }

        // ====================================================
        // REFUND INFORMATION
        // ====================================================

        let refundInfo = null;

        if (
            orderData.paymentMethod ===
                'razorpay' ||
            orderData.paymentMethod ===
                'online'
        ) {
            refundInfo = {
                message:
                    'Your refund will be processed shortly.',
                refundAmount:
                    orderData.total || 0,
                refundMethod:
                    'Original Payment Method',
                processingTime:
                    '5-7 business days'
            };
        } else if (
            orderData.paymentMethod ===
            'cod'
        ) {
            refundInfo = {
                message:
                    'No refund applicable for Cash on Delivery orders.',
                refundAmount: 0,
                refundMethod:
                    'Not Applicable',
                processingTime:
                    'N/A'
            };
        }

        // ====================================================
        // UPDATE ORDER
        // ====================================================

        const updateData = {
            status: 'Cancelled',
            cancellationReason:
                cancellationReason.trim(),
            cancelledAt:
                admin.firestore.FieldValue
                    .serverTimestamp(),
            cancelledBy: uid
        };

        if (
            refundInfo &&
            refundInfo.refundAmount > 0
        ) {
            updateData.refundStatus =
                'Pending';

            updateData.refundAmount =
                refundInfo.refundAmount;

            updateData.refundMethod =
                refundInfo.refundMethod;

            updateData.refundProcessingTime =
                refundInfo.processingTime;
        } else {
            updateData.refundStatus =
                'Not Applicable';

            updateData.refundAmount = 0;
        }

        try {
            await orderRef.update(
                updateData
            );
        } catch (updateErr) {
            console.error(
                'FIRESTORE UPDATE ERROR:',
                updateErr
            );

            throw updateErr;
        }

        // ====================================================
        // REPLENISH STOCK
        // ====================================================

        if (orderData.items) {
            replenishStock(
                orderData.items
            ).catch((err) =>
                console.error(
                    'Stock replenishment error:',
                    err
                )
            );
        }

        // ====================================================
        // INVALIDATE CACHES
        // ====================================================

        try {
            cache.invalidate(
                `userOrders_${uid}`,
                'adminAllOrders'
            );

            if (
                orderData.sellerId
            ) {
                cache.invalidate(
                    `sellerDash_${orderData.sellerId}`
                );
            }

            if (
                orderData.items &&
                Array.isArray(
                    orderData.items
                )
            ) {
                const sellerIds =
                    new Set();

                orderData.items.forEach(
                    (item) => {
                        if (
                            item.sellerId
                        ) {
                            sellerIds.add(
                                item.sellerId
                            );
                        }
                    }
                );

                sellerIds.forEach(
                    (sellerId) => {
                        cache.invalidate(
                            `sellerDash_${sellerId}`
                        );
                    }
                );
            }

            cache.invalidate(
                'adminStats',
                'allSellers'
            );
        } catch (
            cacheErr
        ) {
            console.error(
                'CACHE INVALIDATION ERROR:',
                cacheErr
            );
        }

        // ====================================================
        // CANCELLATION EMAIL
        // ====================================================

        try {
            const customerEmail =
                await resolveCustomerEmail(
                    uid,
                    orderData
                );

            if (customerEmail) {
                emailService
                    .sendOrderCancellation(
                        customerEmail,
                        {
                            orderId:
                                orderData.orderId ||
                                orderId,

                            customerName:
                                resolveCustomerName(
                                    orderData
                                ),

                            total:
                                orderData.total,

                            items:
                                orderData.items
                        }
                    )
                    .catch((e) =>
                        console.error(
                            'Cancellation email error:',
                            e
                        )
                    );
            } else {
                console.warn(
                    `[CANCEL] No customer email found for order ${orderId}`
                );
            }
        } catch (
            emailErr
        ) {
            console.error(
                'Cancellation email lookup error:',
                emailErr
            );
        }

        return res.status(200).json({
            success: true,
            message:
                'Order cancelled successfully',
            refundInfo
        });
    } catch (error) {
        console.error(
            'CANCEL ORDER ERROR:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                `Failed to cancel order: ${error.message}`
        });
    }
};

// ============================================================
// REVIEWABLE ORDERS
// ============================================================

const getReviewableOrders =
    async (
        req,
        res
    ) => {
        try {
            const { uid } =
                req.params;

            const snapshot =
                await db
                    .collection(
                        'orders'
                    )
                    .where(
                        'userId',
                        '==',
                        uid
                    )
                    .where(
                        'status',
                        '==',
                        'Delivered'
                    )
                    .get();

            const reviewsSnapshot =
                await db
                    .collection(
                        'reviews'
                    )
                    .where(
                        'userId',
                        '==',
                        uid
                    )
                    .get();

            const reviewedProductIds =
                new Set();

            reviewsSnapshot.forEach(
                (doc) => {
                    const reviewData =
                        doc.data();

                    if (
                        reviewData.productId
                    ) {
                        reviewedProductIds.add(
                            reviewData.productId
                        );
                    }
                }
            );

            const reviewableOrders =
                [];

            for (
                const doc of
                snapshot.docs
            ) {
                const data =
                    doc.data();

                for (
                    const item of
                    data.items || []
                ) {
                    const productId =
                        item.productId ||
                        item.id;

                    if (
                        !reviewedProductIds.has(
                            productId
                        )
                    ) {
                        reviewableOrders.push({
                            orderId:
                                data.orderId ||
                                doc.id,

                            productId,

                            productName:
                                item.name,

                            productImage:
                                item.imageUrl ||
                                item.image,

                            deliveredAt:
                                data.deliveredAt ||
                                data.updatedAt ||
                                data.createdAt
                        });
                    }
                }
            }

            return res.status(200).json({
                success: true,
                orders:
                    reviewableOrders
            });
        } catch (error) {
            console.error(
                'Fetch Reviewable orders error:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    'Failed to fetch reviewable orders'
            });
        }
    };

// ============================================================
// DOWNLOAD INVOICE
// ============================================================

const downloadInvoice =
    async (
        req,
        res
    ) => {
        try {
            const { orderId } =
                req.params;

            const {
                regenerate
            } = req.query;

            const query =
                await db
                    .collection(
                        'orders'
                    )
                    .where(
                        'orderId',
                        '==',
                        orderId
                    )
                    .limit(1)
                    .get();

            let docSnap;

            if (query.empty) {
                docSnap =
                    await db
                        .collection(
                            'orders'
                        )
                        .doc(orderId)
                        .get();

                if (
                    !docSnap.exists
                ) {
                    return res.status(404).json({
                        success: false,
                        message:
                            'Order not found'
                    });
                }
            } else {
                docSnap =
                    query.docs[0];
            }

            const order =
                docSnap.data();

            // =================================================
            // REGENERATE INVOICE
            // =================================================

            if (
                regenerate === 'true'
            ) {
                console.log(
                    `[INVOICE] Regenerating invoice for order: ${orderId}`
                );

                const invoiceResult =
                    await invoiceService
                        .generateInvoice({
                            ...order,
                            documentId:
                                docSnap.id
                        });

                const invPath =
                    invoiceResult &&
                    typeof invoiceResult ===
                        'object'
                        ? invoiceResult.invoiceUrl
                        : invoiceResult;

                await docSnap.ref.update({
                    invoiceGenerated:
                        !!invPath,
                    invoicePath:
                        invPath || null
                });

                // Cloudinary URL cannot be passed to res.sendFile().
                // Redirect the browser to the Cloudinary PDF.
                if (
                    invPath &&
                    /^https?:\/\//i.test(
                        invPath
                    )
                ) {
                    return res.redirect(
                        invPath
                    );
                }

                if (
                    invPath &&
                    fs.existsSync(invPath)
                ) {
                    return res.sendFile(
                        path.resolve(
                            invPath
                        )
                    );
                }

                return res.status(404).json({
                    success: false,
                    message:
                        'Invoice file could not be located'
                });
            }

            // =================================================
            // EXISTING INVOICE
            // =================================================

            if (order.invoicePath) {
                // Cloudinary / remote URL
                if (
                    /^https?:\/\//i.test(
                        order.invoicePath
                    )
                ) {
                    return res.redirect(
                        order.invoicePath
                    );
                }

                // Local invoice file
                if (
                    fs.existsSync(
                        order.invoicePath
                    )
                ) {
                    return res.sendFile(
                        path.resolve(
                            order.invoicePath
                        )
                    );
                }
            }

            // =================================================
            // INVOICE DOES NOT EXIST - GENERATE
            // =================================================

            const invoiceResult =
                await invoiceService
                    .generateInvoice({
                        ...order,
                        documentId:
                            docSnap.id
                    });

            const invPath =
                invoiceResult &&
                typeof invoiceResult ===
                    'object'
                    ? invoiceResult.invoiceUrl
                    : invoiceResult;

            await docSnap.ref.update({
                invoiceGenerated:
                    !!invPath,
                invoicePath:
                    invPath || null
            });

            if (
                invPath &&
                /^https?:\/\//i.test(
                    invPath
                )
            ) {
                return res.redirect(
                    invPath
                );
            }

            if (
                invPath &&
                fs.existsSync(invPath)
            ) {
                return res.sendFile(
                    path.resolve(
                        invPath
                    )
                );
            }

            return res.status(404).json({
                success: false,
                message:
                    'Invoice could not be generated'
            });
        } catch (error) {
            console.error(
                'Invoice download error:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    'Failed to download invoice'
            });
        }
    };

// ============================================================
// SHIPPING LABEL
// ============================================================

const getShippingLabel =
    async (
        req,
        res
    ) => {
        try {
            let { orderId } =
                req.params;

            let orderDoc =
                await db
                    .collection(
                        'orders'
                    )
                    .doc(orderId)
                    .get();

            let orderData;

            if (
                !orderDoc.exists
            ) {
                const query =
                    await db
                        .collection(
                            'orders'
                        )
                        .where(
                            'orderId',
                            '==',
                            orderId
                        )
                        .limit(1)
                        .get();

                if (
                    query.empty
                ) {
                    return res.status(404).json({
                        success: false,
                        message:
                            'Order not found'
                    });
                }

                orderDoc =
                    query.docs[0];

                orderId =
                    orderDoc.id;

                orderData =
                    orderDoc.data();
            } else {
                orderData =
                    orderDoc.data();
            }

            if (
                !orderData.shipmentId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Shipment not yet created for this order. AWB must be generated first.'
                });
            }

            if (
                orderData.labelUrl
            ) {
                return res.status(200).json({
                    success: true,
                    labelUrl:
                        orderData.labelUrl
                });
            }

            const labelResult =
                await shiprocketService
                    .getShippingLabel([
                        orderData.shipmentId
                    ]);

            if (
                labelResult.success &&
                labelResult.labelUrl
            ) {
                await db
                    .collection(
                        'orders'
                    )
                    .doc(orderId)
                    .update({
                        labelUrl:
                            labelResult.labelUrl
                    });

                return res.status(200).json({
                    success: true,
                    labelUrl:
                        labelResult.labelUrl
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        labelResult.error ||
                        'Failed to generate shipping label'
                });
            }
        } catch (error) {
            console.error(
                '[LABEL] Error:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    'Failed to fetch shipping label'
            });
        }
    };

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    placeOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getReviewableOrders,
    downloadInvoice,
    getShippingLabel
};
