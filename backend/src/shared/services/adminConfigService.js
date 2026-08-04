'use strict';
const { db } = require('../../config/firebase');
const cache = require('../../utils/cache');

const ADMIN_CONFIG_CACHE_KEY = 'adminConfig';
const ADMIN_CONFIG_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get admin configuration
 * Returns admin details for use in emails, PDFs, and notifications
 */
const getAdminConfig = async () => {
    try {
        // Check cache first
        const cached = cache.get(ADMIN_CONFIG_CACHE_KEY);
        if (cached) {
            console.log('[AdminConfig] Returning cached config');
            return cached;
        }

        console.log('[AdminConfig] Cache miss, fetching from database');

        // Get ALL admin users (no limit) to find the one with settings
        let usersSnap = await db.collection("users")
            .where("role", "==", "ADMIN")
            .get();

        if (usersSnap.empty) {
            usersSnap = await db.collection("users")
                .where("role", "==", "admin")
                .get();
        }

        if (usersSnap.empty) {
            console.warn('[AdminConfig] No admin user found, using defaults');
            return getDefaultConfig();
        }

        // OPTIMIZED: Batch fetch all admin profiles in one query instead of loop
        const adminUids = usersSnap.docs.map(doc => doc.id);
        const profilePromises = adminUids.map(uid => 
            db.collection("adminProfiles").doc(uid).get()
        );
        const profileDocs = await Promise.all(profilePromises);

        // Find the admin who has an adminProfiles document with actual settings
        // Prefer the most recently updated profile
        let adminUid = null;
        let adminProfile = {};
        let userData = {};
        let latestUpdate = null;

        profileDocs.forEach((profileDoc, index) => {
            if (profileDoc.exists) {
                const uid = adminUids[index];
                const profileData = profileDoc.data();
                const updatedAt = profileData.updatedAt?.toMillis?.() || 0;
                
                // Prefer the admin that has actual settings saved AND is most recently updated
                const hasSettings = profileData.platformFeeBreakdown || profileData.categoryGstRates || profileData.defaultShippingHandlingPercent !== undefined;
                
                if (hasSettings && (latestUpdate === null || updatedAt > latestUpdate)) {
                    adminUid = uid;
                    adminProfile = profileData;
                    userData = usersSnap.docs[index].data();
                    latestUpdate = updatedAt;
                    console.log(`[AdminConfig] Found admin with settings: ${uid}, updatedAt: ${updatedAt}`);
                }
                
                // Fall back to first admin with any profile if none found yet
                if (!adminUid) {
                    adminUid = uid;
                    adminProfile = profileData;
                    userData = usersSnap.docs[index].data();
                }
            }
        });

        // If no profile found at all, use first admin user
        if (!adminUid) {
            const firstAdmin = usersSnap.docs[0];
            adminUid = firstAdmin.id;
            userData = firstAdmin.data();
            adminProfile = {};
            console.log(`[AdminConfig] No profile found, using first admin: ${adminUid}`);
        }

        console.log('[AdminConfig] Fetched admin profile from database:', {
            platformFeeBreakdown: adminProfile.platformFeeBreakdown,
            defaultShippingHandlingPercent: adminProfile.defaultShippingHandlingPercent,
            categoryGstRatesCount: adminProfile.categoryGstRates ? Object.keys(adminProfile.categoryGstRates).length : 0
        });

        const DEFAULT_CATEGORY_GST = {
            "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12,
            "Electronics": 18, "Home & Living": 18, "Handicrafts": 5,
            "Artworks": 12, "Beauty & Personal Care": 18, "Sports & Fitness": 18,
            "Books & Stationery": 12, "Food & Beverages": 5, "Gifts & Customization": 18,
            "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
            "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
            "Automotive & Accessories": 18, "Travel & Utility": 18,
            "Sustainability & Eco-Friendly": 12, "Others": 18
        };

        // Platform fee breakdown (new structure)
        const DEFAULT_PLATFORM_FEE_BREAKDOWN = {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        };

        const platformFeeBreakdown = adminProfile.platformFeeBreakdown || DEFAULT_PLATFORM_FEE_BREAKDOWN;
        const platformFeeBreakdownSeller = adminProfile.platformFeeBreakdownSeller || DEFAULT_PLATFORM_FEE_BREAKDOWN;
        
        // Calculate total platform fee from breakdown
        const calculatedPlatformFee = Object.values(platformFeeBreakdown).reduce((sum, val) => sum + val, 0);
        const calculatedPlatformFeeSeller = Object.values(platformFeeBreakdownSeller).reduce((sum, val) => sum + val, 0);

        const DEFAULT_PRICE_RANGE_FEES = [
            { id: 'range1', label: '₹0 – ₹1,000',       min: 0,     max: 1000,  feeAmount: 35 },
            { id: 'range2', label: '₹1,001 – ₹10,000',  min: 1001,  max: 10000, feeAmount: 50 },
            { id: 'range3', label: '₹10,001 – ₹50,000', min: 10001, max: 50000, feeAmount: 100 },
            { id: 'range4', label: '₹50,001 & above',   min: 50001, max: null,  feeAmount: 200 },
        ];

        // Default platform fee cap ranges (separate from price range fees)
        const DEFAULT_PLATFORM_FEE_CAP_RANGES = [
            { id: 'caprange1', label: '₹0 – ₹1,000',       min: 0,     max: 1000,  capAmount: 0 },
            { id: 'caprange2', label: '₹1,001 – ₹10,000',  min: 1001,  max: 10000, capAmount: 0 },
            { id: 'caprange3', label: '₹10,001 – ₹50,000', min: 10001, max: 50000, capAmount: 0 },
            { id: 'caprange4', label: '₹50,001 & above',   min: 50001, max: null,  capAmount: 0 },
        ];

        // Clean up priceRangeFees - remove old cap fields
        let priceRangeFees = adminProfile.priceRangeFees || DEFAULT_PRICE_RANGE_FEES;
        priceRangeFees = priceRangeFees.map(range => {
            const { userCapLimit, sellerCapLimit, ...cleanRange } = range;
            return cleanRange;
        });

        // Get platform fee cap ranges (new structure)
        let platformFeeCapRanges = adminProfile.platformFeeCapRanges || DEFAULT_PLATFORM_FEE_CAP_RANGES;
        platformFeeCapRanges = platformFeeCapRanges.map(range => ({
            ...range,
            capAmount: range.capAmount ?? 0
        }));

        const config = {
            name: adminProfile.name || userData.name || userData.fullName || 'Admin',
            email: adminProfile.adminEmail || userData.email || 'admin@sellsathi.com',
            phone: userData.phone || 'Not provided',
            address: adminProfile.address || 'Not provided',
            websiteName: adminProfile.websiteName || 'SellSathi',
            websiteInfo: adminProfile.websiteInfo || 'Your Trusted E-Commerce Platform',
            profileImage: adminProfile.profileImage || null,
            platformChargeRate: adminProfile.platformChargeRate ?? 0.10,
            platformFeeBreakdown: platformFeeBreakdown,
            platformFeeBreakdownSeller: platformFeeBreakdownSeller,
            defaultPlatformFeePercent: calculatedPlatformFee,
            defaultPlatformFeePercentSeller: calculatedPlatformFeeSeller,
            defaultGstPercent: adminProfile.defaultGstPercent ?? 18,
            defaultShippingHandlingPercent: adminProfile.defaultShippingHandlingPercent ?? 0,
            categoryGstRates: adminProfile.categoryGstRates || DEFAULT_CATEGORY_GST,
            priceRangeFees: priceRangeFees,
            platformFeeCapRanges: platformFeeCapRanges,
            uid: adminUid
        };

        // Cache the config
        cache.set(ADMIN_CONFIG_CACHE_KEY, config, ADMIN_CONFIG_CACHE_TTL);

        return config;
    } catch (error) {
        console.error('[AdminConfig] Error fetching admin config:', error);
        return getDefaultConfig();
    }
};

