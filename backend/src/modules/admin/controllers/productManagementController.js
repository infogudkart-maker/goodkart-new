'use strict';
const { admin, db } = require('../../../config/firebase');
const { formatDateDDMMYYYY } = require('../../../utils/dateFormat');
const cache = require('../../../utils/cache');
const emailService = require('../../../shared/services/emailService');

/**
 * Shared helper — fetch seller names for a list of sellerIds.
 * Checks sellers.shopName → sellers.extractedName → sellers.name → users.fullName → users.name
 */
const fetchSellerNamesMap = async (sellerIds) => {
    const map = {};
    if (!sellerIds || sellerIds.length === 0) return map;

    const unique = [...new Set(sellerIds.filter(id => id && id !== 'Unknown'))];
    const chunks = [];
    for (let i = 0; i < unique.length; i += 10) chunks.push(unique.slice(i, i + 10));

    for (const chunk of chunks) {
        const [sellersSnap, usersSnap] = await Promise.all([
            db.collection('sellers').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get(),
            db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get()
        ]);

        sellersSnap.forEach(doc => {
            const d = doc.data();
            map[doc.id] = d.shopName || d.extractedName || d.supplierName || d.name || null;
        });

        usersSnap.forEach(doc => {
            const d = doc.data();
            if (!map[doc.id]) map[doc.id] = d.fullName || d.name || null;
        });
    }
    return map;
};

/**
 * Get all products for admin management.
 */
const getAllProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        
        const productsData = productsSnap.docs.filter(doc => !doc.data().adminRemoved).map(doc => {
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
                    console.error('Date formatting error for product:', doc.id, e);
                }
            }
            
            if (formattedDate === 'N/A' || formattedDate === 'NN/NN/NNNN') {
                const now = new Date();
                formattedDate = formatDateDDMMYYYY(now);
                timestamp = now.getTime();
            }
            
            return {
                id: doc.id,
                ...data,
                name: data.name || data.title,
                price: data.price || 0,
                category: data.category || 'Uncategorized',
                sellerId: data.sellerId || 'Unknown',
                stock: data.stock ?? 0,
                status: data.status || 'Active',
                createdAt: data.createdAt || null,
                date: formattedDate,
                timestamp: timestamp
            };
        });

        // Fetch seller names for all products
        const sellerIds = [...new Set(productsData.map(p => p.sellerId).filter(id => id && id !== 'Unknown'))];
        const sellerNamesMap = await fetchSellerNamesMap(sellerIds);

        // Add seller names to products
        const products = productsData.map(p => ({
            ...p,
            sellerName: sellerNamesMap[p.sellerId] || p.sellerName || p.seller || (p.sellerId !== 'Unknown' ? p.sellerId : 'Unknown Seller')
        }));

        products.sort((a, b) => b.timestamp - a.timestamp);

        return res.status(200).json({ 
            success: true, 
            products: products,
            count: products.length
        });
    } catch (error) {
        console.error("[GetAllProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
};

/**
 * Get inactive (removed) products — status !== 'Active'
 */
const getInactiveProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();

        const inactive = [];
        const sellerIds = new Set();
        
        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') {
                // Removal date: use updatedAt, removedAt, or createdAt
                let removalDate = 'N/A';
                const removalTs = data.removedAt || data.updatedAt || data.createdAt || null;
                if (removalTs) {
                    try {
                        const d = removalTs.toDate ? removalTs.toDate() : new Date(removalTs);
                        if (!isNaN(d.getTime())) removalDate = formatDateDDMMYYYY(d);
                    } catch (_) {}
                }
                inactive.push({
                    id: doc.id,
                    name: data.name || data.title || 'Unnamed Product',
                    category: data.category || 'Uncategorized',
                    sellerId: data.sellerId || 'Unknown',
                    sellerName: data.sellerName || null,
                    price: data.price || 0,
                    status: status,
                    removalDate,
                });
                if (data.sellerId) sellerIds.add(data.sellerId);
            }
        });

        // Fetch seller names
        const sellerNamesMap = await fetchSellerNamesMap(Array.from(sellerIds));

        // Add seller names
        const inactiveWithNames = inactive.map(p => ({
            ...p,
            sellerName: sellerNamesMap[p.sellerId] || p.sellerName || p.seller || (p.sellerId !== 'Unknown' ? p.sellerId : 'Unknown Seller')
        }));

        return res.status(200).json({ success: true, products: inactiveWithNames, count: inactiveWithNames.length });
    } catch (error) {
        console.error("[GetInactiveProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch inactive products" });
    }
};

