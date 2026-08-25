'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');
const { formatDateDDMMYYYY } = require('../../../utils/dateFormat');

const ADMIN_REVIEWS_CACHE_TTL = 0; // No cache — always fetch fresh for real-time status
const ADMIN_ANALYTICS_CACHE_TTL = 600; // 10 minutes in seconds

/**
 * Get all reviews for admin dashboard
 * Returns all customer reviews with ratings, feedback, and product details
 * Only includes reviews for products that exist in the database
 */
const getAllReviews = async (req, res) => {
    try {
        // Always fetch fresh — no cache, so product status is always real-time
        const reviewsSnap = await db.collection("reviews").get();
        
        console.log(`[GetAllReviews] Total reviews in database: ${reviewsSnap.docs.length}`);

        const productsSnap = await db.collection("products").get();
        const productsMap = {};
        productsSnap.forEach(doc => {
            const productData = doc.data();
            productsMap[doc.id] = { 
                id: doc.id,
                ...productData,
                title: productData.title || productData.name || 'Unknown Product',
                category: productData.category || 'Uncategorized',
                brand: productData.brand || productData.brandName || 'No Brand',
            };
        });

        console.log(`[GetAllReviews] Total products in database: ${productsSnap.docs.length}`);

        const reviews = [];
        let skippedReviews = 0;

        for (const doc of reviewsSnap.docs) {
            const data = doc.data();
            const productId = data.productId;

            if (!productId || !productsMap[productId]) {
                console.log(`[GetAllReviews] Skipping review ${doc.id} - Product not found: ${productId}`);
                skippedReviews++;
                continue;
            }

            const product = productsMap[productId];

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
                    console.error('Date formatting error for review:', doc.id, e);
                }
            }

            if (formattedDate === 'N/A' || formattedDate === 'NN/NN/NNNN') {
                const now = new Date();
                formattedDate = formatDateDDMMYYYY(now);
                timestamp = now.getTime();
            }
            
            const productReviews = reviewsSnap.docs.filter(d => {
                const reviewData = d.data();
                return reviewData.productId === productId && productsMap[reviewData.productId];
            });
            const productReviewCount = productReviews.length;
            const productAvgRating = productReviewCount > 0 
                ? productReviews.reduce((sum, d) => sum + (d.data().rating || 0), 0) / productReviewCount 
                : 0;

            // Get product image - check multiple possible fields
            const productImage = product.image || 
                                product.images?.[0] || 
                                product.imageUrl || 
                                product.thumbnail || 
                                product.mainImage || 
                                null;

            // Determine product status based on actual Firestore fields
            // Products use status: "Active" when live
            // If status is missing/undefined, assume Active (newly added products may not have it yet)
            const productStatusField = product.status;
            let productStatus = 'ACTIVE';

            if (productStatusField && productStatusField.toLowerCase() !== 'active') {
                // Has a status value but it's not "Active" — removed/disabled
                productStatus = 'INACTIVE';
            } else {
                // Active or no status field — check stock
                const stockVal = product.stock ?? product.quantity ?? product.stockQuantity ?? product.availableStock ?? null;
                if (stockVal !== null && stockVal !== undefined && Number(stockVal) <= 0) {
                    productStatus = 'OUT_OF_STOCK';
                }
                // If stock field doesn't exist at all, keep as ACTIVE
            }

            console.log(`[GetAllReviews] Product "${product.title}" status="${productStatusField}" stock=${product.stock ?? product.quantity ?? 'N/A'} → ${productStatus}`);

            reviews.push({
                id: doc.id,
                ...data,
                customerName: data.customerName || data.userName || 'Anonymous',
                customerId: data.userId || data.customerId || 'N/A',
                productName: product.title,
                productId: productId,
                productImage: productImage,  // Add product image
                productCategory: product.category,
                productBrand: product.brand,
                productAvgRating: parseFloat(productAvgRating.toFixed(1)),
                productReviewCount: productReviewCount,
                productStatus: productStatus,
                rating: data.rating || 0,
                title: data.title || '',
                body: data.body || data.review || '',
                feedback: data.feedback || data.body || data.review || '',
                verified: data.verified || data.verifiedPurchase || false,
                date: formattedDate,
                timestamp: timestamp,
                createdAt: data.createdAt || null
            });
        }

        reviews.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`[GetAllReviews] Returning ${reviews.length} reviews (skipped ${skippedReviews} reviews for non-existent products)`);

        return res.status(200).json({
            success: true,
            reviews: reviews,
            count: reviews.length,
            skipped: skippedReviews
        });
    } catch (error) {
        console.error("[GetAllReviews] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
    }
};

