'use strict';
const Razorpay = require('razorpay');

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} else {
    console.warn('⚠️  Razorpay credentials not configured. Payment integration disabled.');
}

module.exports = razorpay;
