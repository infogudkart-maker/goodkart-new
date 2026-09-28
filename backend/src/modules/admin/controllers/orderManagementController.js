'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');
const { formatDateDDMMYYYY } = require('../../../utils/dateFormat');

const ADMIN_ORDERS_CACHE_TTL = 180; // 3 minutes in seconds

/**
 * Get all orders for admin management.
 */
const getAllOrders = async (req, res) => {
    try {
        const cached = cache.get('adminAllOrders');
        if (cached) return res.status(200).json({ success: true, orders: cached.orders, count: cached.orders.length });

        const ordersSnap = await db.collection("orders").get();
        
        console.log(`[GetAllOrders] Total orders in database: ${ordersSnap.docs.length}`);
        
        const userIds = [...new Set(ordersSnap.docs.map(doc => doc.data().userId).filter(Boolean))];
        
        const userMap = {};
        for (let i = 0; i < userIds.length; i += 10) {
            const batch = userIds.slice(i, i + 10);
            if (batch.length === 0) continue;
            const usersSnap = await db.collection("users")
                .where(admin.firestore.FieldPath.documentId(), "in", batch)
                .get();
            usersSnap.forEach(doc => {
                const userData = doc.data();
                userMap[doc.id] = userData.fullName || userData.name || userData.email || userData.phone || 'Anonymous';
            });
        }
        
        const orders = ordersSnap.docs.map(doc => {
            const data = doc.data();
            
            let formattedDate = 'N/A';
            let timestamp = 0;
            
            if (data.createdAt) {
                try {
                    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    if (!isNaN(date.getTime())) {
                        formattedDate = formatDateDDMMYYYY(date);
                        timestamp = date.getTime();
                    }
                } catch (e) {
                    console.error('Date formatting error for order:', doc.id, e);
                }
            }
            
            if (formattedDate === 'N/A' || formattedDate === 'NN/NN/NNNN') {
                const now = new Date();
                formattedDate = formatDateDDMMYYYY(now);
                timestamp = now.getTime();
            }
            
            const customerName = userMap[data.userId] || data.customerName || data.customer || data.shippingAddress?.name || 'Guest Customer';
            
            return {
                id: doc.id,
                ...data,
                customer: customerName,
                customerId: data.userId || 'N/A',
                orderId: data.orderId || doc.id,
                total: data.total || data.totalAmount || 0,
                status: data.status || 'Processing',
                date: formattedDate,
                timestamp: timestamp,
                createdAt: data.createdAt || null
            };
        });

        orders.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`[GetAllOrders] Returning ${orders.length} orders, sorted by newest first`);

        cache.set('adminAllOrders', { orders }, ADMIN_ORDERS_CACHE_TTL);
        return res.status(200).json({ 
            success: true, 
            orders: orders,
            count: orders.length
        });
    } catch (error) {
        console.error("[GetAllOrders] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

module.exports = { getAllOrders };
