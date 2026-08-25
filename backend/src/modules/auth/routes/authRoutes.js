'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth } = require('../../../middleware/auth');

const upload = require('../../../middleware/upload');

router.post('/login', authController.login);
router.post('/google-login', authController.login);   // Google OAuth uses same login flow
router.post('/test-login', authController.testLogin);
router.post('/register', authController.register);
router.post('/send-email-otp', authController.sendEmailOtp);
router.post('/apply-seller', verifyAuth, authController.applySeller);
router.get('/check-seller-status', verifyAuth, authController.checkSellerStatus);

// These routes are used during seller registration (before login) — no auth required
router.post('/extract-aadhar', upload.single('aadharImage'), authController.extractAadhar);
router.post('/upload-image', upload.single('image'), authController.uploadImage);

module.exports = router;
