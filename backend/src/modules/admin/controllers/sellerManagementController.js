'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');
const { formatDateDDMMYYYY } = require('../../../utils/dateFormat');

/**
 * Get pending sellers (for Pending Approval section).
 */
const getPendingSellers = async (req, res) => {
    try {
        const sellersSnap = await db.collection("sellers")
            .where("sellerStatus", "==", "PENDING")
            .get();

        const filteredDocs = sellersSnap.docs.filter(doc => {
            const data = doc.data();
            return data.isBlocked !== true;
        });

        const sellerIds = filteredDocs.map(d => d.id);

        console.log(`[GetPendingSellers] Total PENDING sellers: ${sellersSnap.docs.length}, After filtering blocked: ${sellerIds.length}`);

        const userMap = {};
        for (let i = 0; i < sellerIds.length; i += 10) {
            const batch = sellerIds.slice(i, i + 10);
            if (batch.length === 0) continue;
            const usersSnap = await db.collection("users")
                .where(admin.firestore.FieldPath.documentId(), "in", batch)
                .get();
            usersSnap.forEach(d => { userMap[d.id] = d.data(); });
        }

        const sellers = filteredDocs.map(doc => {
            const sellerData = doc.data();
            const userData = userMap[doc.id] || {};
            
            let joinedDate = 'N/A';
            if (sellerData.appliedAt) {
                try {
                    joinedDate = formatDateDDMMYYYY(sellerData.appliedAt);
                } catch (e) {
                    console.error(`Date formatting error for seller ${doc.id}:`, e);
                }
            }
            
            return {
                uid: doc.id,
                name: sellerData.shopName || 'Unknown Shop',
                email: userData.email || userData.phone || "N/A",
                phone: userData.phone || "N/A",
                status: sellerData.sellerStatus || 'PENDING',
                joined: joinedDate,
                shopName: sellerData.shopName || 'Unknown Shop',
                category: sellerData.category || 'Uncategorized',
                extractedName: sellerData.extractedName || sellerData.fullName || null,
                aadhaarNumber: sellerData.aadhaarNumber || null,
                aadhaarImageUrl: sellerData.aadhaarImageUrl || null,
                age: sellerData.age || null,
                gender: sellerData.gender || null,
                address: sellerData.address || sellerData.shopAddress || null,
                appliedAt: sellerData.appliedAt || null,
                bankName: sellerData.bankName || null,
                accountHolderName: sellerData.accountHolderName || null,
                accountNumber: sellerData.accountNumber || null,
                ifscCode: sellerData.ifscCode || null,
                upiId: sellerData.upiId || null,
                gstNumber: sellerData.gstNumber || null,
                panNumber: sellerData.panNumber || null,
                supplierName: sellerData.supplierName || null,
                businessType: sellerData.businessType || null,
                contactEmail: sellerData.contactEmail || null,
                dateOfBirth: sellerData.dateOfBirth || null,
            };
        });

        console.log(`[GetPendingSellers] Returning ${sellers.length} pending sellers`);
        return res.status(200).json({ success: true, sellers });
    } catch (error) {
        console.error("[GetPendingSellers] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch pending sellers" });
    }
};

/**
 * Get all sellers for management.
 */
