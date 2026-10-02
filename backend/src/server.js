'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Module Routes
const authRoutes = require('./modules/auth/routes/authRoutes');
const adminRoutes = require('./modules/admin/routes/adminRoutes');
const adminConfigRoutes = require('./modules/admin/routes/adminConfigRoutes');
const sellerRoutes = require('./modules/seller/routes/sellerRoutes');
const productRoutes = require('./modules/products/routes/productRoutes');
const orderRoutes = require('./modules/orders/routes/orderRoutes');
const consumerRoutes = require('./modules/consumer/routes/consumerRoutes');
const paymentRoutes = require('./modules/payment/routes/paymentRoutes');
const reviewRoutes = require('./modules/reviews/routes/reviewRoutes');
const shippingRoutes = require('./modules/shipping/routes/shippingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['https://goodkart.onrender.com', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-uid', 'x-role', 'X-Test-UID']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Security headers for Firebase Auth popups
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});


// Global Logger (Diagnostic)
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} | UID: ${req.headers['x-test-uid'] || 'NONE'}`);
    next();
});

// Domain Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/config', adminConfigRoutes);
app.use('/seller', sellerRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/consumer', consumerRoutes);
app.use('/payment', paymentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/webhook', shippingRoutes); // Shiprocket webhook
app.use('/shipping', shippingRoutes); // Shipping estimation and rates

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() }));

// 404 Error Handler - Returns JSON instead of HTML
app.use((req, res) => {
    console.error(`[404] Route Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `API Route ${req.method} ${req.originalUrl} not found.`,
        hint: "Check if the UID and endpoint path are correct."
    });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${err.stack}`);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server (simplified for production)
app.listen(PORT, () => {
    console.log(`✅ SellSathi Backend (Modular) running on port ${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   F`);
});



