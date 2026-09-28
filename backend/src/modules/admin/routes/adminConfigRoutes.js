'use strict';
const express = require('express');
const router = express.Router();
const { getPublicAdminConfig } = require('../controllers/adminConfigController');

// Public route - no authentication required
router.get('/public', getPublicAdminConfig);

module.exports = router;