const getAllSellers = async (req, res) => {
    try {
        const cached = cache.get('allSellers');
        if (cached) return res.status(200).json({ success: true, sellers: cached.sellers, categorized: cached.categorized });

        const [sellersSnap, ordersSnap] = await Promise.all([
            db.collection("sellers").get(),
            db.collection("orders").where("status", "==", "Delivered").get()
        ]);

        console.log(`[GetAllSellers] Total sellers in database: ${sellersSnap.docs.length}`);

        const deliveredOrders = ordersSnap.docs.map(o => o.data());
        const sellerIds = sellersSnap.docs.map(d => d.id);

        const userMap = {};
        for (let i = 0; i < sellerIds.length; i += 10) {
            const batch = sellerIds.slice(i, i + 10);
            if (batch.length === 0) continue;
            const usersSnap = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", batch).get();
            usersSnap.forEach(d => { userMap[d.id] = d.data(); });
        }

        const productCountMap = {};
        for (let i = 0; i < sellerIds.length; i += 10) {
            const batch = sellerIds.slice(i, i + 10);
            if (batch.length === 0) continue;
            const productsSnap = await db.collection("products").where("sellerId", "in", batch).get();
            productsSnap.forEach(d => {
                const sid = d.data().sellerId;
                if (sid) productCountMap[sid] = (productCountMap[sid] || 0) + 1;
            });
        }

        const financialsMap = {};
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        deliveredOrders.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;
            
            // Get order date
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
            const isWithinWeek = orderDate && orderDate >= oneWeekAgo;
            
            const sellerHits = {};
            order.items.forEach(item => {
                if (!item.sellerId) return;
                if (!sellerHits[item.sellerId]) {
                    sellerHits[item.sellerId] = { rev: 0, weeklyRev: 0 };
                    financialsMap[item.sellerId] = financialsMap[item.sellerId] || { 
                        totalRevenue: 0, 
                        deliveredCount: 0,
                        weeklySales: 0 
                    };
                }
                const itemRevenue = (item.price || 0) * (item.quantity || 1);
                sellerHits[item.sellerId].rev += itemRevenue;
                if (isWithinWeek) {
                    sellerHits[item.sellerId].weeklyRev += itemRevenue;
                }
            });
            Object.entries(sellerHits).forEach(([sid, { rev, weeklyRev }]) => {
                financialsMap[sid].totalRevenue += rev;
                financialsMap[sid].weeklySales += weeklyRev;
                financialsMap[sid].deliveredCount += 1;
            });
        });

        const sellers = sellersSnap.docs.map(doc => {
            const sellerData = doc.data();
            const userData = userMap[doc.id] || {};
            const fin = financialsMap[doc.id] || { totalRevenue: 0, deliveredCount: 0, weeklySales: 0 };
            
            let formattedDate = 'N/A';
            const dateField = sellerData.createdAt || sellerData.appliedAt;
            if (dateField) {
                try {
                    const date = dateField.toDate ? dateField.toDate() : new Date(dateField);
                    if (!isNaN(date.getTime())) {
                        formattedDate = formatDateDDMMYYYY(date);
                    }
                } catch (e) {
                    console.error(`Date formatting error for seller ${doc.id}:`, e);
                }
            }
            
            return {
                uid: doc.id,
                name: sellerData.shopName || 'Unknown Shop',
                email: userData.email || userData.phone || "N/A",
                phone: userData.phone || "N/A",
                status: sellerData.sellerStatus || 'PENDING',
                joined: formattedDate,
                shopName: sellerData.shopName || 'Unknown Shop',
                category: sellerData.category || 'Uncategorized',
                isBlocked: sellerData.isBlocked === true,
                blockReason: sellerData.blockReason || null,
                extractedName: sellerData.extractedName || sellerData.fullName || null,
                aadhaarNumber: sellerData.aadhaarNumber || null,
                aadhaarImageUrl: sellerData.aadhaarImageUrl || null,
                age: sellerData.age || null,
                gender: sellerData.gender || null,
                address: sellerData.address || sellerData.shopAddress || null,
                appliedAt: sellerData.appliedAt || null,
                createdAt: sellerData.createdAt || null,
                bankName: sellerData.bankName || null,
                accountHolderName: sellerData.accountHolderName || null,
                accountNumber: sellerData.accountNumber || null,
                ifscCode: sellerData.ifscCode || null,
                upiId: sellerData.upiId || null,
                gstNumber: sellerData.gstNumber || null,
                panNumber: sellerData.panNumber || null,
                supplierName: sellerData.supplierName || null,
                businessType: sellerData.businessType || null,
                contactEmail: sellerData.contactEmail || null,
                dateOfBirth: sellerData.dateOfBirth || null,
                financials: {
                    totalProducts: productCountMap[doc.id] || 0,
                    totalRevenue: fin.totalRevenue,
                    deliveredCount: fin.deliveredCount,
                    weeklySales: fin.weeklySales
                }
            };
        });

        const approvedSellers = sellers.filter(s => s.status === 'APPROVED' && !s.isBlocked);
        const pendingSellers = sellers.filter(s => s.status === 'PENDING' && !s.isBlocked);
        const rejectedSellers = sellers.filter(s => s.status === 'REJECTED' && !s.isBlocked);
        const blockedSellers = sellers.filter(s => s.isBlocked);

        console.log(`[GetAllSellers] Categorized sellers:`, {
            total: sellers.length,
            approved: approvedSellers.length,
            pending: pendingSellers.length,
            rejected: rejectedSellers.length,
            blocked: blockedSellers.length
        });

        sellers.forEach(s => {
            console.log(`[GetAllSellers] Seller ${s.uid}: status=${s.status}, isBlocked=${s.isBlocked}, shopName=${s.shopName}`);
        });

        cache.set('allSellers', { sellers, categorized: { approved: approvedSellers, pending: pendingSellers, rejected: rejectedSellers, blocked: blockedSellers } });
        return res.status(200).json({ 
            success: true, 
            sellers: sellers,
            categorized: {
                approved: approvedSellers,
                pending: pendingSellers,
                rejected: rejectedSellers,
                blocked: blockedSellers
            }
        });
    } catch (error) {
        console.error("[AllSellers] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch all sellers" });
    }
};

