/**
 * Centralized utility for price calculations across Goodkart.
 */

/**
 * Calculates the complete pricing information for a product.
 *
 * Data field conventions:
 *  - AddProduct stores: price (original MRP), discountPrice (selling price, can be null)
 *  - Seller products use `title` instead of `name`
 *  - sizePrices: stored as plain object { "S": 500, "M": 600 } — NOT an array
 *
 * IMPORTANT: Base price (MRP) remains CONSTANT and is ALWAYS shown as crossed price.
 * Only the selling price changes with variants.
 *
 * @param {Object} product - The product object from Firestore or mock data.
 * @param {Object} selections - User selections (size, color, storage, memory, purchaseOption).
 * @returns {Object} - { finalPrice, strikethroughPrice, discountTag, showDiscount, baseSellingPrice }
 */
export const getProductPricing = (product, selections = {}) => {
    if (!product) return { finalPrice: 0, strikethroughPrice: 0, discountTag: null, showDiscount: false, baseSellingPrice: 0 };

    // 1. Determine Base Price (MRP) - This is ALWAYS the crossed price and NEVER changes
    let baseOriginalPrice = Number(product.price) || 0;
    let baseSellingPrice = baseOriginalPrice;  // Selling price - changes with variants

    // Determine if there's a discount and what the base selling price is
    if (product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice !== '') {
        const p2 = Number(product.discountPrice);
        const p1 = Number(product.price);
        
        if (p2 > p1) {
            // Seller swapped them! p1 is Selling, p2 is MRP (e.g. price: 265, discountPrice: 300)
            baseOriginalPrice = p2; // MRP - ALWAYS the crossed price
            baseSellingPrice = p1;  // Selling price
        } else if (p2 < p1) {
            // Standard: p1 is MRP, p2 is Selling (e.g. price: 300, discountPrice: 265)
            baseOriginalPrice = p1; // MRP - ALWAYS the crossed price
            baseSellingPrice = p2;  // Selling price
        }
    }

    // Handle products that only have oldPrice (seed/mock data pattern)
    if (product.oldPrice && Number(product.oldPrice) > baseOriginalPrice) {
        baseOriginalPrice = Number(product.oldPrice);
        if (product.discountPrice === null || product.discountPrice === undefined || product.discountPrice === '') {
            baseSellingPrice = Number(product.price);
        }
    }

    // Store the original MRP - this will NEVER change regardless of variants
    // This is ALWAYS the crossed/strikethrough price
    const constantMRP = baseOriginalPrice;

    // 2. Apply Size-Specific Pricing
    // IMPORTANT: For varied pricing, sizePrices are the selling prices, MRP stays constant
    if (product.pricingType === 'varied' && selections.size && product.sizePrices) {
        let sizePrice = null;
        // Handle both array format [{size, price}] and object format {"S": 500}
        if (Array.isArray(product.sizePrices)) {
            const sizeData = product.sizePrices.find(sp => sp.size === selections.size);
            if (sizeData?.price) sizePrice = Number(sizeData.price);
        } else if (typeof product.sizePrices === 'object') {
            const val = product.sizePrices[selections.size];
            if (val) sizePrice = Number(val);
        }

        if (sizePrice !== null) {
            // The seller's inputted sizePrice is the Selling Price for this variant
            baseSellingPrice = sizePrice;
            // MRP stays constant - NEVER recalculate it
        }
    } else if (product.pricingType === 'varied' && !selections.size && product.sizePrices) {
        // No size selected yet, but product has varied pricing
        // Use the first available size price as default
        let firstSizePrice = null;
        if (Array.isArray(product.sizePrices) && product.sizePrices.length > 0) {
            firstSizePrice = Number(product.sizePrices[0].price);
        } else if (typeof product.sizePrices === 'object') {
            const firstKey = Object.keys(product.sizePrices)[0];
            if (firstKey) firstSizePrice = Number(product.sizePrices[firstKey]);
        }
        
        if (firstSizePrice !== null) {
            baseSellingPrice = firstSizePrice;
        }
    }

    // 3. Add Variant Offsets (storage, memory) - ONLY to selling price
    const storageOffset = (selections.storage?.priceOffset) || 0;
    const memoryOffset = (selections.memory?.priceOffset) || 0;
    const totalOffset = storageOffset + memoryOffset;

    let finalSellingPrice = baseSellingPrice + totalOffset;
    // CRITICAL: MRP (crossed price) NEVER gets offsets added - it stays constant
    let finalOriginalPrice = constantMRP;

    // Store the non-exchange final selling price for use in purchase option buttons
    const baseSellingPriceWithOffsets = finalSellingPrice;

    // 4. Apply Purchase Options (e.g., Exchange = 10% more)
    if (selections.purchaseOption === 'exchange') {
        finalSellingPrice = finalSellingPrice * 1.1;
    }

    // 5. Calculate Discount Display - Dynamic based on actual prices
    const hasDiscount = Math.round(finalSellingPrice) < Math.round(finalOriginalPrice);
    let discountTag = null;

    if (hasDiscount) {
        const diff = finalOriginalPrice - finalSellingPrice;
        const percent = Math.round((diff / finalOriginalPrice) * 100);
        if (percent >= 1) discountTag = `${percent}% OFF`;
    } else if (product.discount) {
        // Fallback to pre-calculated discount tag on the product (mock/seed data)
        discountTag = typeof product.discount === 'string' ? product.discount : `${product.discount}% OFF`;
    }

    // If purchaseOption is exchange, override the tag
    if (selections.purchaseOption === 'exchange') {
        discountTag = 'Exchange Offer Applied';
    }

    return {
        finalPrice: Math.round(finalSellingPrice),
        strikethroughPrice: Math.round(finalOriginalPrice), // ALWAYS the constant MRP
        discountTag,
        showDiscount: hasDiscount || !!discountTag,
        // Export base selling price (without exchange) for purchase option button display
        baseSellingPrice: Math.round(baseSellingPriceWithOffsets),
    };
};

