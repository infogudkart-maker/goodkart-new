'use strict';
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyAuth } = require('../../../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/seller/:uid', productController.getSellerProducts);
router.get('/:id', productController.getProductById);

// Protected routes — require authentication
router.put('/:id', verifyAuth, productController.updateProduct);
router.delete('/:id', verifyAuth, productController.deleteProduct);

module.exports = router;
