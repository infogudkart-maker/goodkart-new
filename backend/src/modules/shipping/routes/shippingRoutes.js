'use strict';
const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const shippingEstimateController = require('../controllers/shippingEstimateController');

router.post('/shiprocket', shippingController.handleShiprocketWebhook);
router.post('/estimate', shippingEstimateController.estimateShipping);
router.get('/rates', shippingEstimateController.getShippingRates);

module.exports = router;
