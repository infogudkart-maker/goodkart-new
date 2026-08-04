'use strict';
const { admin, db } = require('../../../config/firebase');

/**
 * Handles user login (Firebase Token or Test Mode).
 */
const login = async (req, res) => {
    try {
        const { idToken, isTest, email: testEmail, phone } = req.body;

        let uid;
        let phoneNumber = null;
        let email = null;
        let fullName = null;
        let decodedToken = null;

        if (isTest) {
            uid = phone ? `test_${phone.replace(/[^0-9]/g, '')}` : `test_email_${(testEmail || "user").replace(/[^a-zA-Z0-9]/g, '')}`;
            email = testEmail || null;
            fullName = req.body.fullName || testEmail?.split('@')[0] || "Test User";
            phoneNumber = phone || null;

            // Try to find real user by phone number to support real sellers/admins in test mode
            if (phone) {
                const phoneVariants = [phone, phone.replace('+91', ''), phone.startsWith('+91') ? phone : `+91${phone.replace(/[^0-9]/g, '')}`];
                for (const variant of phoneVariants) {
                    const snap = await db.collection('users').where('phone', '==', variant).limit(1).get();
                    if (!snap.empty) {
                        uid = snap.docs[0].id;
                        const d = snap.docs[0].data();
                        fullName = d.fullName || fullName;
                        email = d.email || email;
                        break;
                    }
                }
            }
        } else {
            if (!idToken) return res.status(400).json({ success: false, message: "ID token is required" });
            decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
            phoneNumber = decodedToken.phone_number || null;
            email = decodedToken.email || null;
            fullName = decodedToken.name || null;
        }

        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            // Define test seller phone numbers
            const TEST_SELLER_PHONES = ['+919353469036', '+916366151635', '+919480290587'];
            const isTestSeller = phoneNumber && TEST_SELLER_PHONES.includes(phoneNumber);
            
            // If they are logging in from Google but don't exist yet, we automatically create them
            // This skips the "complete profile" step on the frontend
            if (decodedToken && decodedToken.firebase && decodedToken.firebase.sign_in_provider === 'google.com') {
                await userRef.set({
                    uid,
                    phone: phoneNumber,
                    email,
                    fullName: fullName || "User",
                    role: isTestSeller ? "SELLER" : "CONSUMER",
                    isActive: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                
                // If test seller, also create seller document
                if (isTestSeller) {
                    await db.collection("sellers").doc(uid).set({
                        uid,
                        shopName: "Test Seller Shop",
                        sellerStatus: "APPROVED",
                        isBlocked: false,
                        category: "General",
                        address: "Test Address",
                        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    
                    return res.status(200).json({
                        success: true, uid, role: "SELLER", fullName: fullName || "Test Seller", 
                        status: "APPROVED", sellerStatus: "APPROVED", shopName: "Test Seller Shop",
                        message: "Test seller created via Google",
                    });
                }

                return res.status(200).json({
                    success: true, uid, role: "CONSUMER", fullName: fullName || "User", status: "NEW_USER",
                    message: "New user created via Google",
                });
            }

            // Fallback for standard ID token automatic creation (e.g. standard email/password link if we were doing that)
            await userRef.set({
                uid,
                phone: phoneNumber,
                email,
                fullName,
                role: isTestSeller ? "SELLER" : "CONSUMER",
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            // If test seller, also create seller document
            if (isTestSeller) {
                await db.collection("sellers").doc(uid).set({
                    uid,
                    shopName: "Test Seller Shop",
                    sellerStatus: "APPROVED",
                    isBlocked: false,
                    category: "General",
                    address: "Test Address",
                    appliedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                
                return res.status(200).json({
                    success: true, uid, role: "SELLER", fullName: fullName || "Test Seller", 
                    status: "APPROVED", sellerStatus: "APPROVED", shopName: "Test Seller Shop",
                    message: "Test seller created",
                });
            }

            return res.status(200).json({
                success: true, uid, role: "CONSUMER", fullName, status: "NEW_USER",
                message: "New user created as CONSUMER",
            });
        }

        const userData = userSnap.data();
        if (userData.isActive === false) {
            return res.status(403).json({ success: false, role: userData.role, message: "Account is disabled. Contact support." });
        }

        const ADMIN_PHONE = "+917483743936";
        if (userData.role === "ADMIN" || phoneNumber === ADMIN_PHONE) {
            if (phoneNumber === ADMIN_PHONE) {
                if (userData.role !== "ADMIN") try { await userRef.update({ role: "ADMIN" }); } catch (e) { }
                return res.status(200).json({
                    success: true, uid, role: "ADMIN", status: "AUTHORIZED",
                    phone: phoneNumber, fullName: userData.fullName || "Admin User",
                    message: "Admin login successful"
                });
            }
        }
        
        // Check if this is a test seller phone number and upgrade to seller if needed
        const TEST_SELLER_PHONES = ['+919353469036', '+916366151635', '+919480290587'];
        const isTestSeller = phoneNumber && TEST_SELLER_PHONES.includes(phoneNumber);
        
        if (isTestSeller && userData.role !== "SELLER") {
            // Upgrade user to seller role
            try { await userRef.update({ role: "SELLER" }); } catch (e) { console.error("Failed to update role:", e); }
        }

        const sellerSnap = await db.collection("sellers").doc(uid).get();
        
        // If test seller but no seller document exists, create it
        if (isTestSeller && !sellerSnap.exists) {
            await db.collection("sellers").doc(uid).set({
                uid,
                shopName: "Test Seller Shop",
                sellerStatus: "APPROVED",
                isBlocked: false,
                category: "General",
                address: "Test Address",
                fullName: userData.fullName || "Test Seller",
                appliedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            return res.status(200).json({
                success: true, uid, role: "SELLER", 
                status: "APPROVED", sellerStatus: "APPROVED", 
                shopName: "Test Seller Shop",
                fullName: userData.fullName || "Test Seller",
                message: "Test seller upgraded and approved"
            });
        }
        
        if (sellerSnap.exists) {
            const sellerData = sellerSnap.data();
            const sellerStatus = sellerData.sellerStatus || "PENDING";
            if (userData.role !== "SELLER") try { await userRef.update({ role: "SELLER" }); } catch (_) { }

            if (sellerStatus === "APPROVED") return res.status(200).json({ success: true, uid, role: "SELLER", status: "APPROVED", sellerStatus: "APPROVED", shopName: sellerData.shopName, message: "Seller login successful" });
            if (sellerStatus === "REJECTED") return res.status(200).json({ success: true, uid, role: "SELLER", status: "REJECTED", sellerStatus: "REJECTED", message: "Your seller application was rejected. You can reapply with updated information.", canReapply: true });
            if (sellerData.isBlocked === true) return res.status(200).json({ success: true, uid, role: "SELLER", status: "BLOCKED", sellerStatus: "BLOCKED", message: "Your seller account is blocked. Contact admin for more information.", canReapply: false });
            return res.status(200).json({ success: true, uid, role: "SELLER", status: "PENDING", sellerStatus: "PENDING", shopName: sellerData.shopName, message: "Seller approval pending" });
        }

        return res.status(200).json({ success: true, uid, role: "CONSUMER", status: "AUTHORIZED", fullName: userData.fullName || fullName, message: "Consumer login successful" });

    } catch (error) {
        console.error("AUTH ERROR:", error);
        if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(503).json({ success: false, quotaExceeded: true, message: "Quota Exceeded." });
        }
        return res.status(401).json({ success: false, message: "Authentication failed" });
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
        const { idToken, phone, fullName, dob, email, password, isTest } = req.body;
        let uid;
        let phoneNumber = phone;

        if (isTest) {
            uid = phone ? `test_${phone.replace(/[^0-9]/g, '')}` : `test_email_${Date.now()}`;
        } else {
            if (!idToken) return res.status(400).json({ success: false, message: "ID token is required" });
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
            phoneNumber = decodedToken.phone_number || phone;
        }

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

        if (userData.role === "SELLER" && sellerSnap.exists) {
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

                // Ensure user is active and has SELLER role
                await userRef.update({
                    role: "SELLER",
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

        // If role says SELLER but no seller doc exists, reset the role so they can re-apply
        if (userData.role === "SELLER" && !sellerSnap.exists) {
            console.log(`[ApplySeller] Seller doc missing despite SELLER role. Resetting role to CONSUMER to allow re-application.`);
            await userRef.update({ role: "CONSUMER" });
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

        await userRef.update({ role: "SELLER", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

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
 * Handles test login with phone and OTP.
 */
const testLogin = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone number is required" });
        }

        // For test mode, accept any 6-digit OTP
        if (!otp || otp.length !== 6) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        const uid = `test_${phone.replace(/[^0-9]/g, '')}`;
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            // Determine role based on phone number
            const ADMIN_PHONE = "+917483743936";
            const TEST_SELLER_PHONES = ['+919353469036', '+916366151635', '+919480290587'];
            const isTestSeller = TEST_SELLER_PHONES.includes(phone);
            const initialRole = phone === ADMIN_PHONE ? "ADMIN" : (isTestSeller ? "SELLER" : "CONSUMER");

            // Create new test user
            await userRef.set({
                uid,
                phone,
                fullName: phone === ADMIN_PHONE ? "Admin User" : (isTestSeller ? "Test Seller" : `User ${phone.slice(-4)}`),
                role: initialRole,
                isActive: true,
                isTest: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            // If test seller, also create seller document
            if (isTestSeller) {
                await db.collection("sellers").doc(uid).set({
                    uid,
                    shopName: "Test Seller Shop",
                    sellerStatus: "APPROVED",
                    isBlocked: false,
                    category: "General",
                    address: "Test Address",
                    appliedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                
                return res.status(200).json({
                    success: true,
                    uid,
                    role: "SELLER",
                    fullName: "Test Seller",
                    status: "APPROVED",
                    sellerStatus: "APPROVED",
                    shopName: "Test Seller Shop",
                    message: "Test seller login successful",
                });
            }

            return res.status(200).json({
                success: true,
                uid,
                role: initialRole,
                fullName: phone === ADMIN_PHONE ? "Admin User" : `User ${phone.slice(-4)}`,
                status: initialRole === "ADMIN" ? "AUTHORIZED" : "NEW_USER",
                message: initialRole === "ADMIN" ? "Admin login successful" : "New test user created as CONSUMER",
            });
        }

        const userData = userSnap.data();
        if (userData.isActive === false) {
            return res.status(403).json({
                success: false,
                role: userData.role,
                message: "Account is disabled. Contact support."
            });
        }

        // Check for admin phone number (same as login handler)
        const ADMIN_PHONE = "+917483743936";
        if (userData.role === "ADMIN" || phone === ADMIN_PHONE) {
            if (phone === ADMIN_PHONE && userData.role !== "ADMIN") {
                try { await userRef.update({ role: "ADMIN" }); } catch (_) { }
            }
            return res.status(200).json({
                success: true,
                uid,
                role: "ADMIN",
                status: "AUTHORIZED",
                phone: phone,
                fullName: userData.fullName || "Admin User",
                message: "Admin login successful"
            });
        }
        
        // Check if this is a test seller phone number and upgrade to seller if needed
        const TEST_SELLER_PHONES = ['+919353469036', '+916366151635', '+919480290587'];
        const isTestSeller = TEST_SELLER_PHONES.includes(phone);
        
        if (isTestSeller && userData.role !== "SELLER") {
            // Upgrade user to seller role
            try { await userRef.update({ role: "SELLER" }); } catch (e) { console.error("Failed to update role:", e); }
        }

        // Check if user is a seller
        const sellerSnap = await db.collection("sellers").doc(uid).get();
        
        // If test seller but no seller document exists, create it
        if (isTestSeller && !sellerSnap.exists) {
            await db.collection("sellers").doc(uid).set({
                uid,
                shopName: "Test Seller Shop",
                sellerStatus: "APPROVED",
                isBlocked: false,
                category: "General",
                address: "Test Address",
                fullName: userData.fullName || "Test Seller",
                appliedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            return res.status(200).json({
                success: true,
                uid,
                role: "SELLER",
                status: "APPROVED",
                sellerStatus: "APPROVED",
                shopName: "Test Seller Shop",
                fullName: userData.fullName || "Test Seller",
                message: "Test seller upgraded and approved"
            });
        }
        
        if (sellerSnap.exists) {
            const sellerData = sellerSnap.data();
            const sellerStatus = sellerData.sellerStatus || "PENDING";

            if (userData.role !== "SELLER") {
                try { await userRef.update({ role: "SELLER" }); } catch (_) { }
            }

            if (sellerStatus === "APPROVED") {
                return res.status(200).json({
                    success: true,
                    uid,
                    role: "SELLER",
                    status: "APPROVED",
                    sellerStatus: "APPROVED",
                    shopName: sellerData.shopName,
                    message: "Seller login successful"
                });
            }
            if (sellerStatus === "REJECTED") {
                return res.status(200).json({
                    success: true,
                    uid,
                    role: "SELLER",
                    status: "REJECTED",
                    sellerStatus: "REJECTED",
                    message: "Your seller application was rejected. You can reapply with updated information.",
                    canReapply: true
                });
            }
            if (sellerData.isBlocked === true) {
                return res.status(200).json({
                    success: true,
                    uid,
                    role: "SELLER",
                    status: "BLOCKED",
                    sellerStatus: "BLOCKED",
                    message: "Your seller account is blocked. Contact admin for more information.",
                    canReapply: false
                });
            }
            return res.status(200).json({
                success: true,
                uid,
                role: "SELLER",
                status: "PENDING",
                sellerStatus: "PENDING",
                shopName: sellerData.shopName,
                message: "Seller approval pending"
            });
        }

        return res.status(200).json({
            success: true,
            uid,
            role: userData.role || "CONSUMER",
            status: "AUTHORIZED",
            fullName: userData.fullName,
            message: "Login successful"
        });

    } catch (error) {
        console.error("TEST LOGIN ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Test login failed: " + error.message
        });
    }
};

module.exports = { login, register, applySeller, extractAadhar, uploadImage, testLogin, sendEmailOtp, checkSellerStatus };

