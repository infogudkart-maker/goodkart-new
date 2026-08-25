import React, { useState, useMemo } from 'react';
import { Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, Ruler, MapPin, CheckCircle2, BadgePercent, CreditCard, Landmark, Tag, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import SizeChartModal from '@/modules/shared/components/common/SizeChartModal';

// Static bank/offer copy shown for every product — purely presentational,
// mirrors what most marketplaces show without needing a live offers API.
const STATIC_OFFERS = [
    { icon: Landmark, text: 'Get 10% instant discount up to ₹500 on select Bank Credit Cards' },
    { icon: CreditCard, text: 'No Cost EMI available on orders above ₹3,000' },
    { icon: Tag, text: 'Extra 5% off on first prepaid order — auto applied at checkout' },
];

function DeliveryCheck() {
    const [pincode, setPincode] = useState('');
    const [result, setResult] = useState(null);

    const estimatedDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 4);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }, [result]);

    const handleCheck = (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(pincode)) {
            setResult({ ok: false, message: 'Please enter a valid 6-digit pincode' });
            return;
        }
        setResult({ ok: true, message: `Delivery by ${estimatedDate}` });
    };

    return (
        <div className="pd-section">
            <h3><MapPin size={16} /> Delivery Options</h3>
            <form className="pincode-check-row" onSubmit={handleCheck}>
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                />
                <button type="submit">Check</button>
            </form>
            {result && (
                <div className={`pincode-result ${result.ok ? 'ok' : 'err'}`}>
                    {result.ok && <CheckCircle2 size={16} />}
                    <span>{result.message}</span>
                </div>
            )}
            <div className="delivery-meta-list">
                <div className="delivery-meta-item"><Truck size={15} /> Free delivery on orders above ₹499</div>
                <div className="delivery-meta-item"><RotateCcw size={15} /> Easy 7-day replacement</div>
            </div>
        </div>
    );
}

