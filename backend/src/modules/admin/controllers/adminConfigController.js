'use strict';
const { getAdminConfig } = require('../../../shared/services/adminConfigService');

/**
 * Get public admin configuration
 * Returns non-sensitive admin config for use in frontend
 */
const getPublicAdminConfig = async (req, res) => {
    try {
        // Check if force refresh is requested
        const forceRefresh = req.query.refresh === 'true';
        
        if (forceRefresh) {
            const { invalidateAdminConfig } = require('../../../shared/services/adminConfigService');
            invalidateAdminConfig();
            console.log('[GetPublicAdminConfig] Cache invalidated via force refresh');
        }
        
        const config = await getAdminConfig();
        
        console.log('[GetPublicAdminConfig] Returning config:', {
            platformFeeBreakdown: config.platformFeeBreakdown,
            platformFeeBreakdownSeller: config.platformFeeBreakdownSeller,
            defaultShippingHandlingPercent: config.defaultShippingHandlingPercent,
            categoryGstRatesCount: config.categoryGstRates ? Object.keys(config.categoryGstRates).length : 0,
            cached: !forceRefresh
        });
        
        // Return only public information - NO FALLBACKS, return what's actually in database
        const publicConfig = {
            websiteName: config.websiteName,
            websiteInfo: config.websiteInfo,
            platformFeeBreakdown: config.platformFeeBreakdown,
            platformFeeBreakdownSeller: config.platformFeeBreakdownSeller,
            defaultPlatformFeePercent: config.defaultPlatformFeePercent,
            defaultPlatformFeePercentSeller: config.defaultPlatformFeePercentSeller,
            defaultGstPercent: config.defaultGstPercent,
            defaultShippingHandlingPercent: config.defaultShippingHandlingPercent,
            categoryGstRates: config.categoryGstRates || {},
            platformFeeCapRanges: config.platformFeeCapRanges || []
        };
        
        return res.status(200).json({ success: true, config: publicConfig });
    } catch (error) {
        console.error('[GetPublicAdminConfig] ERROR:', error);
        
        // Return defaults on error
        const defaultBreakdown = {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        };
        
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch configuration',
            config: {
                websiteName: 'SellSathi',
                websiteInfo: 'Your Trusted E-Commerce Platform',
                platformFeeBreakdown: defaultBreakdown,
                platformFeeBreakdownSeller: defaultBreakdown,
                defaultPlatformFeePercent: 3.5,
                defaultPlatformFeePercentSeller: 3.5,
                defaultGstPercent: 18,
                defaultShippingHandlingPercent: 0,
                categoryGstRates: {},
                platformFeeCapRanges: []
            }
        });
    }
};

module.exports = {
    getPublicAdminConfig
};