/**
 * Get default admin configuration
 */
const getDefaultConfig = () => {
    const DEFAULT_PLATFORM_FEE_BREAKDOWN = {
        digitalSecurityFee: 1.2,
        merchantVerification: 1.0,
        transitCare: 0.8,
        platformMaintenance: 0.5,
        qualityHandling: 0.0
    };
    
    const calculatedPlatformFee = Object.values(DEFAULT_PLATFORM_FEE_BREAKDOWN).reduce((sum, val) => sum + val, 0);
    
    return {
        name: 'Admin',
        email: 'admin@sellsathi.com',
        phone: 'Not provided',
        address: 'Not provided',
        websiteName: 'SellSathi',
        websiteInfo: 'Your Trusted E-Commerce Platform',
        profileImage: null,
        platformFeeBreakdown: DEFAULT_PLATFORM_FEE_BREAKDOWN,
        platformFeeBreakdownSeller: DEFAULT_PLATFORM_FEE_BREAKDOWN,
        defaultPlatformFeePercent: calculatedPlatformFee,
        defaultPlatformFeePercentSeller: calculatedPlatformFee,
        defaultGstPercent: 18,
        defaultShippingHandlingPercent: 0,
        categoryGstRates: {
            "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12,
            "Electronics": 18, "Home & Living": 18, "Handicrafts": 5,
            "Artworks": 12, "Beauty & Personal Care": 18, "Sports & Fitness": 18,
            "Books & Stationery": 12, "Food & Beverages": 5, "Gifts & Customization": 18,
            "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
            "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
            "Automotive & Accessories": 18, "Travel & Utility": 18,
            "Sustainability & Eco-Friendly": 12, "Others": 18
        },
        platformFeeCapRanges: [
            { id: 'caprange1', label: '₹0 – ₹1,000',       min: 0,     max: 1000,  capAmount: 0 },
            { id: 'caprange2', label: '₹1,001 – ₹10,000',  min: 1001,  max: 10000, capAmount: 0 },
            { id: 'caprange3', label: '₹10,001 – ₹50,000', min: 10001, max: 50000, capAmount: 0 },
            { id: 'caprange4', label: '₹50,001 & above',   min: 50001, max: null,  capAmount: 0 },
        ],
        uid: null
    };
};

/**
 * Invalidate admin config cache
 * Call this when admin profile is updated
 */
const invalidateAdminConfig = () => {
    cache.invalidate(ADMIN_CONFIG_CACHE_KEY);
    console.log('[AdminConfig] Cache invalidated');
};

/**
 * Get admin email for sending notifications
 */
const getAdminEmail = async () => {
    const config = await getAdminConfig();
    return config.email;
};

/**
 * Get admin name
 */
const getAdminName = async () => {
    const config = await getAdminConfig();
    return config.name;
};

/**
 * Get website details
 */
const getWebsiteDetails = async () => {
    const config = await getAdminConfig();
    return {
        name: config.websiteName,
        info: config.websiteInfo
    };
};

module.exports = {
    getAdminConfig,
    invalidateAdminConfig,
    getAdminEmail,
    getAdminName,
    getWebsiteDetails
};