/**
 * Approve a seller.
 */
const approveSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        await db.collection("sellers").doc(uid).update({
            sellerStatus: "APPROVED",
            approvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection("users").doc(uid).update({ role: "SELLER" });
        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: "Seller approved successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to approve seller" });
    }
};

/**
 * Reject a seller.
 */
const rejectSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        await db.collection("sellers").doc(uid).update({
            sellerStatus: "REJECTED",
            rejectedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: "Seller rejected successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to reject seller" });
    }
};

/**
 * Accept a rejected seller (move back to PENDING).
 */
const acceptRejectedSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        
        await db.collection("sellers").doc(uid).update({
            sellerStatus: "PENDING",
            acceptedFromRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedAt: admin.firestore.FieldValue.delete()
        });

        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: "Seller moved to pending approval" });
    } catch (error) {
        console.error("[AcceptRejectedSeller] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to accept seller" });
    }
};

/**
 * Block a seller.
 */
const blockSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        const { reason } = req.body;

        await db.collection("sellers").doc(uid).update({
            isBlocked: true,
            blockedAt: admin.firestore.FieldValue.serverTimestamp(),
            blockReason: reason || "Policy violation"
        });

        await db.collection("users").doc(uid).update({
            isActive: false,
            blockedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const sellerDoc = await db.collection("sellers").doc(uid).get();
        const userDoc = await db.collection("users").doc(uid).get();
        
        if (sellerDoc.exists && userDoc.exists) {
            const sellerData = sellerDoc.data();
            const userData = userDoc.data();
            
            const emailService = require('../../../shared/services/emailService');
            await emailService.sendSellerBlockedEmail(
                userData.email || userData.phone,
                userData.fullName || 'Seller',
                sellerData.shopName,
                reason || 'Policy violation'
            );
        }

        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: "Seller blocked successfully" });
    } catch (error) {
        console.error("[BlockSeller] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to block seller" });
    }
};

/**
 * Unblock a seller.
 */
const unblockSeller = async (req, res) => {
    try {
        const { uid } = req.params;

        await db.collection("sellers").doc(uid).update({
            isBlocked: false,
            sellerStatus: "PENDING",
            unblockedAt: admin.firestore.FieldValue.serverTimestamp(),
            blockReason: admin.firestore.FieldValue.delete()
        });

        await db.collection("users").doc(uid).update({
            isActive: true
        });

        const sellerDoc = await db.collection("sellers").doc(uid).get();
        const userDoc = await db.collection("users").doc(uid).get();
        
        if (sellerDoc.exists && userDoc.exists) {
            const sellerData = sellerDoc.data();
            const userData = userDoc.data();
            
            const emailService = require('../../../shared/services/emailService');
            await emailService.sendSellerUnblockedEmail(
                userData.email || userData.phone,
                userData.fullName || 'Seller',
                sellerData.shopName
            );
        }

        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: "Seller unblocked and moved to pending approval" });
    } catch (error) {
        console.error("[UnblockSeller] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to unblock seller" });
    }
};