/**
 * Get price including GST
 * @param {number} basePrice - Base price without GST
 * @param {number} gstPercent - GST percentage (default 18)
 * @returns {number} - Price including GST
 */
export const getPriceWithGST = (basePrice, gstPercent = 18) => {
    return Math.round(basePrice * (1 + gstPercent / 100));
};

/**
 * Get base price from GST-inclusive price
 * @param {number} priceWithGST - Price including GST
 * @param {number} gstPercent - GST percentage (default 18)
 * @returns {number} - Base price without GST
 */
export const getBasePriceFromGSTPrice = (priceWithGST, gstPercent = 18) => {
    return Math.round((priceWithGST / (1 + gstPercent / 100)) * 100) / 100;
};

/**
 * Calculates the complete pricing information for a product WITH GST INCLUDED.
 * This is the NEW pricing structure where displayed prices include GST.
 *
 * @param {Object} product - The product object from Firestore or mock data.
 * @param {Object} selections - User selections (size, color, storage, memory, purchaseOption).
 * @returns {Object} - Pricing with GST included in display prices
 */
export const getProductPricingWithGST = (product, selections = {}) => {
    // Handle null/undefined product
    if (!product) {
        return {
            finalPrice: 0,
            strikethroughPrice: 0,
            discountTag: null,
            showDiscount: false,
            baseSellingPrice: 0,
            basePrice: 0,
            basePriceStrikethrough: 0,
            gstPercent: 18,
            gstAmount: 0,
            includesGST: false
        };
    }
    
    // Get base pricing (without GST)
    const basePricing = getProductPricing(product, selections);
    
    // Get GST percent from product/category
    const gstPercent = product.gstPercent || 18;
    
    // Calculate GST-inclusive prices for display
    const finalPriceWithGST = getPriceWithGST(basePricing.finalPrice, gstPercent);
    const strikethroughPriceWithGST = getPriceWithGST(basePricing.strikethroughPrice, gstPercent);
    
    return {
        ...basePricing,
        finalPrice: finalPriceWithGST,
        strikethroughPrice: strikethroughPriceWithGST,
        basePrice: basePricing.finalPrice, // Store base for calculations
        basePriceStrikethrough: basePricing.strikethroughPrice,
        gstPercent: gstPercent,
        gstAmount: finalPriceWithGST - basePricing.finalPrice,
        includesGST: true, // Flag to indicate this price includes GST
    };
};

/**
 * Formats a number as Indian Rupee currency.
 *
 * @param {number} amount - The amount to format.
 * @returns {string} - The formatted string (e.g., ₹1,29,999).
 */
export const formatPrice = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
};
