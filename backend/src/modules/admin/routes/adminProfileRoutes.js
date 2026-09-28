'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../../../middleware/auth');
const upload = require('../../../middleware/upload');
const { 
    getAdminProfile, 
    updateAdminProfile, 
    uploadProfileImage 
} = require('../controllers/adminProfileController');

// Get admin profile
router.get('/profile', verifyToken, verifyAdmin, getAdminProfile);

// Update admin profile
router.put('/profile', verifyToken, verifyAdmin, updateAdminProfile);

// Upload profile image
router.post('/profile/image', verifyToken, verifyAdmin, upload.single('profileImage'), uploadProfileImage);

module.exports = router;
