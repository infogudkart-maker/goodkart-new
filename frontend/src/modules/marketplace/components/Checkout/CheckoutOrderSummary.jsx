import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateOrderTotalsWithGSTInclusive, formatPlatformFeeBreakdown } from '@/modules/shared/utils/platformFeeUtils';
import { getProductPricingWithGST } from '@/modules/shared/utils/priceUtils';

export default function CheckoutOrderSummary({ 
    subtotal, 
    couponDiscount, 
    finalTotal,
    selectedItems = [],
    adminConfig = { 
        platformFeeBreakdown: {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        },
        defaultPlatformFeePercent: 3.5, 
        defaultGstPercent: 18, 
        defaultShippingHandlingPercent: 0 
    },
    shippingFee = 0,
    estimatingShipping = false,
    shippingEstimated = false,
    estimatedDeliveryDays = ''
}) {
    const [showPlatformFeeBreakdown, setShowPlatformFeeBreakdown] = useState(false);
    
    // Calculate order totals using the NEW GST-inclusive utility
    const orderTotals = calculateOrderTotalsWithGSTInclusive(selectedItems, {
        adminConfig,
        couponDiscount,
        shippingFee: shippingFee // Use passed shipping fee
    });
    
    // Format platform fee breakdown for display
    const platformFeeItems = formatPlatformFeeBreakdown(orderTotals.platformFeeBreakdown);
    
    // Calculate old MRP total (for strikethrough) - use PriceDisplay logic
    // Recalculate prices using the same logic as PriceDisplay for consistency
    let oldMRPTotal = 0;
    let actualProductTotal = 0;
    let hasAnyDiscount = false;
    
    selectedItems.forEach(item => {
        // Recalculate pricing using the product data stored in cart item
        const { finalPrice, strikethroughPrice } = getProductPricingWithGST(item, item.selections || {});
        
        const currentPrice = finalPrice;
        const mrpPrice = strikethroughPrice;
        
        // Add to totals
        actualProductTotal += currentPrice * item.quantity;
        oldMRPTotal += mrpPrice * item.quantity;
        
        // Check if this item has a discount
        if (mrpPrice > currentPrice) {
            hasAnyDiscount = true;
        }
    });
    
    // Only show strikethrough if there's actually a discount
    const showStrikethrough = hasAnyDiscount && oldMRPTotal > actualProductTotal;
    
    // Recalculate total using actual product total
    const actualTotal = actualProductTotal + orderTotals.platformFeeAndServiceGST + orderTotals.shippingFee - couponDiscount;
    
    return (
        <div className="xl:col-span-5 lg:sticky lg:top-[150px]">
            <section className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-h-[calc(100vh-170px)] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex-shrink-0">
                    <h3 className="text-2xl font-black text-gray-900">Order Summary</h3>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        {/* Product Pricing * - Show actual product prices only */}
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-base text-gray-500 font-medium whitespace-nowrap">Product Pricing *</span>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {showStrikethrough && (
                                    <span className="text-base text-gray-500 line-through font-semibold whitespace-nowrap">
                                        ₹{Math.round(oldMRPTotal).toLocaleString('en-IN')}
                                    </span>
                                )}
                                <span className="text-3xl text-gray-900 font-black whitespace-nowrap">
                                    ₹{Math.round(actualProductTotal).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                        
                        {/* Platform Fee & Service GST - Collapsible */}
                        <div 
                            className="flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors py-2 rounded gap-6"
                            onClick={() => setShowPlatformFeeBreakdown(!showPlatformFeeBreakdown)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm text-gray-400 font-normal">
                                    Platform Fee & Service GST
                                </span>
                                {showPlatformFeeBreakdown ? (
                                    <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                                )}
                            </div>
                            <span className="text-base text-gray-500 font-medium flex-shrink-0">
                                ₹{orderTotals.platformFeeAndServiceGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        
                        {/* Platform Fee Breakdown - Appears below when expanded */}
                        {showPlatformFeeBreakdown && (
                            <div className="bg-gray-50 px-6 py-4 space-y-3 rounded-lg">
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                                    Service Breakdown
                                </div>
                                {platformFeeItems.map((item) => (
                                    <div key={item.key} className="flex justify-between items-center gap-4">
                                        <span className="text-sm text-gray-500 font-normal">
                                            {item.label}
                                        </span>
                                        <span className="text-sm text-gray-700 font-medium flex-shrink-0">
                                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="h-px bg-gray-300 w-full my-3" />
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-sm text-gray-600 font-medium italic">
                                        GST (18% on Platform Fee)
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium flex-shrink-0">
                                        ₹{orderTotals.serviceGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* Shipping Fee */}
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-sm text-gray-500 font-medium">Shipping Fee</span>
                            {estimatingShipping ? (
                                <span className="text-sm text-gray-400 italic flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                    Calculating...
                                </span>
                            ) : shippingEstimated ? (
                                <div className="flex flex-col items-end">
                                    <span className={`text-lg font-bold uppercase tracking-wide flex-shrink-0 ${shippingFee > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                                        {shippingFee > 0 ? `₹${Math.round(shippingFee).toLocaleString('en-IN')}` : 'FREE'}
                                    </span>
                                    {estimatedDeliveryDays && (
                                        <span className="text-xs text-gray-400 mt-1">
                                            Delivery: {estimatedDeliveryDays}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400 italic">
                                    Enter address to calculate
                                </span>
                            )}
                        </div>
                        
                        {/* Estimated Delivery Date - Show below shipping */}
                        {!estimatingShipping && shippingEstimated && estimatedDeliveryDays && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 -mx-2 px-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-blue-900">
                                            Delivery can be expected on: {estimatedDeliveryDays}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Coupon Discount */}
                        {couponDiscount > 0 && (
                            <div className="flex justify-between items-center bg-green-50 -mx-2 px-2 py-2 rounded-xl gap-4">
                                <span className="text-sm text-green-700 font-semibold">Coupon Discount</span>
                                <span className="text-lg text-green-700 font-bold flex-shrink-0">
                                    -₹{Math.round(couponDiscount).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Divider */}
                    <div className="h-px bg-gray-200 w-full my-5" />
                    
                    {/* Total Amount - ONLY THIS HAS 2 DECIMALS */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-lg text-gray-900 font-bold">Total Amount</span>
                            <span className="text-4xl font-black text-[#3B7CF1] flex-shrink-0">
                                ₹{actualTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <p className="text-xs text-green-600 font-bold text-right uppercase tracking-wide">
                            Save with Goodkart Premium
                        </p>
                    </div>
                    
                    {/* GST Inclusion Note - Blue Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <p className="text-xs text-blue-800 font-medium">
                            <span className="font-bold">* Product Pricing</span> includes GST on products
                        </p>
                    </div>
                    
                    {/* Security Badge */}
                    <div className="pt-3">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 rounded-2xl border border-blue-200 flex gap-3 items-center">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#3B7CF1] shadow-sm flex-shrink-0">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-gray-900 leading-none mb-1">Guaranteed Safety</h5>
                                <p className="text-xs text-gray-600 font-medium">100% Secure Transaction</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}




