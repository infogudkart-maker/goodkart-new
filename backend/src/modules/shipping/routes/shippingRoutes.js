'use strict';
const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const shippingEstimateController = require('../controllers/shippingEstimateController');


router.post('/delhivery', shippingController.handleDelhiveryWebhook);
router.post('/estimate', shippingEstimateController.estimateShipping);
router.get('/rates', shippingEstimateController.getShippingRates);
router.post('/assign-awb', shippingController.generateAWB);

module.exports = router;
