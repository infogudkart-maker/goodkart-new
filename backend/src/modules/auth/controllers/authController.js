'use strict';
const crypto = require('crypto');
const { admin, db } = require('../../../config/firebase');
const { ADMIN_UID } = require('../../../middleware/auth');

// Phone login uses an on-screen OTP (generated in the browser, no SMS). Set MOCK_PHONE_OTP=false
// in the backend environment to switch this phone-only login off again.
const MOCK_PHONE_OTP_ENABLED = String(process.env.MOCK_PHONE_OTP || 'true').toLowerCase() !== 'false';

/**
 * Handles user login (email/password, Google, or phone with the on-screen OTP).
 *
 * `loginAs` ('CONSUMER' default | 'SELLER') says which side of the site the person is logging in
 * to. One account (same email / phone / uid) can be both a customer and a seller, so the role
 * returned is decided by that side - a seller is never forced into the seller role on the
 * customer side, and the stored user role is never rewritten here.
 */
const login = async (req, res) => {
    try {
        const { idToken, phone, mockPhoneOtp } = req.body;
        const loginAs = String(req.body.loginAs || 'CONSUMER').toUpperCase() === 'SELLER' ? 'SELLER' : 'CONSUMER';

        let uid, phoneNumber = null, email = null, fullName = null, isGoogle = false, customToken = null;

        if (idToken) {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
            phoneNumber = decodedToken.phone_number || null;
            email = decodedToken.email || null;
            fullName = decodedToken.name || null;
            isGoogle = !!(decodedToken.firebase && decodedToken.firebase.sign_in_provider === 'google.com');
        } else if (mockPhoneOtp === true && MOCK_PHONE_OTP_ENABLED && phone) {
            // Phone + on-screen OTP login: the number must already belong to a registered user.
            const digits = String(phone).replace(/\D/g, '').slice(-10);
            if (digits.length !== 10) return res.status(400).json({ success: false, message: "A valid 10-digit mobile number is required" });
            const variants = [`+91${digits}`, digits, `91${digits}`];
            const phoneSnap = await db.collection("users").where("phone", "in", variants).limit(1).get();
            if (phoneSnap.empty) {
                return res.status(200).json({ success: true, requiresRegistration: true, role: "CONSUMER", status: "NEW_USER", message: "No account found for this number. Please register first." });
            }
            uid = phoneSnap.docs[0].id;
            phoneNumber = `+91${digits}`;
            // Gives the browser a real Firebase session so protected API calls keep working.
            try { customToken = await admin.auth().createCustomToken(uid); } catch (e) { console.warn('[Login] Could not create custom token:', e.message); }
        } else {
            return res.status(400).json({ success: false, message: "ID token is required" });
        }

        const reply = (body) => res.status(200).json(customToken ? { ...body, customToken } : body);

        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            // First login: create the account automatically as a CONSUMER
            await userRef.set({
                uid,
                phone: phoneNumber,
                email,
                fullName: isGoogle ? (fullName || "User") : fullName,
                role: "CONSUMER",
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return reply({
                success: true, uid, role: "CONSUMER", fullName: isGoogle ? (fullName || "User") : fullName, status: "NEW_USER",
                message: isGoogle ? "New user created via Google" : "New user created as CONSUMER",
            });
        }

        const userData = userSnap.data();
        if (userData.isActive === false) {
            return res.status(403).json({ success: false, role: userData.role, message: "Account is disabled. Contact support." });
        }

        // Seller details are only returned when logging in from the seller side. On the customer
        // side the same account simply logs in as a customer.
        if (loginAs === 'SELLER') {
            const sellerSnap = await db.collection("sellers").doc(uid).get();

            if (sellerSnap.exists) {
                const sellerData = sellerSnap.data();
                const sellerStatus = sellerData.sellerStatus || "PENDING";
                const fn = userData.fullName || fullName;

                if (sellerStatus === "APPROVED") return reply({ success: true, uid, role: "SELLER", fullName: fn, status: "APPROVED", sellerStatus: "APPROVED", shopName: sellerData.shopName, message: "Seller login successful" });
                if (sellerStatus === "REJECTED") return reply({ success: true, uid, role: "SELLER", fullName: fn, status: "REJECTED", sellerStatus: "REJECTED", message: "Your seller application was rejected. You can reapply with updated information.", canReapply: true });
                if (sellerData.isBlocked === true) return reply({ success: true, uid, role: "SELLER", fullName: fn, status: "BLOCKED", sellerStatus: "BLOCKED", message: "Your seller account is blocked. Contact admin for more information.", canReapply: false });
                return reply({ success: true, uid, role: "SELLER", fullName: fn, status: "PENDING", sellerStatus: "PENDING", shopName: sellerData.shopName, message: "Seller approval pending" });
            }
        }

        return reply({ success: true, uid, role: "CONSUMER", status: "AUTHORIZED", fullName: userData.fullName || fullName, email: userData.email || email, message: "Consumer login successful" });

    } catch (error) {
        console.error("AUTH ERROR:", error);
        if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(503).json({ success: false, quotaExceeded: true, message: "Quota Exceeded." });
        }
        // Only a token that fails verification is a real 401 (e.g. a token issued by a
        // different Firebase project). Anything else - Firestore errors, a bug - used to be
        // reported as "401 Authentication failed" too, which hid the real cause.
        if (typeof error.code === 'string' && error.code.startsWith('auth/')) {
            return res.status(401).json({ success: false, message: "Sign-in token could not be verified. The app and the server must use the same Firebase project (goodkart)." });
        }
        return res.status(500).json({ success: false, message: "Login failed on the server. Please check the backend logs." });
    }
};