/**
 * Permanently delete a single product from DB
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection("products").doc(id);
        const snap = await productRef.get();
        if (!snap.exists) return res.status(404).json({ success: false, message: "Product not found" });

        const { sellerId } = snap.data();
        await productRef.delete();

        // Also remove from seller sub-collection
        if (sellerId) {
            await db.collection("sellers").doc(sellerId)
                .collection("listedproducts").doc(id).delete().catch(() => {});
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }
        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        return res.status(200).json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error("[DeleteProduct] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete product" });
    }
};

/**
 * Permanently delete ALL inactive products
 */
const deleteAllInactiveProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        const batch = db.batch();
        let count = 0;
        const sellerIds = new Set();

        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') {
                batch.delete(doc.ref);
                count++;
                if (data.sellerId) sellerIds.add(data.sellerId);
            }
        });

        if (count === 0) return res.status(200).json({ success: true, message: "No inactive products to delete", deleted: 0 });

        await batch.commit();

        // Clean up seller sub-collections
        for (const sellerId of sellerIds) {
            const subSnap = await db.collection("sellers").doc(sellerId)
                .collection("listedproducts").get();
            const subBatch = db.batch();
            subSnap.forEach(doc => {
                const d = doc.data();
                if (d.status && d.status.toLowerCase() !== 'active') subBatch.delete(doc.ref);
            });
            await subBatch.commit().catch(() => {});
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }

        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        return res.status(200).json({ success: true, message: `Deleted ${count} inactive products`, deleted: count });
    } catch (error) {
        console.error("[DeleteAllInactiveProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete inactive products" });
    }
};

/**
 * Get out-of-stock products — status === 'Active' but stock <= 0
 * Excludes products already notified (outOfStockNotifiedAt is set)
 */
const getOutOfStockProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        const outOfStock = [];
        const sellerIds = new Set();

        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') return;

            const stockVal = data.stock ?? data.quantity ?? data.stockQuantity ?? data.availableStock ?? null;
            if (stockVal === null || Number(stockVal) > 0) return;

            // Skip already-notified products
            if (data.outOfStockNotifiedAt) return;

            outOfStock.push({
                id: doc.id,
                name: data.name || data.title || 'Unnamed Product',
                category: data.category || 'Uncategorized',
                sellerId: data.sellerId || 'Unknown',
                sellerName: data.sellerName || null,
                price: data.price || 0,
                stock: Number(stockVal),
            });
            if (data.sellerId) sellerIds.add(data.sellerId);
        });

        // Fetch seller names
        const sellerNamesMap = await fetchSellerNamesMap(Array.from(sellerIds));

        // Add seller names
        const outOfStockWithNames = outOfStock.map(p => ({
            ...p,
            sellerName: sellerNamesMap[p.sellerId] || p.sellerName || p.seller || (p.sellerId !== 'Unknown' ? p.sellerId : 'Unknown Seller')
        }));

        return res.status(200).json({ success: true, products: outOfStockWithNames, count: outOfStockWithNames.length });
    } catch (error) {
        console.error("[GetOutOfStockProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch out-of-stock products" });
    }
};

/**
 * Notify seller of a single out-of-stock product, then mark as notified
 */
