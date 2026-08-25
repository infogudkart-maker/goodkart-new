import React from 'react';
import { getProductPricingWithGST, formatPrice } from '@/modules/shared/utils/priceUtils';
import { useLocation } from 'react-router-dom';

const PriceDisplay = ({
    product,
    selections = {},
    size = 'md',
    showBadge = true,
    showGSTIndicator = true,
    className = ''
}) => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    
    // Safety check for null/undefined product
    if (!product) {
        return null;
    }
    
    // Use provided selections, or fall back to product.selections (for cart/checkout items)
    const effectiveSelections = Object.keys(selections).length > 0 ? selections : (product.selections || {});
    
    const { finalPrice, strikethroughPrice, discountTag, showDiscount, includesGST } = getProductPricingWithGST(product, effectiveSelections);

    const sizeClasses = {
        xs: {
            container: 'price-display-xs',
            row: 'price-row-xs',
            final: 'final-price-xs',
            old: 'old-price-xs',
            badge: 'badge-xs',
            gst: 'gst-indicator-xs'
        },
        sm: {
            container: 'price-display-sm',
            row: 'price-row-sm',
            final: 'final-price-sm',
            old: 'old-price-sm',
            badge: 'badge-sm',
            gst: 'gst-indicator-sm'
        },
        md: {
            container: 'price-display-md',
            row: 'price-row-md',
            final: 'final-price-md',
            old: 'old-price-md',
            badge: 'badge-md',
            gst: 'gst-indicator-md'
        },
        lg: {
            container: 'price-display-lg',
            row: 'price-row-lg',
            final: 'final-price-lg',
            old: 'old-price-old',
            badge: 'badge-lg',
            gst: 'gst-indicator-lg'
        }
    };

    const styles = sizeClasses[size] || sizeClasses.md;
    // The image shows just "13%", so strip off " OFF" if present
    const cleanDiscountTag = discountTag ? discountTag.replace(' OFF', '') : '';

    return (
        <div className={`price-display-container ${styles.container} ${className}`}>
            <div className={`price-row ${styles.row}`}>
                <span className={`final-price ${styles.final}`}>
                    {formatPrice(finalPrice)}{includesGST && !isHomePage && '*'}
                </span>

                {showDiscount && strikethroughPrice > finalPrice && (
                    <>
                        <span className={`old-price ${styles.old}`}>
                            {formatPrice(strikethroughPrice)}
                        </span>

                        {showBadge && cleanDiscountTag && (
                            <span className={`discount-badge-standard ${styles.badge}`}>
                                {cleanDiscountTag}
                            </span>
                        )}
                    </>
                )}
            </div>
            
            {showGSTIndicator && includesGST && !isHomePage && (
                <span className={`gst-indicator ${styles.gst}`}>
                    * Includes GST
                </span>
            )}

            <style>{`
                .price-display-container {
                    display: flex;
                    flex-direction: column;
                    font-family: inherit;
                }
                .price-row {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                    flex-wrap: nowrap;
                }
                .final-price {
                    font-weight: 700;
                    color: #0F1111;
                }
                .old-price {
                    color: #565959;
                    text-decoration: line-through;
                    font-weight: 400;
                }
                .discount-badge-standard {
                    background: #CC0C39;
                    color: white;
                    border-radius: 2px;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }
                .gst-indicator {
                    color: #565959;
                    font-style: normal;
                    margin-top: 0.25rem;
                    font-weight: 400;
                }

                /* Size: Extra Small */
                .price-display-xs .final-price { font-size: 0.95rem; }
                .price-display-xs .old-price { font-size: 0.75rem; }
                .price-display-xs .badge-xs { 
                    font-size: 0.65rem; 
                    padding: 0.1rem 0.3rem;
                }
                .price-display-xs .gst-indicator-xs { font-size: 0.6rem; }

                /* Size: Small */
                .price-display-sm .final-price { font-size: 1.1rem; }
                .price-display-sm .old-price { font-size: 0.75rem; }
                .price-display-sm .badge-sm { 
                    font-size: 0.65rem; 
                    padding: 0.15rem 0.3rem;
                }
                .price-display-sm .gst-indicator-sm { font-size: 0.6rem; }

                /* Size: Medium */
                .price-display-md .final-price { font-size: 1.5rem; }
                .price-display-md .old-price { font-size: 1rem; }
                .price-display-md .badge-md { 
                    font-size: 0.85rem; 
                    padding: 0.2rem 0.5rem;
                }
                .price-display-md .gst-indicator-md { font-size: 0.75rem; }

                /* Size: Large */
                .price-display-lg .final-price { font-size: 2rem; }
                .price-display-lg .old-price { font-size: 1.15rem; }
                .price-display-lg .badge-lg { 
                    font-size: 1rem; 
                    padding: 0.25rem 0.6rem;
                }
                .price-display-lg .gst-indicator-lg { font-size: 0.85rem; }
            `}</style>
        </div>
    );
};

export default PriceDisplay;