/**
 * Delete a blocked seller and all their data
 */
const deleteSeller = async (req, res) => {
    try {
        const { uid } = req.params;

        const sellerDoc = await db.collection("sellers").doc(uid).get();
        if (!sellerDoc.exists) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        const sellerData = sellerDoc.data();
        if (!sellerData.isBlocked && sellerData.sellerStatus !== 'REJECTED') {
            return res.status(400).json({ success: false, message: "Only blocked or rejected sellers can be deleted" });
        }

        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        const productDeletePromises = productsSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(productDeletePromises);

        const productIds = productsSnap.docs.map(doc => doc.id);
        if (productIds.length > 0) {
            for (let i = 0; i < productIds.length; i += 10) {
                const batch = productIds.slice(i, i + 10);
                const reviewsSnap = await db.collection("reviews").where("productId", "in", batch).get();
                const reviewDeletePromises = reviewsSnap.docs.map(doc => doc.ref.delete());
                await Promise.all(reviewDeletePromises);
            }
        }

        await db.collection("sellers").doc(uid).delete();
        await db.collection("users").doc(uid).update({ role: "CONSUMER" });

        cache.invalidate('adminStats', 'allSellers');
        console.log(`[DeleteSeller] Deleted seller ${uid} and ${productsSnap.size} products`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Seller and all their data deleted successfully",
            deletedProducts: productsSnap.size
        });
    } catch (error) {
        console.error("[DeleteSeller] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete seller" });
    }
};

/**
 * Delete all blocked sellers and their data
 */
const deleteAllBlockedSellers = async (req, res) => {
    try {
        const blockedSellersSnap = await db.collection("sellers").where("isBlocked", "==", true).get();
        
        if (blockedSellersSnap.empty) {
            return res.status(200).json({ 
                success: true, 
                message: "No blocked sellers to delete",
                deletedSellers: 0,
                deletedProducts: 0
            });
        }

        const sellerUids = blockedSellersSnap.docs.map(doc => doc.id);
        let totalProductsDeleted = 0;

        for (const uid of sellerUids) {
            const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
            totalProductsDeleted += productsSnap.size;
            
            const productDeletePromises = productsSnap.docs.map(doc => doc.ref.delete());
            await Promise.all(productDeletePromises);

            const productIds = productsSnap.docs.map(doc => doc.id);
            if (productIds.length > 0) {
                for (let i = 0; i < productIds.length; i += 10) {
                    const batch = productIds.slice(i, i + 10);
                    const reviewsSnap = await db.collection("reviews").where("productId", "in", batch).get();
                    const reviewDeletePromises = reviewsSnap.docs.map(doc => doc.ref.delete());
                    await Promise.all(reviewDeletePromises);
                }
            }
        }

        const sellerDeletePromises = blockedSellersSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(sellerDeletePromises);

        for (let i = 0; i < sellerUids.length; i += 10) {
            const batch = sellerUids.slice(i, i + 10);
            const updatePromises = batch.map(uid => 
                db.collection("users").doc(uid).update({ role: "CONSUMER" })
            );
            await Promise.all(updatePromises);
        }

        cache.invalidate('adminStats', 'allSellers');
        console.log(`[DeleteAllBlockedSellers] Deleted ${sellerUids.length} sellers and ${totalProductsDeleted} products`);
        
        return res.status(200).json({ 
            success: true, 
            message: `Successfully deleted ${sellerUids.length} blocked sellers and their data`,
            deletedSellers: sellerUids.length,
            deletedProducts: totalProductsDeleted
        });
    } catch (error) {
        console.error("[DeleteAllBlockedSellers] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete blocked sellers" });
    }
};

/**
 * Delete all rejected sellers and their data
 */