const notifySellerOutOfStock = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection("products").doc(id);
        const snap = await productRef.get();
        if (!snap.exists) return res.status(404).json({ success: false, message: "Product not found" });

        const data = snap.data();
        const sellerId = data.sellerId;
        if (!sellerId) return res.status(400).json({ success: false, message: "No sellerId on product" });

        // Get seller email — check sellers.contactEmail first (set during onboarding),
        // then fall back to users.email
        const [sellerDoc, userDoc] = await Promise.all([
            db.collection('sellers').doc(sellerId).get(),
            db.collection('users').doc(sellerId).get()
        ]);

        if (!sellerDoc.exists && !userDoc.exists) {
            return res.status(400).json({ success: false, message: `Seller docs not found for sellerId: ${sellerId}` });
        }

        const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
        const userData = userDoc.exists ? userDoc.data() : {};

        // Try every possible email field across both collections
        const sellerEmail = 
            sellerData.contactEmail ||
            sellerData.emailId ||
            sellerData.email ||
            sellerData.sellerEmail ||
            userData.email ||
            userData.emailId ||
            userData.contactEmail ||
            data.sellerEmail ||  // fallback: email stored on product itself
            null;

        const sellerName = userData.fullName || userData.name || sellerData.shopName || sellerData.supplierName || sellerData.extractedName || 'Seller';

        if (!sellerEmail || !sellerEmail.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                message: `No valid email found for this seller. Please update the seller's email in their profile before sending notifications.`
            });
        }

        const emailResult = await emailService.sendOutOfStockNotification(sellerEmail, sellerName, data.name || data.title, {
            category: data.category,
            price: data.price,
        });

        if (!emailResult) {
            // Email failed but we still mark as notified attempt — or return error
            console.error("[NotifySellerOutOfStock] Email send returned null for", sellerEmail);
            return res.status(500).json({ success: false, message: "Email delivery failed. Check mailer config." });
        }

        // Mark as notified so it disappears from the section
        await productRef.update({ outOfStockNotifiedAt: new Date().toISOString() });

        return res.status(200).json({ success: true, message: "Seller notified successfully" });
    } catch (error) {
        console.error("[NotifySellerOutOfStock] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to notify seller: " + error.message });
    }
};

/**
 * Notify ALL sellers of their out-of-stock products at once
 */
const notifyAllSellersOutOfStock = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        const toNotify = [];

        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') return;
            const stockVal = data.stock ?? data.quantity ?? data.stockQuantity ?? data.availableStock ?? null;
            if (stockVal === null || Number(stockVal) > 0) return;
            if (data.outOfStockNotifiedAt) return;
            toNotify.push({ id: doc.id, data });
        });

        if (toNotify.length === 0) {
            return res.status(200).json({ success: true, message: "No unnotified out-of-stock products", notified: 0 });
        }

        // Group by sellerId
        const bySellerMap = {};
        for (const { id, data } of toNotify) {
            const sid = data.sellerId || 'unknown';
            if (!bySellerMap[sid]) bySellerMap[sid] = [];
            bySellerMap[sid].push({ id, data });
        }

        let notifiedCount = 0;
        const batch = db.batch();

        for (const [sellerId, items] of Object.entries(bySellerMap)) {
            if (sellerId === 'unknown') continue;

            let sellerEmail = null;
            let sellerName = 'Seller';

            const [uDoc, sDoc] = await Promise.all([
                db.collection('users').doc(sellerId).get(),
                db.collection('sellers').doc(sellerId).get()
            ]);
            const uData = uDoc.exists ? uDoc.data() : {};
            const sData = sDoc.exists ? sDoc.data() : {};
            sellerEmail = sData.contactEmail || sData.emailId || sData.email || sData.sellerEmail || uData.email || uData.emailId || uData.contactEmail;
            sellerName = uData.fullName || uData.name || sData.shopName || sData.supplierName || sData.extractedName || 'Seller';

            if (!sellerEmail || !sellerEmail.includes('@')) continue;

            // Send one email per product
            for (const { id, data } of items) {
                await emailService.sendOutOfStockNotification(sellerEmail, sellerName, data.name || data.title, {
                    category: data.category,
                    price: data.price,
                }).catch(err => console.error(`[NotifyAll] email failed for ${id}:`, err));

                batch.update(db.collection("products").doc(id), { outOfStockNotifiedAt: new Date().toISOString() });
                notifiedCount++;
            }
        }

        await batch.commit();

        return res.status(200).json({ success: true, message: `Notified sellers for ${notifiedCount} product(s)`, notified: notifiedCount });
    } catch (error) {
        console.error("[NotifyAllSellersOutOfStock] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to notify all sellers" });
    }
};