/**
 * Tells the login screen whether a mobile number already belongs to a user, so existing
 * users go on to the OTP step and new users are sent to the registration form first.
 */
const checkUser = async (req, res) => {
    try {
        const digits = String(req.body?.phone || '').replace(/\D/g, '').slice(-10);
        if (digits.length !== 10) {
            return res.status(400).json({ success: false, message: "A valid 10-digit mobile number is required" });
        }

        // Phone numbers are stored as "+91XXXXXXXXXX", but older records may lack the prefix.
        const variants = [`+91${digits}`, digits, `91${digits}`];
        const snap = await db.collection('users').where('phone', 'in', variants).limit(1).get();

        return res.status(200).json({ success: true, exists: !snap.empty });
    } catch (error) {
        console.error("CHECK USER ERROR:", error);
        if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(503).json({ success: false, quotaExceeded: true, message: "Quota Exceeded." });
        }
        return res.status(500).json({ success: false, message: "Could not check this number. Please try again." });
    }
};

/**
 * Sends a 6-digit OTP to the user's email address.
 */
const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Generate 6 digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to Firestore with 10 minute expiration
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await db.collection('email_otps').doc(email.toLowerCase()).set({
            otp: otpCode,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send via Nodemailer
        const emailService = require('../../../shared/services/emailService');
        const emailResult = await emailService.sendOtpEmail(email, otpCode);

        if (!emailResult) {
            return res.status(500).json({ success: false, message: "Failed to send OTP email" });
        }

        return res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        console.error("SEND OTP ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to process OTP request" });
    }
};

/**
 * Handles user registration.
 */