const deleteAllRejectedSellers = async (req, res) => {
    try {
        const rejectedSellersSnap = await db.collection("sellers")
            .where("sellerStatus", "==", "REJECTED")
            .where("isBlocked", "==", false)
            .get();
        
        if (rejectedSellersSnap.empty) {
            return res.status(200).json({ 
                success: true, 
                message: "No rejected sellers to delete",
                deletedSellers: 0,
                deletedProducts: 0
            });
        }

        const sellerUids = rejectedSellersSnap.docs.map(doc => doc.id);
        let totalProductsDeleted = 0;

        for (const uid of sellerUids) {
            const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
            totalProductsDeleted += productsSnap.size;
            
            const productDeletePromises = productsSnap.docs.map(doc => doc.ref.delete());
            await Promise.all(productDeletePromises);

            const productIds = productsSnap.docs.map(doc => doc.id);
            if (productIds.length > 0) {
                for (let i = 0; i < productIds.length; i += 10) {
                    const batch = productIds.slice(i, i + 10);
                    const reviewsSnap = await db.collection("reviews").where("productId", "in", batch).get();
                    const reviewDeletePromises = reviewsSnap.docs.map(doc => doc.ref.delete());
                    await Promise.all(reviewDeletePromises);
                }
            }
        }

        const sellerDeletePromises = rejectedSellersSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(sellerDeletePromises);

        for (let i = 0; i < sellerUids.length; i += 10) {
            const batch = sellerUids.slice(i, i + 10);
            const updatePromises = batch.map(uid => 
                db.collection("users").doc(uid).update({ role: "CONSUMER" })
            );
            await Promise.all(updatePromises);
        }

        cache.invalidate('adminStats', 'allSellers');
        console.log(`[DeleteAllRejectedSellers] Deleted ${sellerUids.length} sellers and ${totalProductsDeleted} products`);
        
        return res.status(200).json({ 
            success: true, 
            message: `Successfully deleted ${sellerUids.length} rejected sellers and their data`,
            deletedSellers: sellerUids.length,
            deletedProducts: totalProductsDeleted
        });
    } catch (error) {
        console.error("[DeleteAllRejectedSellers] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete rejected sellers" });
    }
};

/**
 * Get sellers with pending edit requests (from correction_requests collection)
 */
const getSellersWithEditRequests = async (req, res) => {
    try {
        // Fetch all PENDING correction requests
        const requestsSnap = await db.collection('correction_requests')
            .where('status', '==', 'PENDING')
            .get();

        console.log(`[GetSellersWithEditRequests] Found ${requestsSnap.size} pending correction requests`);

        if (requestsSnap.empty) {
            return res.json({ success: true, sellers: [] });
        }

        // Sort by createdAt descending in memory (avoids needing a composite index)
        const sortedDocs = requestsSnap.docs.sort((a, b) => {
            const aTime = a.data().createdAt?.toMillis?.() || 0;
            const bTime = b.data().createdAt?.toMillis?.() || 0;
            return bTime - aTime;
        });

        // Get unique seller UIDs
        const sellerUids = [...new Set(sortedDocs.map(d => d.data().sellerUid).filter(Boolean))];

        // Fetch seller and user data in batches
        const sellerMap = {};
        const userMap = {};
        for (let i = 0; i < sellerUids.length; i += 10) {
            const batch = sellerUids.slice(i, i + 10);
            if (!batch.length) continue;
            const [sellersSnap, usersSnap] = await Promise.all([
                db.collection('sellers').where(admin.firestore.FieldPath.documentId(), 'in', batch).get(),
                db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', batch).get()
            ]);
            sellersSnap.forEach(d => { sellerMap[d.id] = d.data(); });
            usersSnap.forEach(d => { userMap[d.id] = d.data(); });
        }

        // Build response — one entry per correction request (not per seller)
        const sellers = sortedDocs.map(doc => {
            const reqData = doc.data();
            const uid = reqData.sellerUid;
            const sellerData = sellerMap[uid] || {};
            const userData = userMap[uid] || {};

            let requestDate = 'N/A';
            if (reqData.createdAt) {
                try { requestDate = formatDateDDMMYYYY(reqData.createdAt); } catch (e) { /* ignore */ }
            }

            let joinedDate = 'N/A';
            const dateField = sellerData.createdAt || sellerData.appliedAt;
            if (dateField) {
                try { joinedDate = formatDateDDMMYYYY(dateField); } catch (e) { /* ignore */ }
            }

            return {
                requestId: doc.id,
                uid,
                shopName: reqData.shopName || sellerData.shopName || 'Unknown Shop',
                sellerName: reqData.sellerName || sellerData.name || 'Unknown Seller',
                email: userData.email || userData.phone || 'N/A',
                phone: userData.phone || 'N/A',
                category: sellerData.category || 'Uncategorized',
                status: sellerData.sellerStatus || 'UNKNOWN',
                isBlocked: sellerData.isBlocked || false,
                joined: joinedDate,
                requestDate,
                message: reqData.message || '',
                adminNote: reqData.adminNote || ''
            };
        });

        res.json({ success: true, sellers });
    } catch (error) {
        console.error('[GetSellersWithEditRequests] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch edit requests' });
    }
};