/**
 * Get seller analytics for payout section
 * Returns approved sellers with their financial metrics
 */
const getSellerAnalytics = async (req, res) => {
    try {
        const cached = cache.get('adminSellerAnalytics');
        if (cached) return res.status(200).json({ success: true, analytics: cached });

        const sellersSnap = await db.collection("sellers").where("sellerStatus", "==", "APPROVED").get();

        const [allOrdersSnap, allProductsSnap] = await Promise.all([
            db.collection("orders").get(),
            db.collection("products").get()
        ]);
        const allOrders = allOrdersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const productsBySeller = {};
        allProductsSnap.forEach(doc => {
            const p = doc.data();
            const sid = p.sellerId;
            if (!sid) return;
            if (!productsBySeller[sid]) productsBySeller[sid] = [];
            productsBySeller[sid].push({ id: doc.id, ...p });
        });

        const sellerUids = sellersSnap.docs.map(d => d.id);
        const userEmailMap = {};
        for (let i = 0; i < sellerUids.length; i += 10) {
            const batch = sellerUids.slice(i, i + 10);
            const usersSnap = await db.collection("users")
                .where(admin.firestore.FieldPath.documentId(), "in", batch)
                .get();
            usersSnap.forEach(d => {
                const u = d.data();
                userEmailMap[d.id] = u.email || u.phone || "N/A";
            });
        }

        const sellers = [];

        for (const doc of sellersSnap.docs) {
            const sellerData = doc.data();
            const uid = doc.id;

            const sellerProducts = productsBySeller[uid] || [];
            const productsSnap = { size: sellerProducts.length, forEach: (cb) => sellerProducts.forEach(p => cb({ id: p.id, data: () => p })) };
            let totalProducts = 0;
            let totalStockLeft = 0;
            let totalProductValue = 0;
            let productStats = {};

            console.log(`[GetSellerAnalytics] Processing ${productsSnap.size} products for seller ${uid}`);

            productsSnap.forEach(p => {
                const prod = p.data();
                totalProducts++;
                totalStockLeft += (prod.stock || 0);
                totalProductValue += (prod.price || 0) * (prod.stock || 0);
                
                let productDate = 'N/A';
                let productTimestamp = 0;
                
                const dateField = prod.createdAt || prod.updatedAt || prod.publishedAt;
                
                if (dateField) {
                    try {
                        const date = dateField.toDate ? dateField.toDate() : new Date(dateField);
                        if (!isNaN(date.getTime())) {
                            productDate = formatDateDDMMYYYY(date);
                            productTimestamp = date.getTime();
                        }
                    } catch (e) {
                        console.error('Date formatting error for product:', p.id, e);
                    }
                }
                
                if (productDate === 'N/A') {
                    const now = new Date();
                    productDate = formatDateDDMMYYYY(now);
                    productTimestamp = now.getTime();
                }
                
                productStats[p.id] = { 
                    id: p.id, 
                    name: prod.title, 
                    price: prod.price || 0,
                    discountedPrice: prod.discountedPrice || null,
                    stock: prod.stock || 0, 
                    sold: 0, 
                    revenue: 0,
                    date: productDate,
                    timestamp: productTimestamp
                };
            });

            let unitsSold = 0;
            let grossRevenue = 0;
            allOrders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item.sellerId === uid) {
                            unitsSold += (item.quantity || 1);
                            const revenue = (item.price || 0) * (item.quantity || 1);
                            grossRevenue += revenue;
                            if (item.productId && productStats[item.productId]) {
                                productStats[item.productId].sold += (item.quantity || 1);
                                productStats[item.productId].revenue += revenue;
                            }
                        }
                    });
                }
            });

            let formattedDate = 'N/A';
            let timestamp = 0;
            
            const dateField = sellerData.appliedAt || sellerData.createdAt;
            console.log(`[GetSellerAnalytics] Seller ${uid} - appliedAt:`, sellerData.appliedAt ? 'exists' : 'missing', 'createdAt:', sellerData.createdAt ? 'exists' : 'missing');
            
            if (dateField) {
                try {
                    const date = dateField.toDate ? dateField.toDate() : new Date(dateField);
                    if (!isNaN(date.getTime())) {
                        formattedDate = formatDateDDMMYYYY(date);
                        timestamp = date.getTime();
                        console.log(`[GetSellerAnalytics] Seller ${uid} (${sellerData.shopName}) - formatted date: ${formattedDate}`);
                    }
                } catch (e) {
                    console.error('Date formatting error for seller:', uid, e);
                }
            } else {
                console.warn(`[GetSellerAnalytics] Seller ${uid} (${sellerData.shopName}) has no appliedAt or createdAt field`);
            }

            sellers.push({
                uid,
                shopName: sellerData.shopName,
                email: userEmailMap[uid] || "N/A",
                category: sellerData.category,
                createdAt: sellerData.createdAt,
                joined: formattedDate,
                timestamp: timestamp,
                gstNumber: sellerData.gstNumber || null,
                panNumber: sellerData.panNumber || null,
                bankName: sellerData.bankName || null,
                accountHolderName: sellerData.accountHolderName || null,
                accountNumber: sellerData.accountNumber || null,
                ifscCode: sellerData.ifscCode || null,
                upiId: sellerData.upiId || null,
                metrics: { 
                    totalProducts, 
                    totalStockLeft, 
                    totalProductValue, 
                    unitsSold, 
                    grossRevenue 
                },
                productMatrix: Object.values(productStats).sort((a, b) => b.timestamp - a.timestamp)
            });
        }

        sellers.sort((a, b) => b.timestamp - a.timestamp);

        cache.set('adminSellerAnalytics', sellers, ADMIN_ANALYTICS_CACHE_TTL);
        return res.status(200).json({ success: true, analytics: sellers });
    } catch (error) {
        console.error("[GetSellerAnalytics] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
};

/**
 * Get bank details for a specific seller
 */
const getSellerBankDetails = async (req, res) => {
    try {
        const { uid } = req.params;
        
        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }
        
        const sellerData = sellerSnap.data();
        
        const bankDetails = {
            bankName: sellerData.bankName || null,
            accountHolderName: sellerData.accountHolderName || null,
            accountNumber: sellerData.accountNumber || null,
            ifscCode: sellerData.ifscCode || null,
            upiId: sellerData.upiId || null
        };
        
        return res.status(200).json({ success: true, bankDetails });
    } catch (error) {
        console.error("[GetSellerBankDetails] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch bank details" });
    }
};