const register = async (req, res) => {
    try {
        const { idToken, phone, fullName, dob, email, password } = req.body;

        if (!idToken) return res.status(400).json({ success: false, message: "ID token is required" });
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const phoneNumber = decodedToken.phone_number || phone;

        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();

        const userData = {
            uid, phone: phoneNumber || null, fullName: fullName || "User",
            dateOfBirth: dob || null, email: email || null, password: password || null,
            role: "CONSUMER", isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (userSnap.exists) {
            const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            if (fullName) updates.fullName = fullName;
            if (dob) updates.dateOfBirth = dob;
            if (email) updates.email = email;
            if (password) updates.password = password;
            await userRef.update(updates);
        } else {
            await userRef.set(userData);
        }

        return res.status(200).json({ success: true, uid, role: "CONSUMER", status: "REGISTERED", fullName: fullName || "User", message: "Registration successful" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Registration failed: " + error.message });
    }
};

/**
 * Handles seller application.
 */
const applySeller = async (req, res) => {
    try {
        const { sellerDetails } = req.body;
        const uid = req.user.uid;

        if (!sellerDetails?.shopName || !sellerDetails?.category || !sellerDetails?.address) {
            return res.status(400).json({ success: false, message: "Missing required details" });
        }

        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) return res.status(404).json({ success: false, message: "User not found" });

        const userData = userSnap.data();

        // Check if seller document actually exists (may have been deleted manually)
        const sellerRef = db.collection("sellers").doc(uid);
        const sellerSnap = await sellerRef.get();

        if (sellerSnap.exists) {
            const existingSellerData = sellerSnap.data();
            // Only block if they are an APPROVED or PENDING seller
            if (existingSellerData.sellerStatus === "APPROVED" || existingSellerData.sellerStatus === "PENDING") {
                console.log(`[ApplySeller] ERROR: User is already a SELLER with status: ${existingSellerData.sellerStatus}`);
                return res.status(400).json({ success: false, message: `Already a seller (status: ${existingSellerData.sellerStatus})` });
            }

            // If REJECTED or BLOCKED, allow reapplication by updating the existing document
            if (existingSellerData.sellerStatus === "REJECTED" || existingSellerData.isBlocked === true) {
                console.log(`[ApplySeller] Seller was ${existingSellerData.sellerStatus || 'BLOCKED'}. Allowing reapplication.`);
                await sellerRef.update({
                    ...sellerDetails,
                    sellerStatus: "PENDING",
                    isBlocked: false,
                    reappliedAt: admin.firestore.FieldValue.serverTimestamp(),
                    previousStatus: existingSellerData.sellerStatus,
                    rejectedAt: admin.firestore.FieldValue.delete(),
                    rejectionReason: admin.firestore.FieldValue.delete(),
                    blockedAt: admin.firestore.FieldValue.delete(),
                    blockReason: admin.firestore.FieldValue.delete()
                });

                // The same account stays a customer too - only make sure it is active
                await userRef.update({
                    isActive: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                return res.status(200).json({
                    success: true,
                    uid,
                    message: "Reapplication submitted successfully. Pending admin approval.",
                    status: "PENDING"
                });
            }
        }

        // Scrub undefined values to prevent Firestore errors
        const finalData = JSON.parse(JSON.stringify(sellerDetails));

        console.log(`[ApplySeller] Storing new seller data in DB...`);
        await sellerRef.set({
            uid,
            ...finalData,
            sellerStatus: "PENDING",
            isBlocked: false,
            appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Keep the account's customer role as it is: a seller can also shop with the same account.
        await userRef.update({ updatedAt: admin.firestore.FieldValue.serverTimestamp() });

        return res.status(200).json({ success: true, uid, message: "Applied successfully", status: "PENDING" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Application failed" });
    }
};

/**
 * Check if a user has already applied as a seller and return status.
 */
const checkSellerStatus = async (req, res) => {
    try {
        const uid = req.user.uid;
        const sellerRef = db.collection("sellers").doc(uid);
        const sellerSnap = await sellerRef.get();

        if (!sellerSnap.exists) {
            return res.status(200).json({ success: true, hasApplied: false, sellerStatus: null });
        }

        const sellerData = sellerSnap.data();
        return res.status(200).json({
            success: true,
            hasApplied: true,
            sellerStatus: sellerData.sellerStatus || 'PENDING',
            shopName: sellerData.shopName || ''
        });
    } catch (error) {
        console.error('CHECK SELLER STATUS ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to check seller status' });
    }
};

/**
 * Extract identity data from Aadhaar card image using AI.
 */
const extractAadhar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });

        const geminiService = require('../../../shared/services/geminiService');
        const cloudinary = require('../../../config/cloudinary');
        const { Readable } = require('stream');

        // AI Extraction
        const extractedData = await geminiService.extractAadhaarData(req.file.buffer, req.file.mimetype);

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'aadhaar_cards' },
                (error, result) => error ? reject(error) : resolve(result)
            );
            Readable.from([req.file.buffer]).pipe(uploadStream);
        });

        return res.status(200).json({
            success: true,
            data: {
                ...extractedData,
                imageUrl: uploadResult.secure_url
            }
        });
    } catch (error) {
        console.error("[ExtractAadhar] ERROR:", error);
        return res.status(500).json({ success: false, message: "Aadhaar processing failed" });
    }
};

/**
 * Upload a generic image to Cloudinary.
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image provided" });
        const cloudinary = require('../../../config/cloudinary');
        const { Readable } = require('stream');

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "general" },
                (error, result) => error ? reject(error) : resolve(result)
            );
            Readable.from([req.file.buffer]).pipe(uploadStream);
        });

        return res.status(200).json({ success: true, url: result.secure_url });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Upload failed" });
    }
};

/**
 * Management login. The ONLY way into the admin portal: the email and password
 * must match ADMIN_EMAIL / ADMIN_PASSWORD from the server environment.
 * On success a Firebase custom token is returned; the browser signs in with it and
 * from then on every admin request carries a normal, verified Firebase ID token.
 */
const safeEqual = (a, b) => {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
};

const adminLogin = async (req, res) => {
    try {
        const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const adminPassword = String(process.env.ADMIN_PASSWORD || '');

        if (!adminEmail || !adminPassword) {
            console.error('[AdminLogin] ADMIN_EMAIL / ADMIN_PASSWORD are not set in the environment.');
            return res.status(503).json({ success: false, message: "Admin login is not configured." });
        }

        const { email, password } = req.body || {};
        const emailOk = safeEqual(String(email || '').trim().toLowerCase(), adminEmail);
        const passwordOk = safeEqual(String(password || ''), adminPassword);

        if (!emailOk || !passwordOk) {
            // Slow down guessing
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.status(401).json({ success: false, message: "Invalid admin credentials." });
        }

        await db.collection("users").doc(ADMIN_UID).set({
            uid: ADMIN_UID,
            email: adminEmail,
            role: "ADMIN",
            isActive: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        const customToken = await admin.auth().createCustomToken(ADMIN_UID, { role: "ADMIN" });

        return res.status(200).json({
            success: true, uid: ADMIN_UID, role: "ADMIN", status: "AUTHORIZED",
            email: adminEmail, fullName: "Admin", customToken,
            message: "Admin login successful",
        });
    } catch (error) {
        console.error("ADMIN LOGIN ERROR:", error);
        return res.status(500).json({ success: false, message: "Admin login failed on the server." });
    }
};

module.exports = { login, register, applySeller, extractAadhar, uploadImage, sendEmailOtp, checkSellerStatus, checkUser, adminLogin };