/**
 * Admin remove a product — sets adminRemoved: true, adminRemovedAt timestamp
 */
const adminRemoveProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection("products").doc(id);
        const snap = await productRef.get();
        if (!snap.exists) return res.status(404).json({ success: false, message: "Product not found" });

        const productData = snap.data();
        const sellerId = productData.sellerId;

        await productRef.update({
            adminRemoved: true,
            adminRemovedAt: new Date().toISOString()
        });

        // Add dashboard notification for seller
        if (sellerId) {
            await db.collection('sellers').doc(sellerId).update({
                productRemovedNotification: {
                    productName: productData.name || productData.title || 'Product',
                    productId: id,
                    removedAt: new Date().toISOString(),
                    seen: false,
                    type: 'REMOVAL'
                }
            }).catch(err => console.error('[AdminRemoveProduct] Notification error:', err));

            // ALSO update listedproducts sub-collection so dashboard shows it correctly
            await db.collection('sellers').doc(sellerId).collection('listedproducts').doc(id).update({
                adminRemoved: true,
                adminRemovedAt: new Date().toISOString()
            }).catch(() => {});
            
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }

        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        // Send email notification to seller
        if (sellerId) {
            const [sellerDoc, userDoc] = await Promise.all([
                db.collection('sellers').doc(sellerId).get(),
                db.collection('users').doc(sellerId).get()
            ]);

            if (sellerDoc.exists || userDoc.exists) {
                const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
                const userData = userDoc.exists ? userDoc.data() : {};
                
                const sellerEmail = sellerData.contactEmail || sellerData.emailId || sellerData.email || sellerData.sellerEmail || userData.email || userData.emailId || userData.contactEmail;
                const sellerName = userData.fullName || userData.name || sellerData.shopName || sellerData.supplierName || sellerData.extractedName || 'Seller';

                if (sellerEmail && sellerEmail.includes('@')) {
                    await emailService.sendProductRemovedNotification(
                        sellerEmail,
                        sellerName,
                        productData.name || productData.title || 'Your Product',
                        {
                            category: productData.category,
                            price: productData.price
                        }
                    ).catch(err => console.error('[AdminRemoveProduct] Email error:', err));
                }
            }
        }

        return res.status(200).json({ success: true, message: "Product removed by admin" });
    } catch (error) {
        console.error("[AdminRemoveProduct] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to remove product" });
    }
};

/**
 * Get all admin-removed products (adminRemoved === true)
 */
const getAdminRemovedProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").where("adminRemoved", "==", true).get();

        const removed = [];
        const sellerIds = new Set();
        
        productsSnap.docs.forEach(doc => {
            const data = doc.data();
            let removedOn = 'N/A';
            if (data.adminRemovedAt) {
                try {
                    const d = new Date(data.adminRemovedAt);
                    if (!isNaN(d.getTime())) removedOn = formatDateDDMMYYYY(d);
                } catch (_) {}
            }
            removed.push({
                id: doc.id,
                name: data.name || data.title || 'Unnamed Product',
                category: data.category || 'Uncategorized',
                sellerId: data.sellerId || 'Unknown',
                sellerName: data.sellerName || null,
                price: data.price || 0,
                removedOn,
                adminRemovedAt: data.adminRemovedAt || null,
            });
            if (data.sellerId) sellerIds.add(data.sellerId);
        });

        // Fetch seller names and sort newest first
        const sellerNamesMap = await fetchSellerNamesMap(Array.from(sellerIds));

        const removedWithNames = removed.map(p => ({
            ...p,
            sellerName: sellerNamesMap[p.sellerId] || p.sellerName || p.seller || (p.sellerId !== 'Unknown' ? p.sellerId : 'Unknown Seller')
        }));

        removedWithNames.sort((a, b) => {
            if (!a.adminRemovedAt) return 1;
            if (!b.adminRemovedAt) return -1;
            return new Date(b.adminRemovedAt) - new Date(a.adminRemovedAt);
        });

        return res.status(200).json({ success: true, products: removedWithNames, count: removedWithNames.length });
    } catch (error) {
        console.error("[GetAdminRemovedProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch removed products" });
    }
};

