'use strict';
/**
 * Central pricing helpers (backend).
 *
 * Product data conventions (see AddProduct.jsx):
 *   price         = Base price / MRP (the crossed-out price shown to customers)
 *   discountPrice = Selling price after discount (optional)
 *
 * Cart/order items carry:
 *   price         = MRP copy of product.price  (NEVER use this for money owed)
 *   discountPrice = copy of product.discountPrice
 *   basePrice     = ex-GST unit SELLING price incl. size/variant pricing (source of truth)
 *   priceWithGST  = GST-inclusive unit selling price
 *   gstPercent
 *
 * Historically seller revenue/fees were computed from item.price (the MRP),
 * which over-stated revenue for every discounted product. Use these helpers
 * everywhere a per-unit amount is needed.
 */

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const hasValue = (v) => v !== null && v !== undefined && v !== '' && num(v) > 0;

/** Returns { mrp, selling } for a raw product-like object (no variant handling). */
function resolveMrpAndSelling(obj = {}) {
    let mrp = num(obj.price);
    let selling = mrp;
    if (hasValue(obj.discountPrice)) {
        const p1 = num(obj.price);
        const p2 = num(obj.discountPrice);
        // Legacy data may have the two fields swapped: selling is always the lower one.
        mrp = Math.max(p1, p2);
        selling = Math.min(p1, p2);
    }
    if (hasValue(obj.oldPrice) && num(obj.oldPrice) > mrp) mrp = num(obj.oldPrice);
    return { mrp, selling };
}

/** Ex-GST unit SELLING price of an order item (what the seller actually earns per unit, before fees). */
function getItemSellingPrice(item = {}) {
    if (hasValue(item.basePrice)) return num(item.basePrice);
    if (hasValue(item.priceWithGST)) {
        const gst = item.gstPercent === 0 ? 0 : (num(item.gstPercent) || 18);
        return Math.round((num(item.priceWithGST) / (1 + gst / 100)) * 100) / 100;
    }
    return resolveMrpAndSelling(item).selling;
}

/** Ex-GST unit MRP of an order item (for display only). */
function getItemMrp(item = {}) {
    const selling = getItemSellingPrice(item);
    const { mrp } = resolveMrpAndSelling(item);
    return Math.max(mrp, selling);
}

/** GST-inclusive unit price actually charged to the customer. */
function getItemPriceWithGST(item = {}) {
    if (hasValue(item.priceWithGST)) return num(item.priceWithGST);
    const gst = item.gstPercent === 0 ? 0 : (num(item.gstPercent) || 18);
    return Math.round(getItemSellingPrice(item) * (1 + gst / 100) * 100) / 100;
}

/** Sum of the seller's ex-GST selling price for one order item line. */
function getItemLineRevenue(item = {}) {
    return getItemSellingPrice(item) * (num(item.quantity) || 1);
}

/** Total percentage from a fee breakdown that may be {key: number} or {key: {percent}} */
function sumFeePercent(breakdown = {}) {
    return Object.values(breakdown || {}).reduce((s, v) => s + (typeof v === 'number' ? v : num(v && v.percent)), 0);
}

function getCapAmount(price, ranges = []) {
    if (!Array.isArray(ranges) || ranges.length === 0) return 0;
    for (const r of ranges) {
        if (r && price >= num(r.min) && (r.max === null || r.max === undefined || price <= num(r.max))) {
            return num(r.capAmount);
        }
    }
    return 0;
}

/**
 * Platform fee + GST + net earning for a single order item line.
 * Fee is a % of the SELLING price; the cap is looked up on the unit selling price.
 */
function computeSellerItemEarnings(item, adminConfig = {}) {
    const qty = num(item.quantity) || 1;
    const unit = getItemSellingPrice(item);
    const revenue = unit * qty;
    const feePercent = sumFeePercent(adminConfig.platformFeeBreakdownSeller);
    let fee = (revenue * feePercent) / 100;
    const cap = getCapAmount(unit, adminConfig.platformFeeCapRanges);
    if (cap > 0 && fee > cap * qty) fee = cap * qty;
    const feeGST = fee * 0.18;
    return {
        qty, unit, revenue, feePercent, fee, feeGST,
        net: revenue - fee - feeGST,
    };
}

/** Order-item statuses that should not count as seller revenue. */
function isItemRevenueEligible(order = {}, item = {}) {
    const bad = ['cancelled', 'canceled', 'returned', 'rejected', 'refunded'];
    const s = String(item.status || '').toLowerCase();
    return !bad.includes(s) && !bad.includes(String(order.status || '').toLowerCase());
}

module.exports = {
    resolveMrpAndSelling,
    getItemSellingPrice,
    getItemMrp,
    getItemPriceWithGST,
    getItemLineRevenue,
    sumFeePercent,
    getCapAmount,
    computeSellerItemEarnings,
    isItemRevenueEligible,
};
