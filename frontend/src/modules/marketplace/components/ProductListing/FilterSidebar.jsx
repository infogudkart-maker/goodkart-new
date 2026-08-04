import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { MAIN_CATEGORIES, getSubcategories } from '@/modules/shared/config/categories';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.PROD
    ? (import.meta.env.VITE_API_BASE_URL || 'https://sellsathi-refactored.onrender.com')
    : 'http://localhost:5000';

export default function FilterSidebar({
    selectedCategory,
    setSelectedCategory,
    selectedSubcategories,
    setSelectedSubcategories,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    stockFilter,
    setStockFilter,
    clearAllFilters
}) {
    const navigate = useNavigate();
    const [expandedCategories, setExpandedCategories] = useState([]);
    const [customCategories, setCustomCategories] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/admin/config/public`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.config?.categoryGstRates) {
                    const custom = Object.keys(d.config.categoryGstRates).filter(k => !MAIN_CATEGORIES.includes(k) && k !== 'Others');
                    setCustomCategories(custom);
                }
            })
            .catch(() => {});
    }, []);

    // Auto-expand category if subcategory is selected
    useEffect(() => {
        if (selectedCategory !== 'All' && selectedSubcategories.length > 0) {
            if (!expandedCategories.includes(selectedCategory)) {
                setExpandedCategories(prev => [...prev, selectedCategory]);
            }
        }
    }, [selectedCategory, selectedSubcategories]);

    const toggleCategoryExpansion = (category) => {
        setExpandedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleCategoryClick = (cat) => {
        const subcategories = getSubcategories(cat);
        
        if (subcategories.length > 0) {
            toggleCategoryExpansion(cat);
            setSelectedCategory(cat);
            setSelectedSubcategories([]);
        } else {
            setSelectedCategory(cat);
            setSelectedSubcategories([]);
        }
        // Update URL to remove stale subcategory param
        navigate(`/products?category=${encodeURIComponent(cat)}`);
    };

    const toggleSubcategory = (subcategory) => {
        setSelectedSubcategories(prev => {
            const next = prev.includes(subcategory)
                ? prev.filter(s => s !== subcategory)
                : [...prev, subcategory];
            // Sync URL so URL params don't override state
            const params = new URLSearchParams();
            if (selectedCategory && selectedCategory !== 'All') {
                params.set('category', selectedCategory);
            }
            next.forEach(s => params.append('subcategory', s));
            navigate(`/products?${params.toString()}`);
            return next;
        });
    };

    return (
        <aside className="filters-sidebar-pro glass-card">
            <div className="sidebar-header-compact">
                <h3 className="sidebar-title">Categories</h3>
                {(selectedCategory !== 'All' || selectedSubcategories.length > 0 || priceRange < 200000 || stockFilter !== 'all') && (
                    <button className="clear-filters-btn" onClick={clearAllFilters}>
                        Clear All
                    </button>
                )}
            </div>

            {/* Categories Section with Collapsible Subcategories */}
            <div className="filter-section">
                <div className="category-list-pro">
                    <button
                        className={selectedCategory === 'All' ? 'active' : ''}
                        onClick={() => {
                            setSelectedCategory('All');
                            setSelectedSubcategories([]);
                        }}
                    >
                        All Products
                    </button>
                    {[...MAIN_CATEGORIES, ...customCategories].map(cat => {
                        const subcategories = getSubcategories(cat);
                        const isExpanded = expandedCategories.includes(cat);
                        const hasSubcategories = subcategories.length > 0;

                        return (
                            <div key={cat} className="category-item-wrapper">
                                <button
                                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => handleCategoryClick(cat)}
                                >
                                    <span>{cat}</span>
                                    {hasSubcategories && (
                                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                    )}
                                </button>
                                
                                {hasSubcategories && isExpanded && (
                                    <div className="subcategory-dropdown">
                                        {subcategories.map(sub => (
                                            <label key={sub} className="subcategory-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubcategories.includes(sub)}
                                                    onChange={() => toggleSubcategory(sub)}
                                                />
                                                <span>{sub}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Price Range Section */}
            <div className="filter-section">
                <h4 className="filter-section-title">PRICE RANGE</h4>
                <div className="price-filter-pro">
                    <input
                        type="range"
                        min="0"
                        max="200000"
                        step="1000"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                    />
                    <div className="price-labels">
                        <span>₹0</span>
                        <span className="current-price">₹{priceRange.toLocaleString()}</span>
                        <span>₹2,00,000</span>
                    </div>
                </div>
            </div>

            {/* Sort By Section */}
            <div className="filter-section">
                <h4 className="filter-section-title">SORT BY</h4>
                <div className="sort-options-pro">
                    <label className="radio-label">
                        <input type="radio" name="sort" value="newest" checked={sortBy === 'newest'} onChange={(e) => setSortBy(e.target.value)} />
                        <span>Newest First</span>
                    </label>
                    <label className="radio-label">
                        <input type="radio" name="sort" value="priceLow" checked={sortBy === 'priceLow'} onChange={(e) => setSortBy(e.target.value)} />
                        <span>Price: Low to High</span>
                    </label>
                    <label className="radio-label">
                        <input type="radio" name="sort" value="priceHigh" checked={sortBy === 'priceHigh'} onChange={(e) => setSortBy(e.target.value)} />
                        <span>Price: High to Low</span>
                    </label>
                </div>
            </div>

            {/* Stock Availability Section */}
            <div className="filter-section">
                <h4 className="filter-section-title">AVAILABILITY</h4>
                <div className="sort-options-pro">
                    <label className="radio-label">
                        <input type="radio" name="stock" value="all" checked={stockFilter === 'all'} onChange={(e) => setStockFilter(e.target.value)} />
                        <span>All Products</span>
                    </label>
                    <label className="radio-label">
                        <input type="radio" name="stock" value="inStock" checked={stockFilter === 'inStock'} onChange={(e) => setStockFilter(e.target.value)} />
                        <span>In Stock</span>
                    </label>
                    <label className="radio-label">
                        <input type="radio" name="stock" value="outOfStock" checked={stockFilter === 'outOfStock'} onChange={(e) => setStockFilter(e.target.value)} />
                        <span>Out of Stock</span>
                    </label>
                </div>
            </div>
        </aside>
    );
}

