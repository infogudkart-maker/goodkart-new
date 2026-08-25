import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, ShoppingCart, ShoppingBag, Heart, Eye, X, ArrowUpDown, Check, ChevronUp, ChevronDown } from 'lucide-react';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import LoadingSpinner from '@/modules/shared/components/common/LoadingSpinner';

const SORT_OPTIONS = [
    { value: 'newest', label: 'What\'s New' },
    { value: 'priceLow', label: 'Price: Low to High' },
    { value: 'priceHigh', label: 'Price: High to Low' },
];

export default function ProductGrid({
    filteredProducts,
    loading,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategories = [],
    setSelectedSubcategories,
    priceRange,
    setPriceRange,
    stockFilter,
    setStockFilter,
    selectedSizes = [],
    setSelectedSizes,
    selectedColors = [],
    setSelectedColors,
    selectedMaterials = [],
    setSelectedMaterials,
    selectedOccasions = [],
    setSelectedOccasions,
    minDiscount = 0,
    setMinDiscount,
    sortBy,
    setSortBy,
    clearAllFilters,
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
    const [sortOpen, setSortOpen] = useState(false);
    const sortRef = useRef(null);

    useEffect(() => {
        if (!sortOpen) return;
        const handleClickOutside = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) {
                setSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sortOpen]);

    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || SORT_OPTIONS[0].label;

    const removeSubcategoryChip = (sub) => {
        const next = selectedSubcategories.filter(s => s !== sub);
        setSelectedSubcategories(next);
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'All') {
            params.set('category', selectedCategory);
        }
        next.forEach(s => params.append('subcategory', s));
        navigate(`/products?${params.toString()}`);
    };

    const removeFromList = (list, setList, value) => setList(list.filter(v => v !== value));

    const hasActiveChips = selectedSubcategories.length > 0 || priceRange < 200000 || stockFilter !== 'all' ||
        selectedSizes.length > 0 || selectedColors.length > 0 || selectedMaterials.length > 0 ||
        selectedOccasions.length > 0 || minDiscount > 0;

    return (
        <main className="product-main">
            {/* Header with Breadcrumbs and View Toggle */}
            <div className="listing-header-inline">
                <div className="breadcrumb">
                    <Link to="/">Home</Link> / <span>{selectedCategory === 'All' ? 'Products' : selectedCategory}</span>
                </div>
                <div className="listing-title-row">
                    <h1>{selectedCategory === 'All' ? 'All Products' : selectedCategory} <span className="count">({filteredProducts.length} items)</span></h1>
                    <div className="listing-controls-row">
                        <div className="sort-control" ref={sortRef}>
                            <button
                                type="button"
                                className={`sort-trigger ${sortOpen ? 'open' : ''}`}
                                onClick={() => setSortOpen(o => !o)}
                            >
                                <ArrowUpDown size={14} />
                                <span>Sort by <strong>{currentSortLabel}</strong></span>
                                {sortOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {sortOpen && (
                                <div className="sort-popover">
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`sort-option-row ${sortBy === opt.value ? 'selected' : ''}`}
                                            onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                                        >
                                            <span>{opt.label}</span>
                                            <span className="sort-radio">
                                                {sortBy === opt.value && <Check size={12} strokeWidth={3} />}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="view-toggle">
                            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid View"><LayoutGrid size={18} /></button>
                            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List View"><List size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* Applied Filter Chips */}
                {hasActiveChips && (
                    <div className="applied-filters-row">
                        {selectedSubcategories.map(sub => (
                            <button key={sub} className="filter-chip" onClick={() => removeSubcategoryChip(sub)}>
                                {sub} <X size={13} strokeWidth={2.5} />
                            </button>
                        ))}
                        {priceRange < 200000 && (
                            <button className="filter-chip" onClick={() => setPriceRange(200000)}>
                                Under ₹{priceRange.toLocaleString()} <X size={13} strokeWidth={2.5} />
                            </button>
                        )}
                        {stockFilter !== 'all' && (
                            <button className="filter-chip" onClick={() => setStockFilter('all')}>
                                {stockFilter === 'inStock' ? 'In Stock' : 'Out of Stock'} <X size={13} strokeWidth={2.5} />
                            </button>
                        )}
                        {selectedSizes.map(size => (
                            <button key={size} className="filter-chip" onClick={() => removeFromList(selectedSizes, setSelectedSizes, size)}>
                                Size: {size} <X size={13} strokeWidth={2.5} />
                            </button>
                        ))}
                        {selectedColors.map(color => (
                            <button key={color} className="filter-chip" onClick={() => removeFromList(selectedColors, setSelectedColors, color)}>
                                {color} <X size={13} strokeWidth={2.5} />
                            </button>
                        ))}
                        {selectedMaterials.map(mat => (
                            <button key={mat} className="filter-chip" onClick={() => removeFromList(selectedMaterials, setSelectedMaterials, mat)}>
                                {mat} <X size={13} strokeWidth={2.5} />
                            </button>
                        ))}
                        {selectedOccasions.map(occ => (
                            <button key={occ} className="filter-chip" onClick={() => removeFromList(selectedOccasions, setSelectedOccasions, occ)}>
                                {occ} <X size={13} strokeWidth={2.5} />
                            </button>
                        ))}
                        {minDiscount > 0 && (
                            <button className="filter-chip" onClick={() => setMinDiscount(0)}>
                                {minDiscount}% off or more <X size={13} strokeWidth={2.5} />
                            </button>
                        )}
                        <button className="filter-chip-clear" onClick={clearAllFilters}>Clear All</button>
                    </div>
                )}
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
                                    key={`${p.id}-${viewMode}`}
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
                                        <button
                                            onClick={(e) => toggleWishlist(e, p)}
                                            className={`wishlist-heart ${isWishlisted ? 'active' : ''}`}
                                            title="Save to Wishlist"
                                        >
                                            <Heart
                                                size={16}
                                                fill={isWishlisted ? "#ef4444" : "none"}
                                                color={isWishlisted ? "#ef4444" : "#374151"}
                                            />
                                        </button>
                                        {viewMode === 'grid' && (
                                            <>
                                                <button className="quickview-btn" title="Quick View" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedQuickProduct(p);
                                                    setIsQuickViewOpen(true);
                                                }}><Eye size={16} /></button>
                                                <button
                                                    className="add-to-bag-bar"
                                                    disabled={isOutOfStock}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isOutOfStock) { toggleWishlist(e, p); return; }
                                                        handleAddToCart(p);
                                                    }}
                                                >
                                                    {isOutOfStock ? (
                                                        <>Notify Me</>
                                                    ) : (
                                                        <><ShoppingBag size={15} /> Add to Bag</>
                                                    )}
                                                </button>
                                            </>
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
