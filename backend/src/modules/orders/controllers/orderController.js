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
 *
 * Priority:
 * 1. Firestore users/{uid}.email
 * 2. Firebase Auth email
 * 3. Email supplied in order data
 *
 * This prevents an incorrect/stale frontend email from taking
 * priority over the customer's actual account email.
 */
const resolveCustomerEmail = async (uid, orderData = {}) => {

    // --------------------------------------------------------
    // 1. Firestore user account
    // --------------------------------------------------------

    if (uid) {

        try {

            const userDoc = await db
                .collection('users')
                .doc(uid)
                .get();

            if (userDoc.exists) {

                const userEmail = userDoc.data()?.email;

                if (isValidEmail(userEmail)) {

                    console.log(
                        `[Email] Customer email resolved from Firestore users collection: ${userEmail.trim()}`
                    );

                    return userEmail.trim();

                }

            }

        } catch (err) {

            console.error(
                '[Email] users lookup failed:',
                err.message
            );

        }



        // ----------------------------------------------------
        // 2. Firebase Authentication
        // ----------------------------------------------------

        try {

            const authUser = await admin
                .auth()
                .getUser(uid);

            if (isValidEmail(authUser?.email)) {

                console.log(
                    `[Email] Customer email resolved from Firebase Auth: ${authUser.email.trim()}`
                );

                return authUser.email.trim();

            }

        } catch (err) {

            console.error(
                '[Email] auth lookup failed:',
                err.message
            );

        }

    }



    // --------------------------------------------------------
    // 3. Fallback to email stored in order data
    // --------------------------------------------------------

    const candidates = [
        orderData.email,
        orderData.customerEmail,
        orderData.customerInfo?.email,
        orderData.shippingAddress?.email,
        orderData.billingAddress?.email
    ];



    for (const candidate of candidates) {

        if (isValidEmail(candidate)) {

            console.log(
                `[Email] Customer email resolved from order data: ${candidate.trim()}`
            );

            return candidate.trim();

        }

    }



    console.warn(
        `[Email] Unable to resolve customer email for UID: ${uid || 'unknown'}`
    );



    return null;

};



