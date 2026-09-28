'use strict';
const express = require('express');
const router = express.Router();
const consumerController = require('../controllers/consumerController');
const { verifyAuth } = require('../../../middleware/auth');

router.use(verifyAuth);

router.get('/:uid/cart', consumerController.getCart);
router.post('/:uid/cart', consumerController.updateCart);
router.get('/:uid/addresses', consumerController.getAddresses);
router.post('/:uid/address', consumerController.saveAddress);
router.delete('/:uid/address/:addressId', consumerController.deleteAddress);

router.get('/:uid/profile', consumerController.getProfile);
router.post('/:uid/profile', consumerController.updateProfile);
router.delete('/:uid/account', consumerController.deleteAccount);

router.get('/:uid/wishlist', consumerController.getWishlist);
router.post('/:uid/wishlist/add', consumerController.addToWishlist);
router.delete('/:uid/wishlist/:productId', consumerController.removeFromWishlist);

module.exports = router;
