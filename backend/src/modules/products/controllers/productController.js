'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');

const PRODUCTS_CACHE_TTL = 60; // 60 seconds as per optimization report

/**
 * Get all available products (Public).
 * Cached by category for 60 seconds to minimize Firestore reads.
 */
const getAllProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const cacheKey = `products_${category || 'all'}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, products: cached });

        let query = db.collection("products").where("status", "==", "Active");

        if (category) {
            query = query.where("category", "==", category);
        }

        const snapshot = await query.get();
        const products = snapshot.docs
            .filter(doc => !doc.data().adminRemoved)
            .map(doc => ({ id: doc.id, ...doc.data() }));

        cache.set(cacheKey, products, PRODUCTS_CACHE_TTL);
        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error("[Products] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
};

/**
 * Get a single product by ID.
 * Individual products cached for 10 minutes.
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `product_${id}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, product: cached });

        const doc = await db.collection("products").doc(id).get();
        if (!doc.exists) return res.status(404).json({ success: false, message: "Product not found" });
        
        const data = doc.data();
        if (data.adminRemoved) return res.status(404).json({ success: false, message: "Product not found" });

        const product = { id: doc.id, ...data };
        cache.set(cacheKey, product, 600); // 10 minutes in seconds
        return res.status(200).json({ success: true, product });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
};

/**
 * Get all products listed by a specific seller.
 */
const getSellerProducts = async (req, res) => {
    try {
        const { uid } = req.params;
        const cacheKey = `sellerProducts_${uid}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, products: cached });

        const snapshot = await db.collection('products').where('sellerId', '==', uid).get();
        const products = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }));
        cache.set(cacheKey, products, 300); // 5 minutes in seconds
        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('[GetSellerProducts] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch seller products' });
    }
};

/**
 * Update a product in both main collection and seller sub-collection.
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { sellerId, productData } = req.body;

        if (!productData) return res.status(400).json({ success: false, message: 'productData is required' });

        const productRef = db.collection('products').doc(id);
        const productSnap = await productRef.get();
        if (!productSnap.exists) return res.status(404).json({ success: false, message: 'Product not found' });

        const resolvedSellerId = sellerId || productSnap.data().sellerId;

        // --- GST Validation for Sellers without GST Number ---
        if (resolvedSellerId) {
            const sellerSnap = await db.collection('sellers').doc(resolvedSellerId).get();
            const sellerData = sellerSnap.exists ? sellerSnap.data() : {};
            const hasGST = sellerData.hasGST === 'yes' && !!sellerData.gstNumber;

            if (!hasGST) {
                // If seller doesn't have GST, force category-based GST or keep existing
                // This prevents manual overrides from the client
                const adminConfigSnap = await db.collection('admin').doc('settings').get();
                const adminConfig = adminConfigSnap.exists ? adminConfigSnap.data() : {};
                const categoryGstRates = adminConfig.categoryGstRates || {};
                
                const category = productData.category || productSnap.data().category;
                const expectedGst = categoryGstRates[category] || adminConfig.defaultGstPercent || 18;

                if (productData.gstPercent !== undefined && Number(productData.gstPercent) !== Number(expectedGst)) {
                    productData.gstPercent = expectedGst; // Force the correct one
                }
            }
        }

        const updatePayload = { ...productData, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        delete updatePayload.id;

        await productRef.update(updatePayload);

        if (resolvedSellerId) {
            await db.collection('sellers').doc(resolvedSellerId)
                .collection('listedproducts').doc(id).update(updatePayload).catch(() => {});
        }

        // Invalidate caches
        cache.invalidate(`product_${id}`, `sellerProducts_${resolvedSellerId}`);
        cache.invalidatePrefix('products_');

        return res.status(200).json({ success: true, message: 'Product updated successfully', forcedGst: productData.gstPercent });
    } catch (error) {
        console.error('[UpdateProduct] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to update product' });
    }
};

/**
 * Delete a product from both main collection and seller sub-collection.
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const productRef = db.collection('products').doc(id);
        const productSnap = await productRef.get();
        if (!productSnap.exists) return res.status(404).json({ success: false, message: 'Product not found' });

        const { sellerId } = productSnap.data();

        // Delete from main collection
        await productRef.delete();

        // Delete from seller sub-collection
        if (sellerId) {
            await db.collection('sellers').doc(sellerId)
                .collection('listedproducts').doc(id).delete().catch(() => {});
        }

        // Invalidate caches
        cache.invalidate(`product_${id}`, `sellerProducts_${sellerId}`);
        cache.invalidatePrefix('products_');
        if (sellerId) cache.invalidate(`sellerDash_${sellerId}`);

        return res.status(200).json({ success: true, message: 'Product deleted from all collections' });
    } catch (error) {
        console.error('[DeleteProduct] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
};

module.exports = { getAllProducts, getProductById, getSellerProducts, updateProduct, deleteProduct };