/**
 * Update seller details (admin edit)
 */
const updateSellerDetails = async (req, res) => {
    try {
        const { uid } = req.params;
        const { personalInfo, businessInfo, bankDetails, pickupInfo, adminNotes } = req.body;

        console.log(`[UpdateSellerDetails] ========== START UPDATE ==========`);
        console.log(`[UpdateSellerDetails] Seller UID: ${uid}`);
        console.log(`[UpdateSellerDetails] Personal Info:`, JSON.stringify(personalInfo, null, 2));
        console.log(`[UpdateSellerDetails] Business Info:`, JSON.stringify(businessInfo, null, 2));
        console.log(`[UpdateSellerDetails] Bank Details:`, JSON.stringify(bankDetails, null, 2));
        console.log(`[UpdateSellerDetails] Pickup Info:`, JSON.stringify(pickupInfo, null, 2));

        // Update seller document
        const sellerRef = db.collection("sellers").doc(uid);
        const sellerDoc = await sellerRef.get();
        
        if (!sellerDoc.exists) {
            console.error(`[UpdateSellerDetails] Seller ${uid} NOT FOUND in sellers collection`);
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        // Update user document for personal info
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            console.error(`[UpdateSellerDetails] User ${uid} NOT FOUND in users collection`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const sellerData = sellerDoc.data();
        console.log(`[UpdateSellerDetails] Current seller data - shopName: ${sellerData.shopName}, category: ${sellerData.category}`);

        // Prepare updates — all registration fields
        const sellerUpdates = {
            // Personal info
            name: personalInfo?.name || sellerData.name || '',
            fullName: personalInfo?.name || sellerData.fullName || '',
            address: personalInfo?.address || sellerData.address || '',
            shopAddress: personalInfo?.address || sellerData.shopAddress || '',
            city: personalInfo?.city || sellerData.city || '',
            state: personalInfo?.state || sellerData.state || '',
            pincode: personalInfo?.pincode || sellerData.pincode || '',
            emailId: personalInfo?.emailId || personalInfo?.email || sellerData.emailId || '',
            phoneNumber: personalInfo?.phoneNumber || personalInfo?.phone || sellerData.phoneNumber || '',
            extractedName: personalInfo?.extractedName || sellerData.extractedName || '',

            // Business info
            shopName: businessInfo?.shopName || sellerData.shopName || '',
            supplierName: businessInfo?.supplierName || sellerData.supplierName || '',
            businessType: businessInfo?.businessType || sellerData.businessType || '',
            gstNumber: businessInfo?.gstNumber || sellerData.gstNumber || '',
            panNumber: businessInfo?.panNumber || sellerData.panNumber || '',
            category: businessInfo?.category || businessInfo?.productCategory || sellerData.category || 'Uncategorized',
            productCategory: businessInfo?.productCategory || businessInfo?.category || sellerData.productCategory || '',
            shopCategory: businessInfo?.productCategory || businessInfo?.category || sellerData.shopCategory || '',
            contactEmail: businessInfo?.contactEmail || sellerData.contactEmail || '',

            // Pickup address
            pickupAddress: pickupInfo?.pickupAddress || sellerData.pickupAddress || '',
            pickupCity: pickupInfo?.pickupCity || sellerData.pickupCity || '',
            pickupState: pickupInfo?.pickupState || sellerData.pickupState || '',
            pickupPincode: pickupInfo?.pickupPincode || sellerData.pickupPincode || '',

            // Bank details
            accountNumber: bankDetails?.accountNumber || sellerData.accountNumber || '',
            ifscCode: bankDetails?.ifscCode || sellerData.ifscCode || '',
            bankName: bankDetails?.bankName || sellerData.bankName || '',
            accountHolderName: bankDetails?.accountHolderName || bankDetails?.bankAccountName || sellerData.accountHolderName || '',
            bankAccountName: bankDetails?.bankAccountName || bankDetails?.accountHolderName || sellerData.bankAccountName || '',
            upiId: bankDetails?.upiId || sellerData.upiId || '',

            // Clear edit request
            hasEditRequest: false,
            editRequest: admin.firestore.FieldValue.delete(),
            editRequestDate: admin.firestore.FieldValue.delete(),

            // Metadata
            lastUpdatedBy: 'admin',
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminNotes: adminNotes || '',

            // Notification for seller
            adminUpdateNotification: {
                message: 'Admin has updated your profile details.',
                updatedAt: new Date().toISOString(),
                seen: false
            }
        };

        const userUpdates = {
            email: personalInfo?.email || personalInfo?.emailId || '',
            phone: personalInfo?.phone || personalInfo?.phoneNumber || '',
            fullName: personalInfo?.name || ''
        };

        console.log(`[UpdateSellerDetails] Seller updates to apply:`, JSON.stringify(sellerUpdates, null, 2));
        console.log(`[UpdateSellerDetails] User updates to apply:`, JSON.stringify(userUpdates, null, 2));

        // Check if there are actual changes (compare with existing data)
        let hasChanges = false;
        const fieldsToCheck = ['name', 'shopName', 'email', 'phone', 'address', 'city', 'state', 'pincode', 
                               'gstNumber', 'panNumber', 'category', 'accountNumber', 'ifscCode', 'bankName'];
        
        for (const field of fieldsToCheck) {
            if (sellerUpdates[field] && sellerUpdates[field] !== sellerData[field]) {
                hasChanges = true;
                console.log(`[UpdateSellerDetails] Change detected in field: ${field}`);
                console.log(`  Old: ${sellerData[field]}`);
                console.log(`  New: ${sellerUpdates[field]}`);
                break;
            }
        }

        if (!hasChanges) {
            console.log(`[UpdateSellerDetails] ⚠️ No actual changes detected, skipping notification`);
            // Remove notification from updates if no changes
            delete sellerUpdates.adminUpdateNotification;
        } else {
            console.log(`[UpdateSellerDetails] ✅ Changes detected, will create notification`);
        }

        // Perform updates
        await sellerRef.update(sellerUpdates);
        console.log(`[UpdateSellerDetails] ✅ Seller document updated in Firebase`);
        
        await userRef.update(userUpdates);
        console.log(`[UpdateSellerDetails] ✅ User document updated in Firebase`);

        // Clear all relevant caches
        cache.invalidate('allSellers', 'pendingSellers', `sellerDash_${uid}`, 'adminStats');
        console.log(`[UpdateSellerDetails] ✅ Caches invalidated: allSellers, pendingSellers, sellerDash_${uid}, adminStats`);

        console.log(`[UpdateSellerDetails] ========== UPDATE COMPLETE ==========`);
        res.json({ success: true, message: 'Seller details updated successfully' });

    } catch (error) {
        console.error('[UpdateSellerDetails] ❌ ERROR:', error);
        console.error('[UpdateSellerDetails] Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to update seller details' });
    }
};

/**
 * Get seller details for editing
 */
const getSellerForEdit = async (req, res) => {
    try {
        const { uid } = req.params;

        const sellerDoc = await db.collection("sellers").doc(uid).get();
        const userDoc = await db.collection("users").doc(uid).get();

        if (!sellerDoc.exists || !userDoc.exists) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        const sellerData = sellerDoc.data();
        const userData = userDoc.data();

        const seller = {
            uid: uid,
            personalInfo: {
                name: userData.fullName || sellerData.name || '',
                email: userData.email || sellerData.emailId || sellerData.contactEmail || '',
                phone: userData.phone || sellerData.phoneNumber || '',
                address: sellerData.address || sellerData.shopAddress || '',
                city: sellerData.city || '',
                state: sellerData.state || '',
                pincode: sellerData.pincode || '',
                aadhaarNumber: sellerData.aadhaarNumber || '',
                extractedName: sellerData.extractedName || '',
                age: sellerData.age || '',
                gender: sellerData.gender || '',
                emailId: sellerData.emailId || userData.email || '',
                phoneNumber: sellerData.phoneNumber || userData.phone || ''
            },
            businessInfo: {
                shopName: sellerData.shopName || '',
                supplierName: sellerData.supplierName || '',
                businessType: sellerData.businessType || '',
                gstNumber: sellerData.gstNumber || '',
                panNumber: sellerData.panNumber || '',
                category: sellerData.category || sellerData.productCategory || sellerData.shopCategory || '',
                productCategory: sellerData.productCategory || sellerData.shopCategory || sellerData.category || '',
                contactEmail: sellerData.contactEmail || userData.email || ''
            },
            pickupInfo: {
                pickupAddress: sellerData.pickupAddress || sellerData.address || '',
                pickupCity: sellerData.pickupCity || sellerData.city || '',
                pickupState: sellerData.pickupState || sellerData.state || '',
                pickupPincode: sellerData.pickupPincode || sellerData.pincode || ''
            },
            bankDetails: {
                accountNumber: sellerData.accountNumber || '',
                ifscCode: sellerData.ifscCode || '',
                bankName: sellerData.bankName || '',
                accountHolderName: sellerData.accountHolderName || sellerData.bankAccountName || '',
                bankAccountName: sellerData.bankAccountName || sellerData.accountHolderName || '',
                upiId: sellerData.upiId || ''
            },
            status: sellerData.sellerStatus || 'UNKNOWN',
            isBlocked: sellerData.isBlocked || false,
            hasEditRequest: sellerData.hasEditRequest || false,
            editRequest: sellerData.editRequest || {},
            adminNotes: sellerData.adminNotes || ''
        };

        res.json({ success: true, seller });
    } catch (error) {
        console.error('[GetSellerForEdit] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch seller details' });
    }
};


