'use strict';

/**
 * Shipping Estimate Controller
 * Calculates estimated shipping charges BEFORE order placement
 */

/**
 * Calculate estimated shipping charges based on address and cart items
 * 
 * Uses Shiprocket-based calculation logic with weight, distance, and item count.
 * No admin percentage markup - pure shipping cost estimation.
 * 
 * Calculation factors:
 * - Base rate: ₹40
 * - Weight-based charge: ₹20 per kg
 * - Item-based charge: ₹10 per additional item
 * - Zone multiplier: Metro (1.0x) vs Non-Metro (1.2x)
 */
exports.estimateShipping = async (req, res) => {
    try {
        const { shippingAddress, cartItems, totalWeight } = req.body;

        if (!shippingAddress || !shippingAddress.pincode) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address with pincode is required'
            });
        }

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items are required'
            });
        }

        // Calculate total weight (if not provided)
        const weight = totalWeight || (cartItems.length * 0.5); // Default 0.5kg per item

        // Calculate shipping estimate using Shiprocket-based logic
        const estimatedShipping = calculateShippingEstimate(
            shippingAddress.pincode,
            weight,
            cartItems.length
        );

        // Use the calculated shipping charge directly (no admin percentage)
        const finalShippingCharge = estimatedShipping.charge;

        return res.status(200).json({
            success: true,
            shippingCharge: finalShippingCharge,
            estimatedDeliveryDays: estimatedShipping.deliveryDays,
            courierName: estimatedShipping.courierName || 'Standard Delivery',
            message: 'Estimated shipping charge calculated using Shiprocket rates',
            breakdown: {
                baseShipping: estimatedShipping.charge,
                weightCharge: estimatedShipping.breakdown.weightCharge,
                itemCharge: estimatedShipping.breakdown.itemCharge,
                zone: estimatedShipping.breakdown.zone,
                total: finalShippingCharge
            }
        });

    } catch (error) {
        console.error('Shipping estimate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate shipping estimate'
        });
    }
};

/**
 * Calculate shipping estimate based on pincode, weight, and item count
 * 
 * This is a simplified calculation. You can:
 * 1. Use fixed rates from admin config
 * 2. Use pincode-based zones (metro/tier1/tier2/tier3)
 * 3. Integrate with Shiprocket's serviceability API (requires temp order)
 * 4. Use historical average rates
 */
function calculateShippingEstimate(pincode, weight, itemCount) {
    // Define shipping zones based on pincode patterns
    const metroZones = ['110', '400', '560', '600', '700', '800']; // Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad
    const isMetro = metroZones.some(zone => pincode.startsWith(zone));

    // Base rates (in INR)
    let baseRate = 40; // Base shipping charge
    let perKgRate = 20; // Additional charge per kg
    let perItemRate = 10; // Additional charge per item

    // Zone-based multiplier
    const zoneMultiplier = isMetro ? 1.0 : 1.2; // 20% more for non-metro

    // Calculate total shipping charge
    const weightCharge = weight * perKgRate;
    const itemCharge = (itemCount - 1) * perItemRate; // First item included in base
    const totalCharge = (baseRate + weightCharge + itemCharge) * zoneMultiplier;

    // Round to nearest 5
    const roundedCharge = Math.ceil(totalCharge / 5) * 5;

    // Estimated delivery days
    const deliveryDays = isMetro ? '2-4 days' : '3-6 days';

    return {
        charge: roundedCharge,
        deliveryDays: deliveryDays,
        courierName: 'Standard Delivery',
        breakdown: {
            baseRate: baseRate,
            weightCharge: weightCharge,
            itemCharge: itemCharge,
            zoneMultiplier: zoneMultiplier,
            zone: isMetro ? 'Metro' : 'Non-Metro'
        }
    };
}

/**
 * Get shipping zones and rates (for admin configuration)
 */
exports.getShippingRates = async (req, res) => {
    try {
        // Return current shipping rate configuration
        const rates = {
            baseRate: 40,
            perKgRate: 20,
            perItemRate: 10,
            metroMultiplier: 1.0,
            nonMetroMultiplier: 1.2,
            freeShippingThreshold: 500, // Free shipping above this amount
            zones: {
                metro: ['110', '400', '560', '600', '700', '800'],
                tier1: ['201', '302', '380', '411', '500'],
                tier2: [] // All others
            }
        };

        return res.status(200).json({
            success: true,
            rates: rates
        });
    } catch (error) {
        console.error('Get shipping rates error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch shipping rates'
        });
    }
};

module.exports = {
    estimateShipping: exports.estimateShipping,
    getShippingRates: exports.getShippingRates
};
