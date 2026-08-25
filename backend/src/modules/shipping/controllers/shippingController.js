'use strict';
const { admin, db } = require('../../../config/firebase');
const shiprocketService = require('../../../shared/services/shiprocketService');

exports.handleShiprocketWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-shiprocket-signature'];
        if (!signature || !shiprocketService.verifyWebhookSignature(req.body, signature)) {
            return res.status(403).json({ success: false, message: "Invalid signature" });
        }

        const { shipment_id, current_status, estimated_delivery_date, tracking_data } = req.body;
        const ordersSnap = await db.collection('orders').where('shipmentId', '==', String(shipment_id)).limit(1).get();

        if (ordersSnap.empty) return res.status(404).json({ success: false, message: "Order not found" });

        const orderRef = ordersSnap.docs[0].ref;
        const orderData = ordersSnap.docs[0].data();
        const mappedStatus = shiprocketService.mapShiprocketStatus(current_status);
        
        const updateData = {
            shippingStatus: mappedStatus,
            shiprocketUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Update payment status for COD orders when delivered
        if (mappedStatus === 'DELIVERED' && orderData.paymentMethod === 'COD') {
            updateData.paymentStatus = 'Collected';
            updateData.paymentCollectedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        if (estimated_delivery_date) updateData.estimatedDelivery = estimated_delivery_date;
        if (tracking_data) updateData.trackingEvents = admin.firestore.FieldValue.arrayUnion(...tracking_data);

        await orderRef.update(updateData);
        return res.status(200).json({ success: true, message: "Webhook processed" });
    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ success: false, message: "Internal error" });
    }
};
