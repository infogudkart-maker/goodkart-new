'use strict';
const delhiveryService = require('../../../shared/services/delhiveryService');
const { admin, db } = require('../../../config/firebase');


exports.handleDelhiveryWebhook = async (req, res) => {
    try {
        // Note: Delhivery webhooks might need specific header verification. 
        // We'll rely on the service method to validate if needed.
        if (!delhiveryService.verifyWebhookSignature(req)) {
            return res.status(403).json({ success: false, message: "Invalid signature" });
        }

        const { waybill, refnum, status, status_datetime } = req.body;
        
        // Find order by Delhivery Order ID (refnum) or waybill
        let ordersSnap;
        if (refnum) {
            ordersSnap = await db.collection('orders').where('delhiveryOrderId', '==', String(refnum)).limit(1).get();
        } else if (waybill) {
            ordersSnap = await db.collection('orders').where('awbNumber', '==', String(waybill)).limit(1).get();
        }

        if (!ordersSnap || ordersSnap.empty) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderRef = ordersSnap.docs[0].ref;
        const orderData = ordersSnap.docs[0].data();
        const mappedStatus = delhiveryService.mapDelhiveryStatus(status);
        
        const updateData = {
            shippingStatus: mappedStatus,
            shippingProviderUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (mappedStatus === 'DELIVERED' && orderData.paymentMethod === 'COD') {
            updateData.paymentStatus = 'Collected';
            updateData.paymentCollectedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await orderRef.update(updateData);
        return res.status(200).json({ success: true, message: "Delhivery Webhook processed" });
    } catch (error) {
        console.error("Delhivery Webhook Error:", error);
        return res.status(500).json({ success: false, message: "Internal error" });
    }
};

exports.generateAWB = async (req, res) => {
    try {
        const { orderId, documentId } = req.body;

        if (!orderId && !documentId) {
            return res.status(400).json({ success: false, message: "Order ID or Document ID required" });
        }

        let orderDoc;
        if (documentId) {
            orderDoc = await db.collection('orders').doc(documentId).get();
        } else {
            const query = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
            if (!query.empty) orderDoc = query.docs[0];
        }

        if (!orderDoc || !orderDoc.exists) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderData = orderDoc.data();
        const orderRef = orderDoc.ref;

        console.log(`[Manual AWB] Triggering Delhivery AWB generation for Order ${orderData.orderId}...`);

        const result = await delhiveryService.createShipment(orderData);

        if (result.success) {
            await orderRef.update({
                awbNumber: result.waybill,
                delhiveryOrderId: result.refnum,
                awbGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.status(200).json({
                success: true,
                message: `AWB successfully generated: ${result.waybill}`,
                awbNumber: result.waybill
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.error || "Failed to generate AWB"
            });
        }
    } catch (error) {
        console.error("Generate AWB Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