const resolveCustomerName = (orderData = {}) => {

    if (orderData.customerName) {
        return orderData.customerName;
    }



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
                message: "Missing data"
            });

        }



        // ----------------------------------------------------
        // Create order
        // ----------------------------------------------------

        const orderRef = await db
            .collection("orders")
            .add({

                ...orderData,

                userId: uid,

                createdAt:
                    admin.firestore.FieldValue.serverTimestamp(),

                status: "Placed",

                invoiceGenerated: false

            });



        const orderId = orderRef.id;



        // ----------------------------------------------------
        // Resolve customer email
        // ----------------------------------------------------

        const customerEmail =
            await resolveCustomerEmail(uid, orderData);



        console.log(
            `[PlaceOrder] Customer email for ${orderId}: ${customerEmail || 'NOT FOUND'}`
        );



        // ----------------------------------------------------
        // Build complete order object
        // ----------------------------------------------------

        const fullOrder = {

            ...orderData,

            orderId:
                orderData.orderId ||
                orderId,

            documentId:
                orderId,

            customerName:
                resolveCustomerName(orderData),

            email:
                customerEmail ||
                orderData.email

        };



        // ----------------------------------------------------
        // Save resolved customer email to order
        // ----------------------------------------------------

        if (
            customerEmail &&
            customerEmail !== orderData.email
        ) {

            orderRef
                .update({
                    email: customerEmail
                })
                .catch(err =>
                    console.error(
                        '[PlaceOrder] Failed to save email on order:',
                        err.message
                    )
                );

        }



        // ====================================================
        // 1) GENERATE INVOICE
        // ====================================================

        let invoicePath = null;

        let invoicePdfBuffer = null;



        try {

            console.log(
                `[INVOICE] Generating invoice for order ${fullOrder.orderId}`
            );



            /*
             * IMPORTANT:
             *
             * invoiceService.generateInvoice()
             * must return:
             *
             * {
             *     invoiceUrl,
             *     pdfBuffer
             * }
             *
             * The PDF buffer is the exact same PDF that
             * was uploaded to Cloudinary.
             */

            const invoiceResult =
                await invoiceService.generateInvoice(fullOrder);



            if (
                invoiceResult &&
                typeof invoiceResult === 'object'
            ) {

                invoicePath =
                    invoiceResult.invoiceUrl ||
                    null;



                invoicePdfBuffer =
                    invoiceResult.pdfBuffer ||
                    null;

            } else {

                /*
                 * Backward compatibility:
                 *
                 * If the invoice service still returns
                 * only a URL, preserve that URL.
                 */

                invoicePath =
                    typeof invoiceResult === 'string'
                        ? invoiceResult
                        : null;

            }



            if (invoicePath) {

                console.log(
                    `[INVOICE] Cloudinary invoice URL: ${invoicePath}`
                );

            }



            if (
                invoicePdfBuffer &&
                Buffer.isBuffer(invoicePdfBuffer)
            ) {

                console.log(
                    `[INVOICE] PDF buffer ready: ${invoicePdfBuffer.length} bytes`
                );

            } else {

                console.warn(
                    `[INVOICE] No PDF buffer returned for order ${fullOrder.orderId}`
                );

            }



            // ------------------------------------------------
            // Save invoice information to order
            // ------------------------------------------------

            await orderRef.update({

                invoiceGenerated:
                    Boolean(invoicePath),

                invoicePath:
                    invoicePath || null

            });



        } catch (e) {

            console.error(
                `[INVOICE] Invoice generation failed for ${fullOrder.orderId}:`,
                e
            );



            /*
             * Invoice failure should NOT prevent the
             * customer order confirmation email.
             */

            try {

                await orderRef.update({

                    invoiceGenerated: false,

                    invoicePath: null

                });

            } catch (updateError) {

                console.error(
                    '[INVOICE] Failed to update invoice status:',
                    updateError.message
                );

            }

        }



        // ====================================================
        // 2) CUSTOMER ORDER CONFIRMATION EMAIL
        // ====================================================

        if (customerEmail) {

            console.log(
                `[PlaceOrder] Sending customer confirmation to ${customerEmail}`
            );



            /*
             * IMPORTANT:
             *
             * Pass the SAME PDF Buffer generated above.
             *
             * We do NOT pass the Cloudinary URL as the
             * email attachment.
             *
             * Brevo receives the PDF directly as Base64.
             */

            emailService

                .sendOrderConfirmation(
                    customerEmail,
                    fullOrder,
                    invoicePdfBuffer
                )

                .then(result => {

                    if (!result) {

                        console.error(
                            `[PlaceOrder] Customer confirmation FAILED for order ${fullOrder.orderId}`
                        );

                    } else {

                        console.log(
                            `[PlaceOrder] Customer confirmation sent successfully for order ${fullOrder.orderId}`
                        );

                    }

                })

                .catch(err => {

                    console.error(
                        '[PlaceOrder] Customer email error:',
                        err
                    );

                });



        } else {

            console.warn(
                `[PlaceOrder] No customer email found for uid ${uid}, order ${fullOrder.orderId}`
            );

        }



        // ====================================================
        // 3) SELLER NOTIFICATIONS
        // ====================================================

        emailService

            .notifySellers(fullOrder)

            .catch(err =>
                console.error(
                    '[PlaceOrder] Seller notification error:',
                    err
                )
            );



        // ====================================================
        // INVALIDATE CACHE
        // ====================================================

        cache.invalidate(
            `userOrders_${uid}`,
            'adminAllOrders'
        );



        cache.invalidatePrefix(
            'adminStats'
        );



        // ====================================================
        // REDUCE STOCK
        // ====================================================

        if (orderData.items) {

            reduceStock(
                orderData.items
            ).catch(err =>
                console.error(
                    "Stock reduction error:",
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

            message:
                "Order placed successfully"

        });



    } catch (error) {

        console.error(
            "PLACE ORDER ERROR:",
            error
        );



        return res.status(500).json({

            success: false,

            message:
                "Order placement failed"

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
                .collection("orders")
                .where(
                    "userId",
                    "==",
                    uid
                )
                .get();



        const orders =
            snapshot.docs.map(
                doc =>
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
            "GET USER ORDERS ERROR:",
            error
        );



        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch orders"

        });

    }

};



// ============================================================
// GET ORDER BY ID
// ============================================================

const getOrderById = async (req, res) => {

    try {

        const { orderId } = req.params;



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
                .collection("orders")
                .doc(orderId)
                .get();



        let order;



        if (!doc.exists) {

            const query =
                await db
                    .collection("orders")
                    .where(
                        "orderId",
                        "==",
                        orderId
                    )
                    .limit(1)
                    .get();



            if (query.empty) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"

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
            "GET ORDER ERROR:",
            error
        );



        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch order"

        });

    }

};



// ============================================================
// CANCEL ORDER
// ============================================================