/**
 * Clear all edit requests (mark as resolved in correction_requests)
 */
const clearAllEditRequests = async (req, res) => {
    try {
        const requestsSnap = await db.collection('correction_requests')
            .where('status', '==', 'PENDING')
            .get();

        if (requestsSnap.empty) {
            return res.status(200).json({ success: true, message: 'No edit requests to clear', clearedCount: 0 });
        }

        const batch = db.batch();
        requestsSnap.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'DISMISSED',
                resolvedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();

        cache.invalidate('allSellers');
        console.log(`[ClearAllEditRequests] Dismissed ${requestsSnap.size} correction requests`);

        return res.status(200).json({ success: true, message: `Cleared ${requestsSnap.size} edit requests`, clearedCount: requestsSnap.size });
    } catch (error) {
        console.error('[ClearAllEditRequests] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear edit requests' });
    }
};


/**
 * Resolve a single correction request (called after admin edits the seller)
 */
const resolveEditRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminNote } = req.body;

        await db.collection('correction_requests').doc(requestId).update({
            status: 'RESOLVED',
            adminNote: adminNote || '',
            resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[ResolveEditRequest] Resolved request ${requestId}`);
        res.json({ success: true, message: 'Request resolved' });
    } catch (error) {
        console.error('[ResolveEditRequest] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to resolve request' });
    }
};


module.exports = {
    getPendingSellers,
    getAllSellers,
    approveSeller,
    rejectSeller,
    acceptRejectedSeller,
    blockSeller,
    unblockSeller,
    deleteSeller,
    deleteAllBlockedSellers,
    deleteAllRejectedSellers,
    getSellersWithEditRequests,
    updateSellerDetails,
    getSellerForEdit,
    clearAllEditRequests,
    resolveEditRequest
};

