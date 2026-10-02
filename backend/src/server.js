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

// ============================================================
// TRUST PROXY  (MUST be set before any middleware that reads req.ip)
// ============================================================
// Render sits behind a single reverse proxy that injects the real client IP
// into the X-Forwarded-For header. Without this, express-rate-limit throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR and Express also fails to identify
// individual users correctly (all requests appear to come from the proxy IP).
//
// 1 = trust exactly one hop (Render's edge proxy).
// If you ever add Cloudflare or another CDN in front, bump this to 2.
// Verify with /debug/ip — req.ip should show YOUR real public IP.
// ============================================================
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        'https://sellsathifrontend.onrender.com',
        'https://www.goodkart.in',
        'http://localhost:5173',
        'http://localhost:3000'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-uid', 'x-role']
}));

// Body parsers with sane size limits (prevents accidental 100MB payloads)
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Security headers for Firebase Auth popups
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

const rateLimit = require('express-rate-limit');

// Global Logger (Diagnostic)
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// ============================================================
// Rate Limiting Policy
// ============================================================
// NOTE: For authenticated APIs, IP-based limiting is fragile on shared networks.
// Once auth middleware runs, prefer keying by user ID (req.user?.uid).
// The keyGenerator below safely falls back to IP for unauthenticated routes.
// ============================================================
const secureRouteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip the validation warning now that trust proxy is set — but keep
    // IPv6 safe. Render forwards real client IPs so this is correct.
    keyGenerator: (req) => {
        // Prefer authenticated user if present (added by auth middleware upstream)
        if (req.user?.uid) return `user:${req.user.uid}`;
        if (req.headers['x-uid']) return `uid:${req.headers['x-uid']}`;
        // Fall back to real client IP (now correct thanks to trust proxy)
        return req.ip;
    }
});

// Domain Routes
app.use('/auth', secureRouteLimiter, authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/config', adminConfigRoutes);
app.use('/seller', sellerRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/consumer', consumerRoutes);
app.use('/payment', secureRouteLimiter, paymentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/webhook', shippingRoutes); // Shiprocket webhook
app.use('/shipping', shippingRoutes); // Shipping estimation and rates

// Health Check
app.get('/health', (req, res) =>
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() })
);

// ============================================================
// Debug Endpoint (helps verify trust proxy is working)
// Safe to keep — exposes only the caller's own IP, no secrets.
// Remove or gate behind admin auth if you prefer.
// ============================================================
app.get('/debug/ip', (req, res) => {
    res.json({
        ip: req.ip,
        ips: req.ips,
        forwardedFor: req.headers['x-forwarded-for'] || null,
        protocol: req.protocol,
        hostname: req.hostname
    });
});

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
const server = app.listen(PORT, () => {
    console.log(`✅ SellSathi Backend (Modular) running on port ${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Trust proxy: 1 hop (Render edge)`);
});

// ============================================================
// Graceful shutdown — Render sends SIGTERM before killing the container.
// Letting in-flight requests finish prevents dropped OTP/email calls.
// ============================================================
const shutdown = (signal) => {
    console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`);
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
    // Force exit if something hangs
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