/**
 * Restore an admin-removed product — clears adminRemoved and adminRemovedAt
 */
const restoreAdminRemovedProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection("products").doc(id);
        const snap = await productRef.get();
        if (!snap.exists) return res.status(404).json({ success: false, message: "Product not found" });

        const productData = snap.data();
        const sellerId = productData.sellerId;

        await productRef.update({
            adminRemoved: admin.firestore.FieldValue.delete(),
            adminRemovedAt: admin.firestore.FieldValue.delete()
        });

        // Add dashboard notification for seller (Restoration)
        if (sellerId) {
            await db.collection('sellers').doc(sellerId).update({
                productRemovedNotification: {
                    productName: productData.name || productData.title || 'Product',
                    productId: id,
                    restoredAt: new Date().toISOString(),
                    seen: false,
                    type: 'RESTORATION'
                }
            }).catch(err => console.error('[RestoreProduct] Notification error:', err));

            // ALSO update listedproducts sub-collection
            await db.collection('sellers').doc(sellerId).collection('listedproducts').doc(id).update({
                adminRemoved: admin.firestore.FieldValue.delete(),
                adminRemovedAt: admin.firestore.FieldValue.delete()
            }).catch(() => {});

            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }

        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        // Send email notification to seller
        if (sellerId) {
            const [sellerDoc, userDoc] = await Promise.all([
                db.collection('sellers').doc(sellerId).get(),
                db.collection('users').doc(sellerId).get()
            ]);

            if (sellerDoc.exists || userDoc.exists) {
                const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
                const userData = userDoc.exists ? userDoc.data() : {};
                
                const sellerEmail = sellerData.contactEmail || sellerData.emailId || sellerData.email || sellerData.sellerEmail || userData.email || userData.emailId || userData.contactEmail;
                const sellerName = userData.fullName || userData.name || sellerData.shopName || sellerData.supplierName || sellerData.extractedName || 'Seller';

                if (sellerEmail && sellerEmail.includes('@')) {
                    await emailService.sendProductRestoredNotification(
                        sellerEmail,
                        sellerName,
                        productData.name || productData.title || 'Your Product',
                        {
                            category: productData.category,
                            price: productData.price
                        }
                    ).catch(err => console.error('[RestoreProduct] Email error:', err));
                }
            }
        }

        return res.status(200).json({ success: true, message: "Product restored successfully" });
    } catch (error) {
        console.error("[RestoreAdminRemovedProduct] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to restore product" });
    }
};

/**
 * Permanently delete ALL admin-removed products
 */
const deleteAllAdminRemovedProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").where("adminRemoved", "==", true).get();
        if (productsSnap.empty) return res.status(200).json({ success: true, message: "No removed products to delete", deleted: 0 });

        const batch = db.batch();
        const sellerIds = new Set();

        productsSnap.forEach(doc => {
            batch.delete(doc.ref);
            if (doc.data().sellerId) sellerIds.add(doc.data().sellerId);
        });

        await batch.commit();

        for (const sellerId of sellerIds) {
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }
        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        return res.status(200).json({ success: true, message: `Deleted ${productsSnap.size} removed products`, deleted: productsSnap.size });
    } catch (error) {
        console.error("[DeleteAllAdminRemovedProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete all removed products" });
    }
};

module.exports = {
    getAllProducts, getInactiveProducts, deleteProduct, deleteAllInactiveProducts,
    getOutOfStockProducts, notifySellerOutOfStock, notifyAllSellersOutOfStock,
    adminRemoveProduct, getAdminRemovedProducts, restoreAdminRemovedProduct, deleteAllAdminRemovedProducts
};