/**
 * Delete a specific review
 */
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        if (!reviewId) {
            return res.status(400).json({ success: false, message: "Review ID is required" });
        }

        const reviewRef = db.collection("reviews").doc(reviewId);
        const reviewSnap = await reviewRef.get();

        if (!reviewSnap.exists) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const reviewData = reviewSnap.data();
        const productId = reviewData.productId;

        await reviewRef.delete();

        console.log(`[DeleteReview] Deleted review ${reviewId} for product ${productId}`);

        if (productId) {
            try {
                const remainingReviewsSnap = await db.collection("reviews")
                    .where("productId", "==", productId)
                    .get();

                const reviewCount = remainingReviewsSnap.size;
                let avgRating = 0;

                if (reviewCount > 0) {
                    const totalRating = remainingReviewsSnap.docs.reduce((sum, doc) => {
                        return sum + (doc.data().rating || 0);
                    }, 0);
                    avgRating = totalRating / reviewCount;
                }

                await db.collection("products").doc(productId).update({
                    averageRating: avgRating,
                    reviewCount: reviewCount
                });

                console.log(`[DeleteReview] Updated product ${productId} - avgRating: ${avgRating}, reviewCount: ${reviewCount}`);
            } catch (updateError) {
                console.error(`[DeleteReview] Error updating product ratings:`, updateError);
            }
        }

        cache.invalidate('adminAllReviews');
        cache.invalidate('adminStats'); // Invalidate stats cache to update review count
        if (productId) cache.invalidate(`reviews_${productId}`);

        return res.status(200).json({ 
            success: true, 
            message: "Review deleted successfully",
            reviewId: reviewId
        });
    } catch (error) {
        console.error("[DeleteReview] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete review" });
    }
};

module.exports = {
    getAllReviews,
    getSellerAnalytics,
    getSellerBankDetails,
    deleteReview
};
