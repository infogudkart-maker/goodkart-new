import React, { useState, useMemo } from 'react';
import { 
    Heart, Share2, ShoppingCart, Truck, Shield, ShieldCheck, RotateCcw, 
    Ruler, MapPin, CheckCircle2, BadgePercent, CreditCard, 
    Landmark, Tag, Sparkles, ChevronDown, Zap, Award, Gem, RefreshCw, Check,
    FileText, Receipt, AlignLeft, Gift
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Rating from '@/modules/shared/components/common/Rating';
import { getProductPricingWithGST, formatPrice } from '@/modules/shared/utils/priceUtils';
import SizeChartModal from '@/modules/shared/components/common/SizeChartModal';

// Static bank/payment offers
const STATIC_OFFERS = [
    { icon: Landmark, text: 'Get 10% instant discount up to ₹500 on select Bank Credit Cards' },
    { icon: CreditCard, text: 'No Cost EMI available on orders above ₹3,000' },
    { icon: Tag, text: 'Extra 5% off on first prepaid order — auto applied at checkout' },
];

// Color mapping for jewelry and fashion swatches
const COLOR_MAP = {
    'yellow gold': '#E6CA65',
    'gold': '#E6CA65',
    'rose gold': '#D49B89',
    'white gold': '#E4E7EB',
    'silver': '#E4E7EB',
    'platinum': '#DEE3E8',
    'black': '#222222',
    'white': '#FFFFFF',
    'red': '#DC2626',
    'blue': '#2563EB',
    'green': '#16A34A',
    'pink': '#F472B6',
    'navy': '#1E3A8A',
    'grey': '#9CA3AF',
    'gray': '#9CA3AF'
};

function getColorHex(colorVal) {
    if (!colorVal) return '#D4AF37';
    if (typeof colorVal === 'object') {
        if (colorVal.hex) return colorVal.hex;
        colorVal = colorVal.name || '';
    }
    const clean = String(colorVal).toLowerCase().trim();
    return COLOR_MAP[clean] || (clean.startsWith('#') ? clean : '#D4AF37');
}

export default function ProductInfo({
    product,
    seller,
    reviewStats,
    isSaved,
    toggleWishlist,
    handleShare,
    handleAddToCart,
    handleBuyNow,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    selectedStorage,
    setSelectedStorage,
    selectedMemory,
    setSelectedMemory,
    purchaseOption,
    images,
    setActiveImageIndex,
    setVariantImageUrl,
    variantImageMap,
    isSizeChartOpen,
    setIsSizeChartOpen
}) {
    const { t } = useTranslation();
    const isOutOfStock = product.stock === 0 || product.status === 'Out of Stock';

    // Accordion state
    const [openAccordions, setOpenAccordions] = useState({
        details: false,
        priceBreakup: false,
        description: false,
        offers: false
    });

    const toggleAccordion = (key) => {
        setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Calculate complete pricing
    const pricing = useMemo(() => {
        return getProductPricingWithGST(product, {
            size: selectedSize,
            storage: selectedStorage,
            memory: selectedMemory,
            purchaseOption: purchaseOption
        });
    }, [product, selectedSize, selectedStorage, selectedMemory, purchaseOption]);

    // Pincode state
    const [pincode, setPincode] = useState('');
    const [pincodeResult, setPincodeResult] = useState(null);
    const [isEditingPincode, setIsEditingPincode] = useState(false);

    const estimatedDeliveryDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 4);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }, []);

    const handlePincodeCheck = (e) => {
        if (e) e.preventDefault();
        if (!/^\d{6}$/.test(pincode)) {
            setPincodeResult({ ok: false, message: 'Please enter a valid 6-digit pincode' });
            return;
        }
        setPincodeResult({ ok: true, message: `Delivery by ${estimatedDeliveryDate}` });
        setIsEditingPincode(false);
    };

    // Limited time offer discounted calculation
    const offerPrice = useMemo(() => {
        const base = pricing.finalPrice || 0;
        return Math.round(base * 0.85); // 15% flat discount for special offer highlight
    }, [pricing.finalPrice]);

    // Specifications entries
    const specEntries = useMemo(() => {
        const specs = [];
        if (product.brand) specs.push(['Brand', product.brand]);
        if (product.category) specs.push(['Category', product.category]);
        if (product.material || product.attributes?.material) specs.push(['Material', product.material || product.attributes?.material]);
        if (product.purity || product.attributes?.purity) specs.push(['Purity / Carat', product.purity || product.attributes?.purity]);
        if (product.weight || product.attributes?.weight) specs.push(['Gross Weight', product.weight || product.attributes?.weight]);
        if (product.gender || product.attributes?.gender) specs.push(['Ideal For', product.gender || product.attributes?.gender]);
        if (seller?.shopName) specs.push(['Seller', seller.shopName]);

        if (product.specifications && typeof product.specifications === 'object') {
            Object.entries(product.specifications).forEach(([k, v]) => {
                if (v && !specs.some(([existing]) => existing.toLowerCase() === k.toLowerCase())) {
                    specs.push([k, v]);
                }
            });
        }
        return specs;
    }, [product, seller]);

    return (
        <div className="pd-luxury-info">
            {/* 1. Product Title & Wishlist */}
            <div className="pd-luxury-title-row">
                <h1 className="luxury-product-title">{product.name || product.title}</h1>
                <button 
                    type="button"
                    onClick={toggleWishlist} 
                    className={`luxury-wishlist-btn ${isSaved ? 'active' : ''}`}
                    aria-label="Wishlist"
                >
                    <Heart 
                        size={20} 
                        fill={isSaved ? "#ef4444" : "none"} 
                        color={isSaved ? "#ef4444" : "#444444"} 
                    />
                </button>
            </div>

            {/* 2. Rating Stars (Clickable link to reviews) */}
            {reviewStats.total > 0 && (
                <div 
                    className="luxury-rating-subtle clickable-reviews-link"
                    onClick={() => {
                        const target = document.getElementById('customer-reviews-section') || document.querySelector('.pd-reviews-block');
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    title="View Customer Reviews"
                >
                    <Rating
                        averageRating={reviewStats.average || 0}
                        totalReviews={reviewStats.total || 0}
                        size={14}
                        showCount={true}
                    />
                </div>
            )}

            {/* 3. Price Header */}
            <div className="pd-luxury-price-header">
                <div className="price-main-row">
                    <span className="price-current">{formatPrice(pricing.finalPrice)}</span>
                    {pricing.showDiscount && pricing.strikethroughPrice > pricing.finalPrice && (
                        <span className="price-original">{formatPrice(pricing.strikethroughPrice)}</span>
                    )}
                </div>
                <span className="price-tax-subtext">Inclusive of all taxes</span>
            </div>

            {/* 4. Variant Selection: Color Swatches */}
            {product.colors && product.colors.length > 0 && (
                <div className="luxury-variant-section">
                    <div className="variant-header-row">
                        <span className="variant-label-text">
                            {['jewelry', 'jewellery', 'necklace', 'ring', 'earrings', 'bracelet', 'metal'].some(c => (product.category || '').toLowerCase().includes(c)) ? 'Select Metal Color' : 'Select Color'}
                        </span>
                    </div>

                    <div className="color-swatches-row">
                        {product.colors.map((c, idx) => {
                            const colorName = typeof c === 'object' ? c.name : c;
                            const isSelected = (typeof selectedColor === 'object' ? selectedColor.name : selectedColor) === colorName;
                            const hex = getColorHex(c);

                            // Resolve thumbnail image
                            let thumbImg = null;
                            if (typeof c === 'object' && (c.image || c.imageUrl)) {
                                thumbImg = c.image || c.imageUrl;
                            } else if (variantImageMap?.[colorName]) {
                                const val = variantImageMap[colorName];
                                thumbImg = Array.isArray(val) ? val[0] : val;
                            } else if (product?.variantImages?.[colorName]) {
                                const val = product.variantImages[colorName];
                                thumbImg = Array.isArray(val) ? val[0] : val;
                            } else if (images && images[idx]) {
                                thumbImg = images[idx];
                            } else if (product?.images && product.images[idx]) {
                                thumbImg = product.images[idx];
                            }

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`swatch-thumb-btn ${isSelected ? 'active' : ''}`}
                                    title={colorName}
                                    onClick={() => {
                                        setSelectedColor(c);
                                        const url = thumbImg || variantImageMap?.[colorName];
                                        if (url && setVariantImageUrl) setVariantImageUrl(url);
                                    }}
                                >
                                    {thumbImg ? (
                                        <img 
                                            src={thumbImg} 
                                            alt={colorName} 
                                            className="swatch-img-thumb" 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                if (e.target.nextSibling) {
                                                    e.target.nextSibling.style.display = 'block';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <span 
                                        className="swatch-color-dot" 
                                        style={{ 
                                            backgroundColor: hex, 
                                            display: thumbImg ? 'none' : 'block' 
                                        }}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* Stock Status Badge */}
                    <div className={`luxury-stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                        {isOutOfStock ? (
                            <span>Out of Stock</span>
                        ) : (
                            <>
                                <Check size={14} strokeWidth={3} />
                                <span>In Stock</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Sizes Selection (if available) */}
            {product.sizes && product.sizes.length > 0 && (
                <div className="luxury-variant-section">
                    <div className="variant-header-row">
                        <span className="variant-label-text">Select Size: <strong>{selectedSize}</strong></span>
                        <button 
                            type="button" 
                            className="variant-guide-link"
                            onClick={() => setIsSizeChartOpen(true)}
                        >
                            <Ruler size={14} />
                            <span>Size Guide</span>
                        </button>
                    </div>
                    <div className="size-buttons-grid">
                        {product.sizes.map((size) => (
                            <button
                                key={size}
                                type="button"
                                className={`size-choice-btn ${selectedSize === size ? 'active' : ''}`}
                                onClick={() => setSelectedSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Storage / Memory Selections (if electronics) */}
            {product.storage && product.storage.length > 0 && (
                <div className="luxury-variant-section">
                    <div className="variant-header-row">
                        <span className="variant-label-text">{t('product.storage')}: <strong>{selectedStorage?.label || selectedStorage}</strong></span>
                    </div>
                    <div className="pill-options-row">
                        {product.storage.map((s, idx) => {
                            const isActive = selectedStorage && (
                                (typeof s === 'object' && typeof selectedStorage === 'object' && s.label === selectedStorage.label) ||
                                s === selectedStorage
                            );
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`pill-option-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => setSelectedStorage(s)}
                                >
                                    <span>{s.label || s}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. Deliver To & Pincode Checker */}
            <div className="luxury-delivery-box">
                <div className="delivery-header-row">
                    <span className="delivery-title-label">
                        Deliver To: <strong>{pincodeResult?.ok && pincode ? pincode : '______'}</strong>
                    </span>
                    <button 
                        type="button" 
                        className="delivery-change-btn"
                        onClick={() => {
                            setIsEditingPincode(true);
                            setPincodeResult(null);
                        }}
                    >
                        Change
                    </button>
                </div>

                <form className="luxury-pincode-input-row" onSubmit={handlePincodeCheck}>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter your pincode to check delivery date."
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    />
                    <button type="submit" className="pincode-submit-btn">Check</button>
                </form>

                {pincodeResult && (
                    <div className={`luxury-pincode-status ${pincodeResult.ok ? 'success' : 'error'}`}>
                        {pincodeResult.ok && <CheckCircle2 size={15} />}
                        <span>{pincodeResult.message}</span>
                    </div>
                )}
            </div>

            {/* 6. Purchase Benefits Grid with Logos / Icons */}
            <div className="luxury-benefits-grid">
                <div className="luxury-benefit-card">
                    <div className="benefit-icon-circle">
                        <Truck size={20} />
                    </div>
                    <div className="benefit-text-box">
                        <strong>Fast Delivery</strong>
                        <span>Most orders delivered in 3-4 business days.</span>
                    </div>
                </div>
                <div className="luxury-benefit-card">
                    <div className="benefit-icon-circle">
                        <RotateCcw size={20} />
                    </div>
                    <div className="benefit-text-box">
                        <strong>Easy Returns</strong>
                        <span>7-day replacement for damaged or incorrect items.</span>
                    </div>
                </div>
                <div className="luxury-benefit-card">
                    <div className="benefit-icon-circle">
                        <ShieldCheck size={20} />
                    </div>
                    <div className="benefit-text-box">
                        <strong>Secure Checkout</strong>
                        <span>Pay safely with multiple trusted payment methods.</span>
                    </div>
                </div>
            </div>

            {/* 7. Accordions Section (Product Details, Price Breakup, Description, Available Offers) */}
            <div className="luxury-accordions-group">
                {/* Accordion 1: Product Details */}
                <div className={`luxury-accordion-card ${openAccordions.details ? 'is-open' : ''}`}>
                    <button 
                        type="button" 
                        className="accordion-trigger-btn"
                        onClick={() => toggleAccordion('details')}
                    >
                        <div className="acc-left-meta">
                            <div className="acc-icon-wrap">
                                <FileText size={17} />
                            </div>
                            <span className="acc-title-text">Product Details</span>
                        </div>
                        <div className="acc-chevron-wrap">
                            <ChevronDown 
                                size={18} 
                                className={`accordion-chevron ${openAccordions.details ? 'open' : ''}`} 
                            />
                        </div>
                    </button>
                    {openAccordions.details && (
                        <div className="accordion-content-pane">
                            <div className="specs-table-grid">
                                {specEntries.map(([label, val], idx) => (
                                    <div key={idx} className="spec-row-item">
                                        <span className="spec-item-key">{label}</span>
                                        <span className="spec-item-val">{String(val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Accordion 2: Price Breakup */}
                <div className={`luxury-accordion-card ${openAccordions.priceBreakup ? 'is-open' : ''}`}>
                    <button 
                        type="button" 
                        className="accordion-trigger-btn"
                        onClick={() => toggleAccordion('priceBreakup')}
                    >
                        <div className="acc-left-meta">
                            <div className="acc-icon-wrap">
                                <Receipt size={17} />
                            </div>
                            <span className="acc-title-text">Price Breakup</span>
                        </div>
                        <div className="acc-chevron-wrap">
                            <ChevronDown 
                                size={18} 
                                className={`accordion-chevron ${openAccordions.priceBreakup ? 'open' : ''}`} 
                            />
                        </div>
                    </button>
                    {openAccordions.priceBreakup && (
                        <div className="accordion-content-pane">
                            <div className="price-breakup-table">
                                <div className="breakup-row">
                                    <span>Base Metal / Component</span>
                                    <span>{formatPrice(pricing.basePrice)}</span>
                                </div>
                                <div className="breakup-row">
                                    <span>GST / Taxes ({pricing.gstPercent || 18}%)</span>
                                    <span>{formatPrice(pricing.gstAmount || 0)}</span>
                                </div>
                                {pricing.showDiscount && (
                                    <div className="breakup-row discount-row">
                                        <span>Special Savings</span>
                                        <span>-{formatPrice(pricing.strikethroughPrice - pricing.finalPrice)}</span>
                                    </div>
                                )}
                                <div className="breakup-row total-row">
                                    <strong>Final Total (Incl. GST)</strong>
                                    <strong>{formatPrice(pricing.finalPrice)}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Accordion 3: Description */}
                <div className={`luxury-accordion-card ${openAccordions.description ? 'is-open' : ''}`}>
                    <button 
                        type="button" 
                        className="accordion-trigger-btn"
                        onClick={() => toggleAccordion('description')}
                    >
                        <div className="acc-left-meta">
                            <div className="acc-icon-wrap">
                                <AlignLeft size={17} />
                            </div>
                            <span className="acc-title-text">Description</span>
                        </div>
                        <div className="acc-chevron-wrap">
                            <ChevronDown 
                                size={18} 
                                className={`accordion-chevron ${openAccordions.description ? 'open' : ''}`} 
                            />
                        </div>
                    </button>
                    {openAccordions.description && (
                        <div className="accordion-content-pane">
                            <p className="luxury-desc-text">
                                {product.description || product.shortDescription || `Indulge in exceptional craftsmanship with the ${product.name || product.title}. Designed with precision and crafted using highest quality materials.`}
                            </p>
                        </div>
                    )}
                </div>

            </div>



            {/* Size Chart Modal */}
            <SizeChartModal
                isOpen={isSizeChartOpen}
                onClose={() => setIsSizeChartOpen(false)}
                category={product?.category}
            />
        </div>
    );
}