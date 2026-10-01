'use strict';
const { admin } = require('../config/firebase');

const IS_DEV = process.env.NODE_ENV !== 'production';

// The one and only management account. It signs in with ADMIN_EMAIL / ADMIN_PASSWORD
// from the environment (POST /auth/admin-login) and always uses this uid.
// Set ADMIN_UID only if you want the admin to keep using an existing admin
// user's data (profile, settings).
const ADMIN_UID = process.env.ADMIN_UID || 'goodkart_admin';

/**
 * Verifies the Firebase ID token sent as "Authorization: Bearer <token>".
 * Attaches the decoded token to req.user.
 */
const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization header with Bearer token is required' });
        }
        const idToken = authHeader.split('Bearer ')[1];

        try {
            const decoded = await admin.auth().verifyIdToken(idToken);
            req.user = decoded;
            return next();
        } catch (err) {
            // DEV fallback: decode JWT payload without signature verify
            // (never accepted for admin routes - see verifyAdmin)
            if (IS_DEV) {
                try {
                    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'));
                    const uid = payload.user_id || payload.sub;
                    if (!uid) throw new Error('No UID');
                    const fbUser = await admin.auth().getUser(uid).catch(() => null);
                    if (!fbUser) throw new Error('User not in Firebase Auth');
                    req.user = { uid, ...payload, isDevFallback: true };
                    return next();
                } catch (_) { }
            }
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('[verifyAuth] ERROR:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

/**
 * Allows only the management account (see ADMIN_UID) through.
 * Must be used AFTER verifyAuth. The token must be a genuinely verified Firebase
 * token issued by /auth/admin-login, carrying the ADMIN role claim.
 */
const verifyAdmin = (req, res, next) => {
    const user = req.user;
    if (user && !user.isDevFallback && user.uid === ADMIN_UID && user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access denied' });
};

module.exports = { verifyAuth, verifyAdmin, ADMIN_UID };
