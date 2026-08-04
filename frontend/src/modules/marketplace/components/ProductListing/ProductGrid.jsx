import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, ShoppingCart, Heart, Eye } from 'lucide-react';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import LoadingSpinner from '@/modules/shared/components/common/LoadingSpinner';

export default function ProductGrid({
    filteredProducts,
    loading,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    setPriceRange,
    productReviews,
    wishlist,
    toggleWishlist,
    handleAddToCart,
    setSelectedProduct,
    setIsReviewModalOpen,
    setSelectedQuickProduct,
    setIsQuickViewOpen,
    locationSearch
}) {
    const navigate = useNavigate();

    return (
        <main className="product-main">
            {/* Header with Breadcrumbs and View Toggle */}
            <div className="listing-header-inline">
                <div className="breadcrumb">
                    <Link to="/">Home</Link> / <span>Products</span>
                </div>
                <div className="listing-title-row">
                    <h1>{selectedCategory === 'All' ? 'All Products' : selectedCategory} <span className="count">({filteredProducts.length})</span></h1>
                    <div className="view-toggle">
                        <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid View"><LayoutGrid size={18} /></button>
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List View"><List size={18} /></button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                {loading ? (
                    <LoadingSpinner 
                        size="large" 
                        message="Discovering best products for you..." 
                    />
                ) : filteredProducts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-state glass-card"
                    >
                        <Search size={48} className="text-muted" />
                        <h2>No products found</h2>
                        <p>
                            {locationSearch.includes('subcategory')
                                ? 'No products found for this selection. Try browsing other categories or subcategories.'
                                : 'Try adjusting your filters or search query to find what you\'re looking for.'
                            }
                        </p>
                        <button onClick={() => { setSelectedCategory('All'); setPriceRange(100000); navigate('/products') }} className="btn btn-primary">Clear All Filters</button>
                    </motion.div>
                ) : (
                    <div className={`products-${viewMode}`}>
                        {filteredProducts.map((p, idx) => {
                            const isOutOfStock = p.stock === 0 || p.status === 'Out of Stock';
                            const isWishlisted = wishlist.some(item => item.id === p.id);
                            
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={p.id}
                                    className="product-card-premium glass-card"
                                    onClick={() => {
                                        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                                        const filtered = recentlyViewed.filter(item => item.id !== p.id);
                                        const updated = [p, ...filtered].slice(0, 8);
                                        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                                        navigate("/product/" + p.id);
                                    }}
                                    onDoubleClick={() => navigate("/product/" + p.id)}
                                >
                                    <div className="card-media">
                                        {p.discount && !isOutOfStock && <span className="discount-badge">{p.discount}</span>}
                                        {isOutOfStock && <span className="out-of-stock-badge">OUT OF STOCK</span>}
                                        <img 
                                            src={p.imageUrl || p.image} 
                                            alt={p.name}
                                            style={isOutOfStock ? { filter: 'grayscale(100%)', opacity: 0.7 } : {}}
                                        />
                                        {viewMode === 'grid' && (
                                            <div className="overlay-tools">
                                                <button
                                                    onClick={(e) => toggleWishlist(e, p)}
                                                    className={`tool-btn ${isWishlisted ? 'active' : ''}`}
                                                    title="Save to Wishlist"
                                                >
                                                    <Heart
                                                        size={18}
                                                        fill={isWishlisted ? "#ef4444" : "none"}
                                                        color={isWishlisted ? "#ef4444" : "currentColor"}
                                                    />
                                                </button>
                                                <button className="tool-btn" title="View Details" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedQuickProduct(p);
                                                    setIsQuickViewOpen(true);
                                                }}><Eye size={18} /></button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="product-details">
                                        {viewMode === 'list' ? (
                                            <>
                                                <div className="product-info-top">
                                                    <p className="p-cat">{p.category}</p>
                                                    <h3 className="p-name">{p.name}</h3>
                                                    <div className="p-rating">
                                                        <Rating
                                                            averageRating={productReviews[p.id]?.stats?.averageRating || 0}
                                                            totalReviews={productReviews[p.id]?.stats?.totalReviews || 0}
                                                            size={14}
                                                            showCount={true}
                                                            className="product-card-rating"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="product-info-bottom">
                                                    <div className="p-price-group">
                                                        <PriceDisplay product={p} size="lg" showGSTIndicator={false} />
                                                        {isOutOfStock && (
                                                            <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>OUT OF STOCK</span>
                                                        )}
                                                    </div>
                                                    <div className="product-actions">
                                                        <button
                                                            onClick={(e) => toggleWishlist(e, p)}
                                                            className={`tool-btn ${isWishlisted ? 'active' : ''}`}
                                                            title="Save to Wishlist"
                                                        >
                                                            <Heart
                                                                size={18}
                                                                fill={isWishlisted ? "#ef4444" : "none"}
                                                                color={isWishlisted ? "#ef4444" : "currentColor"}
                                                            />
                                                        </button>
                                                        <button className="tool-btn" title="View Details" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedQuickProduct(p);
                                                            setIsQuickViewOpen(true);
                                                        }}><Eye size={18} /></button>
                                                        {isOutOfStock ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleWishlist(e, p); }}
                                                                className="add-to-cart-simple"
                                                                title="Add to Wishlist"
                                                                style={{ background: isWishlisted ? '#ef4444' : '#3B7CF1' }}
                                                            >
                                                                <Heart size={18} fill={isWishlisted ? "white" : "none"} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                                                                className="add-to-cart-simple"
                                                            >
                                                                <ShoppingCart size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="p-cat">{p.category}</p>
                                                <h3 className="p-name">{p.name}</h3>
                                                <div className="p-rating">
                                                    <Rating
                                                        averageRating={productReviews[p.id]?.stats?.averageRating || 0}
                                                        totalReviews={productReviews[p.id]?.stats?.totalReviews || 0}
                                                        size={12}
                                                        showCount={true}
                                                        className="product-card-rating"
                                                    />
                                                </div>
                                                <div className="p-footer">
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                                        <PriceDisplay product={p} size="sm" showGSTIndicator={false} />
                                                        {isOutOfStock && (
                                                            <span style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>OUT OF STOCK</span>
                                                        )}
                                                    </div>
                                                    {isOutOfStock ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleWishlist(e, p); }}
                                                            className="add-to-cart-simple"
                                                            title="Add to Wishlist"
                                                            style={{ background: isWishlisted ? '#ef4444' : '#3B7CF1' }}
                                                        >
                                                            <Heart size={18} fill={isWishlisted ? "white" : "none"} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                                                            className="add-to-cart-simple"
                                                        >
                                                            <ShoppingCart size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