function OffersSection() {
    return (
        <div className="pd-section">
            <h3><BadgePercent size={16} /> Available Offers</h3>
            <div className="offers-list">
                {STATIC_OFFERS.map((offer, idx) => {
                    const Icon = offer.icon;
                    return (
                        <div className="offer-row" key={idx}>
                            <Icon size={16} className="offer-icon" />
                            <span>{offer.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function HighlightsSection({ product }) {
    const specEntries = product?.specifications && typeof product.specifications === 'object'
        ? Object.entries(product.specifications).filter(([, v]) => v)
        : [];

    if (specEntries.length === 0) return null;

    return (
        <div className="pd-section">
            <h3><Sparkles size={16} /> Highlights</h3>
            <ul className="highlights-list">
                {specEntries.slice(0, 6).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {value}</li>
                ))}
            </ul>
        </div>
    );
}

function ProductOverview({ product, seller }) {
    const productMeta = [
        { label: 'Brand', value: product.brand || product.brandName || product.productBrand || product.manufacturer || product.attributes?.brand || product.attributes?.manufacturer || 'Goodkart' },
        { label: 'Category', value: product.category || product.subCategory || 'General' },
        { label: 'Seller', value: seller?.shopName || seller?.name || product.sellerName || product.seller || product.shopName || 'Verified Seller' },
    ].filter(item => item.value);

    return (
        <div className="product-overview">
            {productMeta.map((item) => (
                <span key={item.label} className="overview-pill">{item.label}: {item.value}</span>
            ))}
        </div>
    );
}

function ProductSummary({ product }) {
    const fallback = `Premium ${product.name || product.title} with fast delivery, easy returns, and a reliable buy-now experience.`;
    const summary = product?.shortDescription || (typeof product?.description === 'string' ? product.description : fallback);
    const trimmed = summary.length > 210 ? `${summary.slice(0, 210).trim()}...` : summary;

    return (
        <div className="product-summary">
            {trimmed}
        </div>
    );
}

function PurchaseBenefits() {
    return (
        <div className="product-benefits">
            <div className="product-benefit">
                <strong>Fast Delivery</strong>
                <span>Most orders delivered in 3-4 business days.</span>
            </div>
            <div className="product-benefit">
                <strong>Easy Returns</strong>
                <span>7-day replacement for damaged or incorrect items.</span>
            </div>
            <div className="product-benefit">
                <strong>Secure Checkout</strong>
                <span>Pay safely with multiple trusted payment methods.</span>
            </div>
        </div>
    );
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

    return (
        <div className="pd-info">
            <div className="info-header">
                <h1 className="main-title">{product.name || product.title}</h1>
                <div className="rating-row">
                    <Rating
                        averageRating={reviewStats.average || 0}
                        totalReviews={reviewStats.total || 0}
                        size={16}
                        showCount={true}
                        className="product-detail-rating"
                    />
                    <div className="actions-meta">
                        <button onClick={toggleWishlist} className={isSaved ? 'active' : ''}>
                            <Heart size={18} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "currentColor"} />
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                        <button onClick={handleShare}><Share2 size={18} /> Share</button>
                    </div>
                </div>
            </div>
            <div className="product-header-meta">
                <ProductOverview product={product} seller={seller} />
                <ProductSummary product={product} />
            </div>

            <div className="price-box">
                <PriceDisplay
                    product={product}
                    selections={{
                        size: selectedSize,
                        storage: selectedStorage,
                        memory: selectedMemory,
                        purchaseOption: purchaseOption
                    }}
                    size="lg"
                />
                <div className={`stock-status ${(product.stock === 0 || product.status === 'Out of Stock') ? 'out' : 'in'}`}>
                    {(product.stock === 0 || product.status === 'Out of Stock') ? 'Out of Stock' : `In Stock${product.stock ? ` (${product.stock} units)` : ''}`}
                </div>
            </div>

            <PurchaseBenefits />

            <OffersSection />

            {/* Dynamic Variant Sections - Colors */}
            {product.colors && product.colors.length > 0 && (
                <div className="pd-section">
                    <h3>{t('product.color')}: <span className="selected-val">{typeof selectedColor === 'object' ? selectedColor.name : selectedColor}</span></h3>
                    <div className="pill-group">
                        {product.colors.map((c, idx) => {
                            const colorName = typeof c === 'object' ? c.name : c;
                            const colorKey = typeof c === 'object' ? c.name : c;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`pill ${selectedColor === c ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedColor(c);
                                        const url = variantImageMap?.[colorKey];
                                        if (url && setVariantImageUrl) setVariantImageUrl(url);
                                    }}
                                >
                                    {colorName}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
                <div className="pd-section">
                    <div className="section-header-row">
                        <h3>Select Size: <span className="selected-val">{selectedSize}</span></h3>
                        <button className="size-guide-btn" onClick={() => setIsSizeChartOpen(true)} type="button">Size Guide</button>
                    </div>
                    <div className="size-grid">
                        {product.sizes.map((size) => (
                            <button
                                key={size}
                                type="button"
                                className={`size-pill ${selectedSize === size ? 'active' : ''}`}
                                onClick={() => setSelectedSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {product.storage && product.storage.length > 0 && (
                <div className="pd-section">
                    <h3>{t('product.storage')}: <span className="selected-val">{selectedStorage?.label || selectedStorage}</span></h3>
                    <div className="pill-group">
                        {product.storage.map((s, idx) => {
                            const isActive = selectedStorage && (
                                (typeof s === 'object' && typeof selectedStorage === 'object' && s.label === selectedStorage.label) ||
                                s === selectedStorage
                            );
                            return (
                                <button
                                    key={s.label || s || idx}
                                    type="button"
                                    className={`pill variant-pill ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedStorage(s);
                                        const url = variantImageMap?.[s.label || s];
                                        if (url && setVariantImageUrl) setVariantImageUrl(url);
                                    }}
                                >
                                    <span className="v-label">{s.label || s}</span>
                                    <span className="v-price">{s.priceOffset ? (s.priceOffset > 0 ? `+₹${s.priceOffset.toLocaleString()}` : `-₹${Math.abs(s.priceOffset).toLocaleString()}`) : 'Included'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {product.memory && product.memory.length > 0 && (
                <div className="pd-section">
                    <h3>{t('product.memory')}: <span className="selected-val">{selectedMemory?.label || selectedMemory}</span></h3>
                    <div className="pill-group">
                        {product.memory.map((m, idx) => {
                            const isActive = selectedMemory && (
                                (typeof m === 'object' && typeof selectedMemory === 'object' && m.label === selectedMemory.label) ||
                                m === selectedMemory
                            );
                            return (
                                <button
                                    key={m.label || m || idx}
                                    type="button"
                                    className={`pill variant-pill ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedMemory(m);
                                        const url = variantImageMap?.[m.label || m];
                                        if (url && setVariantImageUrl) setVariantImageUrl(url);
                                    }}
                                >
                                    <span className="v-label">{m.label || m}</span>
                                    <span className="v-price">{m.priceOffset ? (m.priceOffset > 0 ? `+₹${m.priceOffset.toLocaleString()}` : `-₹${Math.abs(m.priceOffset).toLocaleString()}`) : 'Included'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <DeliveryCheck />

            <HighlightsSection product={product} />

            <div className="pd-section">
                <div className="trust-card">
                    <div className="badge"><Shield size={20} /> <div><strong>Secure Multi-layer Packaging</strong><span>Damage-free delivery guaranteed</span></div></div>
                    <div className="badge"><RotateCcw size={20} /> <div><strong>7 Days Replacement</strong><span>Easy returns & exchanges</span></div></div>
                </div>
            </div>

            <div className="pd-actions">
                {isOutOfStock ? (
                    <button
                        className="btn-add-cart"
                        onClick={toggleWishlist}
                        style={{ background: isSaved ? '#ef4444' : '#3B7CF1', width: '100%' }}
                    >
                        <Heart size={20} fill={isSaved ? "white" : "none"} />
                        {isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
                    </button>
                ) : (
                    <>
                        <button
                            className="btn-add-cart"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart size={20} />
                            Add to Cart
                        </button>
                        <button
                            className="btn-buy-now"
                            onClick={handleBuyNow}
                        >
                            Buy Now
                        </button>
                    </>
                )}
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