const cancelOrder = async (req, res) => {

    try {

        const { orderId } = req.params;

        const { cancellationReason } =
            req.body;

        const uid =
            req.user?.uid;



        console.log(
            `[CANCEL REQUEST] Order: ${orderId} | User: ${uid} | Reason: ${cancellationReason}`
        );



        if (!uid) {

            console.error(
                "[CANCEL] Missing user UID in request"
            );



            return res.status(401).json({

                success: false,

                message:
                    "Authentication required"

            });

        }



        if (
            !cancellationReason ||
            !cancellationReason.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Cancellation reason is required"

            });

        }



        const orderRef =
            db
                .collection("orders")
                .doc(orderId);



        const orderSnap =
            await orderRef.get();



        if (!orderSnap.exists) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

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
                    "Access denied"

            });

        }



        if (
            orderData.status === "Cancelled"
        ) {

            console.log(
                `[CANCEL] Order ${orderId} is already cancelled. Returning success.`
            );



            return res.status(200).json({

                success: true,

                message:
                    "Order is already cancelled"

            });

        }



        if (
            ["Shipped", "Delivered"]
                .includes(orderData.status)
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



        // ----------------------------------------------------
        // Shiprocket cancellation
        // ----------------------------------------------------

        if (orderData.shiprocketOrderId) {

            try {

                const shiprocketResult =
                    await shiprocketService.cancelOrder(
                        orderData.shiprocketOrderId,
                        orderId
                    );



                if (!shiprocketResult.success) {

                    console.error(
                        "Failed to cancel Shiprocket order:",
                        shiprocketResult.error
                    );

                }

            } catch (shiprocketErr) {

                console.error(
                    "SHIPROCKET SERVICE CRASH:",
                    shiprocketErr
                );

            }

        }



        // ----------------------------------------------------
        // Refund information
        // ----------------------------------------------------

        let refundInfo = null;



        if (
            orderData.paymentMethod === 'razorpay' ||
            orderData.paymentMethod === 'online'
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
            orderData.paymentMethod === 'cod'
        ) {

            refundInfo = {

                message:
                    'No refund applicable for Cash on Delivery orders.',

                refundAmount:
                    0,

                refundMethod:
                    'Not Applicable',

                processingTime:
                    'N/A'

            };

        }



        // ----------------------------------------------------
        // Update cancellation
        // ----------------------------------------------------

        const updateData = {

            status:
                "Cancelled",

            cancellationReason:
                cancellationReason.trim(),

            cancelledAt:
                admin.firestore.FieldValue.serverTimestamp(),

            cancelledBy:
                uid

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

            updateData.refundAmount =
                0;

        }



        try {

            await orderRef.update(
                updateData
            );

        } catch (updateErr) {

            console.error(
                "FIRESTORE UPDATE ERROR:",
                updateErr
            );



            throw updateErr;

        }



        // ----------------------------------------------------
        // Replenish stock
        // ----------------------------------------------------

        if (orderData.items) {

            replenishStock(
                orderData.items
            ).catch(err =>
                console.error(
                    "Stock replenishment error:",
                    err
                )
            );

        }



        // ----------------------------------------------------
        // Invalidate caches
        // ----------------------------------------------------

        try {

            cache.invalidate(
                `userOrders_${uid}`,
                'adminAllOrders'
            );



            if (orderData.sellerId) {

                cache.invalidate(
                    `sellerDash_${orderData.sellerId}`
                );

            }



            if (
                orderData.items &&
                Array.isArray(orderData.items)
            ) {

                const sellerIds =
                    new Set();



                orderData.items.forEach(
                    item => {

                        if (item.sellerId) {

                            sellerIds.add(
                                item.sellerId
                            );

                        }

                    }
                );



                sellerIds.forEach(
                    sellerId => {

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



        } catch (cacheErr) {

            console.error(
                "CACHE INVALIDATION ERROR:",
                cacheErr
            );

        }



        // ----------------------------------------------------
        // Cancellation email
        // ----------------------------------------------------

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

                    .catch(e =>
                        console.error(
                            "Cancellation email error:",
                            e
                        )
                    );



            } else {

                console.warn(
                    `[CANCEL] No customer email found for order ${orderId}`
                );

            }



        } catch (emailErr) {

            console.error(
                "Cancellation email lookup error:",
                emailErr
            );

        }



        return res.status(200).json({

            success: true,

            message:
                "Order cancelled successfully",

            refundInfo

        });



    } catch (error) {

        console.error(
            "CANCEL ORDER ERROR:",
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

const getReviewableOrders = async (req, res) => {

    try {

        const { uid } =
            req.params;



        const snapshot =
            await db
                .collection("orders")
                .where(
                    "userId",
                    "==",
                    uid
                )
                .where(
                    "status",
                    "==",
                    "Delivered"
                )
                .get();



        const reviewsSnapshot =
            await db
                .collection("reviews")
                .where(
                    "userId",
                    "==",
                    uid
                )
                .get();



        const reviewedProductIds =
            new Set();



        reviewsSnapshot.forEach(
            doc => {

                const reviewData =
                    doc.data();



                if (reviewData.productId) {

                    reviewedProductIds.add(
                        reviewData.productId
                    );

                }

            }
        );



        const reviewableOrders = [];



        for (
            const doc of snapshot.docs
        ) {

            const data =
                doc.data();



            for (
                const item of data.items || []
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

                        productId:
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
            "Fetch Reviewable orders error:",
            error
        );



        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch reviewable orders"

        });

    }

};



// ============================================================
// DOWNLOAD INVOICE
// ============================================================

const downloadInvoice = async (req, res) => {

    try {

        const { orderId } =
            req.params;

        const { regenerate } =
            req.query;



        const query =
            await db
                .collection("orders")
                .where(
                    "orderId",
                    "==",
                    orderId
                )
                .limit(1)
                .get();



        let docSnap;



        if (query.empty) {

            docSnap =
                await db
                    .collection("orders")
                    .doc(orderId)
                    .get();



            if (!docSnap.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"

                });

            }



        } else {

            docSnap =
                query.docs[0];

        }



        const order =
            docSnap.data();



        // ====================================================
        // REGENERATE INVOICE
        // ====================================================

        if (regenerate === 'true') {

            console.log(
                `[INVOICE] Regenerating invoice for order: ${orderId}`
            );



            const invoiceResult =
                await invoiceService.generateInvoice({

                    ...order,

                    documentId:
                        docSnap.id

                });



            const invoiceUrl =
                invoiceResult?.invoiceUrl ||
                (
                    typeof invoiceResult === 'string'
                        ? invoiceResult
                        : null
                );



            await docSnap.ref.update({

                invoiceGenerated:
                    Boolean(invoiceUrl),

                invoicePath:
                    invoiceUrl

            });



            /*
             * Cloudinary is now the permanent invoice
             * location. Redirect the customer to it.
             */

            if (invoiceUrl) {

                return res.redirect(
                    invoiceUrl
                );

            }



            return res.status(500).json({

                success: false,

                message:
                    "Invoice generated but no download URL was returned"

            });

        }



        // ====================================================
        // EXISTING INVOICE
        // ====================================================

        if (order.invoicePath) {

            /*
             * If invoicePath is a Cloudinary URL,
             * redirect directly to Cloudinary.
             */

            if (
                typeof order.invoicePath === 'string' &&
                /^https?:\/\//i.test(
                    order.invoicePath
                )
            ) {

                return res.redirect(
                    order.invoicePath
                );

            }



            /*
             * Backward compatibility for old local
             * invoice files.
             */

            if (
                typeof order.invoicePath === 'string' &&
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



        // ====================================================
        // GENERATE NEW INVOICE
        // ====================================================

        const invoiceResult =
            await invoiceService.generateInvoice({

                ...order,

                documentId:
                    docSnap.id

            });



        const invoiceUrl =
            invoiceResult?.invoiceUrl ||
            (
                typeof invoiceResult === 'string'
                    ? invoiceResult
                    : null
            );



        if (!invoiceUrl) {

            return res.status(500).json({

                success: false,

                message:
                    "Failed to generate invoice URL"

            });

        }



        await docSnap.ref.update({

            invoiceGenerated: true,

            invoicePath:
                invoiceUrl

        });



        /*
         * Cloudinary invoice URL.
         */

        return res.redirect(
            invoiceUrl
        );



    } catch (error) {

        console.error(
            "Invoice download error:",
            error
        );



        return res.status(500).json({

            success: false,

            message:
                "Failed to download invoice"

        });

    }

};



// ============================================================
// SHIPPING LABEL
// ============================================================

const getShippingLabel = async (req, res) => {

    try {

        let { orderId } =
            req.params;



        let orderDoc =
            await db
                .collection("orders")
                .doc(orderId)
                .get();



        let orderData;



        if (!orderDoc.exists) {

            const query =
                await db
                    .collection("orders")
                    .where(
                        "orderId",
                        "==",
                        orderId
                    )
                    .limit(1)
                    .get();



            if (query.empty) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"

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



        if (!orderData.shipmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Shipment not yet created for this order. AWB must be generated first."

            });

        }



        if (orderData.labelUrl) {

            return res.status(200).json({

                success: true,

                labelUrl:
                    orderData.labelUrl

            });

        }



        const labelResult =
            await shiprocketService.getShippingLabel(
                [orderData.shipmentId]
            );



        if (
            labelResult.success &&
            labelResult.labelUrl
        ) {

            await db
                .collection("orders")
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
                    "Failed to generate shipping label"

            });

        }



    } catch (error) {

        console.error(
            "[LABEL] Error:",
            error
        );



        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch shipping label"

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
