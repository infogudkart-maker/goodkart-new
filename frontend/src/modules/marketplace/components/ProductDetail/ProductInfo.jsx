import React from 'react';
import { Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import SizeChartModal from '@/modules/shared/components/common/SizeChartModal';

export default function ProductInfo({
    product,
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

