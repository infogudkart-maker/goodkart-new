'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');

/**
 * Approve a pending seller.
 * Updates sellers collection, syncs role to users collection, and sends approval email.
 */
const approveSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        await db.collection('sellers').doc(uid).update({
            sellerStatus: 'APPROVED',
            approvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('users').doc(uid).update({ role: 'SELLER' });
        
        // Send approval notification email
        const [sellerDoc, userDoc] = await Promise.all([
            db.collection('sellers').doc(uid).get(),
            db.collection('users').doc(uid).get()
        ]);

        if (sellerDoc.exists && userDoc.exists) {
            const sellerData = sellerDoc.data();
            const userData = userDoc.data();
            const emailService = require('../../../shared/services/emailService');
            await emailService.sendSellerApprovalEmail(
                userData.email || userData.phone,
                userData.fullName || 'Seller',
                sellerData.shopName
            );
        }
        
        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: 'Seller approved successfully' });
    } catch (error) {
        console.error('[ApproveSeller] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to approve seller' });
    }
};

/**
 * Reject a pending seller and send rejection email.
 */
const rejectSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        const { reason } = req.body;
        
        await db.collection('sellers').doc(uid).update({
            sellerStatus: 'REJECTED',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectionReason: reason || 'Application did not meet our requirements'
        });
        
        // Send rejection notification email
        const [sellerDoc, userDoc] = await Promise.all([
            db.collection('sellers').doc(uid).get(),
            db.collection('users').doc(uid).get()
        ]);

        if (sellerDoc.exists && userDoc.exists) {
            const sellerData = sellerDoc.data();
            const userData = userDoc.data();
            const emailService = require('../../../shared/services/emailService');
            await emailService.sendSellerRejectionEmail(
                userData.email || userData.phone,
                userData.fullName || 'Seller',
                sellerData.shopName,
                reason || 'Application did not meet our requirements'
            );
        }
        
        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: 'Seller rejected successfully' });
    } catch (error) {
        console.error('[RejectSeller] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject seller' });
    }
};

/**
 * Move a rejected seller back to PENDING for re-review.
 */
const acceptRejectedSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        await db.collection('sellers').doc(uid).update({
            sellerStatus: 'PENDING',
            acceptedFromRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedAt: admin.firestore.FieldValue.delete()
        });
        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({ success: true, message: 'Seller moved to pending approval' });
    } catch (error) {
        console.error('[AcceptRejectedSeller] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to accept seller' });
    }
};

/**
 * Block a seller — deactivates their account and sends email notification.
 */
const blockSeller = async (req, res) => {
    try {
        const { uid } = req.params;
        const { reason } = req.body;

        await db.collection('sellers').doc(uid).update({
            isBlocked: true,
            blockedAt: admin.firestore.FieldValue.serverTimestamp(),
            blockReason: reason || 'Policy violation'
        });

        await db.collection('users').doc(uid).update({
            isActive: false,
            blockedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send block notification email
        const [sellerDoc, userDoc] = await Promise.all([
            db.collection('sellers').doc(uid).get(),
            db.collection('users').doc(uid).get()
        ]);

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
        return res.status(200).json({ success: true, message: 'Seller blocked successfully' });
    } catch (error) {
        console.error('[BlockSeller] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to block seller' });
    }
};

/**
 * Unblock a seller — reactivates their account and sends email.
 */
const unblockSeller = async (req, res) => {
    try {
        const { uid } = req.params;

        await db.collection('sellers').doc(uid).update({
            isBlocked: false,
            sellerStatus: 'PENDING',
            unblockedAt: admin.firestore.FieldValue.serverTimestamp(),
            blockReason: admin.firestore.FieldValue.delete()
        });

        await db.collection('users').doc(uid).update({ isActive: true });

        // Send unblock notification email
        const [sellerDoc, userDoc] = await Promise.all([
            db.collection('sellers').doc(uid).get(),
            db.collection('users').doc(uid).get()
        ]);

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
        return res.status(200).json({ success: true, message: 'Seller unblocked and moved to pending approval' });
    } catch (error) {
        console.error('[UnblockSeller] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to unblock seller' });
    }
};

/**
 * Permanently delete a blocked or rejected seller and all their products/reviews.
 */
