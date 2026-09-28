'use strict';
const { db, admin } = require('../config/firebase');
const cache = require('./cache');

/**
 * Adjust product stock atomically.
 * @param {Array} items - Array of items from order ({ productId, quantity, sellerId })
 * @param {boolean} isRefund - If true, increases stock (replenish), else decreases (reduce)
 */
const adjustStock = async (items, isRefund = false) => {
    if (!items || !Array.isArray(items) || items.length === 0) return;

    try {
        const batch = db.batch();
        const sellerProductInvalidations = new Set();
        const modifier = isRefund ? 1 : -1;

        for (const item of items) {
            const productId = item.productId || item.id;
            const quantity = Number(item.quantity) || 1;
            const sellerId = item.sellerId;

            if (!productId) continue;

            // 1. Update main products collection
            const productRef = db.collection('products').doc(productId);
            batch.update(productRef, {
                stock: admin.firestore.FieldValue.increment(quantity * modifier),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Update seller sub-collection
            if (sellerId) {
                const sellerProductRef = db.collection('sellers').doc(sellerId)
                    .collection('listedproducts').doc(productId);
                
                // We use set with merge: true or check if it exists?
                // In this system, it should exist if it's in the order.
                // Using update to be safe and avoid creating orphans if somehow it doesn't exist.
                batch.update(sellerProductRef, {
                    stock: admin.firestore.FieldValue.increment(quantity * modifier),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                sellerProductInvalidations.add(sellerId);
            }
        }

        await batch.commit();

        // Invalidate caches
        cache.invalidatePrefix('products_');
        for (const sellerId of sellerProductInvalidations) {
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }

        console.log(`[Stock] Successfully ${isRefund ? 'replenished' : 'reduced'} stock for ${items.length} items.`);
    } catch (error) {
        console.error(`[Stock] Error adjusting stock:`, error.message);
        // We don't throw here to avoid failing the whole order flow if stock sync fails,
        // although in a strict system we might want to.
    }
};

const reduceStock = (items) => adjustStock(items, false);
const replenishStock = (items) => adjustStock(items, true);

module.exports = { reduceStock, replenishStock };