const deleteSeller = async (req, res) => {
    try {
        const { uid } = req.params;

        const sellerDoc = await db.collection('sellers').doc(uid).get();
        if (!sellerDoc.exists) return res.status(404).json({ success: false, message: 'Seller not found' });

        const sellerData = sellerDoc.data();
        if (!sellerData.isBlocked && sellerData.sellerStatus !== 'REJECTED') {
            return res.status(400).json({ success: false, message: 'Only blocked or rejected sellers can be deleted' });
        }

        // Delete all their products
        const productsSnap = await db.collection('products').where('sellerId', '==', uid).get();
        await Promise.all(productsSnap.docs.map(doc => doc.ref.delete()));

        // Delete all reviews for those products
        const productIds = productsSnap.docs.map(doc => doc.id);
        for (let i = 0; i < productIds.length; i += 10) {
            const batch = productIds.slice(i, i + 10);
            const reviewsSnap = await db.collection('reviews').where('productId', 'in', batch).get();
            await Promise.all(reviewsSnap.docs.map(doc => doc.ref.delete()));
        }

        await db.collection('sellers').doc(uid).delete();
        await db.collection('users').doc(uid).update({ role: 'CONSUMER' });

        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({
            success: true,
            message: 'Seller and all their data deleted successfully',
            deletedProducts: productsSnap.size
        });
    } catch (error) {
        console.error('[DeleteSeller] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete seller' });
    }
};

/**
 * Delete ALL blocked sellers and their data in one batch operation.
 */
const deleteAllBlockedSellers = async (req, res) => {
    try {
        const blockedSnap = await db.collection('sellers').where('isBlocked', '==', true).get();
        if (blockedSnap.empty) {
            return res.status(200).json({ success: true, message: 'No blocked sellers to delete', deletedSellers: 0, deletedProducts: 0 });
        }

        const sellerUids = blockedSnap.docs.map(doc => doc.id);
        let totalProductsDeleted = 0;

        for (const uid of sellerUids) {
            const productsSnap = await db.collection('products').where('sellerId', '==', uid).get();
            totalProductsDeleted += productsSnap.size;
            await Promise.all(productsSnap.docs.map(doc => doc.ref.delete()));

            const productIds = productsSnap.docs.map(doc => doc.id);
            for (let i = 0; i < productIds.length; i += 10) {
                const batch = productIds.slice(i, i + 10);
                const reviewsSnap = await db.collection('reviews').where('productId', 'in', batch).get();
                await Promise.all(reviewsSnap.docs.map(doc => doc.ref.delete()));
            }
        }

        await Promise.all(blockedSnap.docs.map(doc => doc.ref.delete()));
        for (let i = 0; i < sellerUids.length; i += 10) {
            const batch = sellerUids.slice(i, i + 10);
            await Promise.all(batch.map(uid => db.collection('users').doc(uid).update({ role: 'CONSUMER' })));
        }

        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({
            success: true,
            message: `Successfully deleted ${sellerUids.length} blocked sellers and their data`,
            deletedSellers: sellerUids.length,
            deletedProducts: totalProductsDeleted
        });
    } catch (error) {
        console.error('[DeleteAllBlockedSellers] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete blocked sellers' });
    }
};

/**
 * Delete ALL rejected (non-blocked) sellers and their data.
 */
const deleteAllRejectedSellers = async (req, res) => {
    try {
        const rejectedSnap = await db.collection('sellers')
            .where('sellerStatus', '==', 'REJECTED')
            .where('isBlocked', '==', false)
            .get();

        if (rejectedSnap.empty) {
            return res.status(200).json({ success: true, message: 'No rejected sellers to delete', deletedSellers: 0, deletedProducts: 0 });
        }

        const sellerUids = rejectedSnap.docs.map(doc => doc.id);
        let totalProductsDeleted = 0;

        for (const uid of sellerUids) {
            const productsSnap = await db.collection('products').where('sellerId', '==', uid).get();
            totalProductsDeleted += productsSnap.size;
            await Promise.all(productsSnap.docs.map(doc => doc.ref.delete()));

            const productIds = productsSnap.docs.map(doc => doc.id);
            for (let i = 0; i < productIds.length; i += 10) {
                const batch = productIds.slice(i, i + 10);
                const reviewsSnap = await db.collection('reviews').where('productId', 'in', batch).get();
                await Promise.all(reviewsSnap.docs.map(doc => doc.ref.delete()));
            }
        }

        await Promise.all(rejectedSnap.docs.map(doc => doc.ref.delete()));
        for (let i = 0; i < sellerUids.length; i += 10) {
            const batch = sellerUids.slice(i, i + 10);
            await Promise.all(batch.map(uid => db.collection('users').doc(uid).update({ role: 'CONSUMER' })));
        }

        cache.invalidate('adminStats', 'allSellers');
        return res.status(200).json({
            success: true,
            message: `Successfully deleted ${sellerUids.length} rejected sellers and their data`,
            deletedSellers: sellerUids.length,
            deletedProducts: totalProductsDeleted
        });
    } catch (error) {
        console.error('[DeleteAllRejectedSellers] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete rejected sellers' });
    }
};

module.exports = {
    approveSeller,
    rejectSeller,
    acceptRejectedSeller,
    blockSeller,
    unblockSeller,
    deleteSeller,
    deleteAllBlockedSellers,
    deleteAllRejectedSellers
};
