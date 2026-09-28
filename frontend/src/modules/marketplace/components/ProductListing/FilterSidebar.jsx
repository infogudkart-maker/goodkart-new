import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { MAIN_CATEGORIES, getSubcategories } from '@/modules/shared/config/categories';
import { VARIANT_CONFIGS } from '@/modules/shared/config/productVariants';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.PROD
    ? (import.meta.env.VITE_API_BASE_URL || 'https://sellsathi-refactored.onrender.com')
    : 'http://localhost:5000';

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50];

// Small color-name -> swatch mapping for the Color filter. Falls back to a
// neutral dot with the name shown as text when a preset isn't in the map.
const COLOR_SWATCHES = {
    black: '#111111', white: '#ffffff', silver: '#c0c0c0', 'space gray': '#5f6368',
    gold: '#d4af37', blue: '#2563eb', red: '#dc2626', green: '#16a34a',
    grey: '#9ca3af', gray: '#9ca3af', navy: '#1e3a8a', brown: '#7c4a2d',
    beige: '#e8dcc8', pink: '#ec4899', yellow: '#eab308', purple: '#9333ea',
    'multi-color': 'conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)',
    fair: '#f3d9c0', medium: '#d2a679', dark: '#8d5524', universal: '#d1d5db',
    nude: '#e3bc9a', natural: '#e8dcc8'
};

const swatchFor = (name) => COLOR_SWATCHES[name?.toLowerCase()] || '#d1d5db';

export default function FilterSidebar({
    selectedCategory,
    setSelectedCategory,
    selectedSubcategories,
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
    products = [],
    clearAllFilters
}) {
    const navigate = useNavigate();
    const [customCategories, setCustomCategories] = useState([]);

    // Which top-level accordion sections are open, Nykaa-style (click a section
    // header to expand/collapse it). Categories starts open since it doubles as
    // the primary category nav; the rest start collapsed.
    const [openSections, setOpenSections] = useState({
        categories: true,
        size: false,
        price: false,
        discount: false,
        color: false,
        occasion: false,
        material: false,
        availability: false
    });

    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

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

    // Open the Category section whenever a subcategory is already selected
    // (e.g. arriving via a URL with ?subcategory=...) so it's not hidden.
    useEffect(() => {
        if (selectedCategory !== 'All' && selectedSubcategories.length > 0) {
            setOpenSections(prev => ({ ...prev, categories: true }));
        }
    }, [selectedCategory, selectedSubcategories]);

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        setSelectedSubcategories([]);
        navigate(`/products?category=${encodeURIComponent(cat)}`);
    };

    // Once a main category is selected (via the top tab bar or this list),
    // the Category section switches to showing THAT category's own
    // subcategories (e.g. Topwear / Bottomwear / Ethnic Wear... for Fashion
    // (Women)) instead of repeating the full list of main categories —
    // same pattern as Nykaa's sidebar. Works for every main category, not
    // just one, since it's driven off the shared categories config.
    const activeSubcategories = useMemo(
        () => selectedCategory === 'All' ? [] : getSubcategories(selectedCategory),
        [selectedCategory]
    );

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

    const toggleInList = (list, setList, value) => {
        setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    };

    // Size / Color / Material / Occasion are attributes of a specific category's
    // products, so they only make sense once a category is picked. Sizes and
    // colors use the curated presets sellers pick from (VARIANT_CONFIGS);
    // Material and Occasion are read from whatever values sellers actually set
    // on products in this category, so the filter never shows an option with
    // zero matching products.
    const categoryProducts = useMemo(
        () => selectedCategory === 'All' ? [] : products.filter(p => p.category === selectedCategory),
        [products, selectedCategory]
    );

    const variantConfig = VARIANT_CONFIGS[selectedCategory];

    const sizeOptions = variantConfig?.defaultSizes || [];

    const colorOptions = variantConfig?.colorPresets || [];

    const materialOptions = useMemo(() => {
        const vals = new Set();
        categoryProducts.forEach(p => { if (p.specifications?.Material) vals.add(p.specifications.Material); });
        return Array.from(vals).sort();
    }, [categoryProducts]);

    const occasionOptions = useMemo(() => {
        const vals = new Set();
        categoryProducts.forEach(p => { if (p.specifications?.Occasion) vals.add(p.specifications.Occasion); });
        return Array.from(vals).sort();
    }, [categoryProducts]);

    const showAttributeFilters = selectedCategory !== 'All';
    const hasActiveFilters = selectedCategory !== 'All' || selectedSubcategories.length > 0 || priceRange < 200000 ||
        stockFilter !== 'all' || selectedSizes.length > 0 || selectedColors.length > 0 ||
        selectedMaterials.length > 0 || selectedOccasions.length > 0 || minDiscount > 0;

    return (
        <aside className="filters-sidebar-pro glass-card">
            <div className="sidebar-header-compact">
                <h3 className="sidebar-title">Filters</h3>
                <button
                    className={`clear-filters-btn ${!hasActiveFilters ? 'disabled' : ''}`}
                    onClick={hasActiveFilters ? clearAllFilters : undefined}
                    disabled={!hasActiveFilters}
                >
                    <RotateCcw size={13} strokeWidth={2.5} /> Reset
                </button>
            </div>

            {/* Categories accordion, with collapsible subcategories per-category */}
            <div className="filter-accordion">
                <button className="filter-accordion-header" onClick={() => toggleSection('categories')}>
                    <span>Category</span>
                    <ChevronDown size={17} className={`accordion-chevron ${openSections.categories ? 'open' : ''}`} />
                </button>
                {openSections.categories && (
                    <div className="filter-accordion-body">
                        <div className="category-list-pro">
                            <button
                                className={selectedCategory === 'All' ? 'active' : ''}
                                onClick={() => {
                                    setSelectedCategory('All');
                                    setSelectedSubcategories([]);
                                    navigate('/products');
                                }}
                            >
                                All Products
                            </button>
                        </div>

                        {selectedCategory === 'All' ? (
                            // Nothing picked yet — show every main category to choose from,
                            // same as the top tab bar's "More" list.
                            <div className="category-list-pro" style={{ marginTop: '6px' }}>
                                {[...MAIN_CATEGORIES, ...customCategories].map(cat => (
                                    <button
                                        key={cat}
                                        className="category-btn"
                                        onClick={() => handleCategoryClick(cat)}
                                    >
                                        <span>{cat}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            // A category is active — show ITS subcategories only
                            // (e.g. Topwear / Bottomwear / Ethnic Wear... for Fashion (Women)).
                            activeSubcategories.length > 0 && (
                                <div className="subcategory-dropdown no-border" style={{ marginTop: '6px' }}>
                                    {activeSubcategories.map(sub => (
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
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Size accordion — only once a category with a size taxonomy is picked */}
            {showAttributeFilters && sizeOptions.length > 0 && (
                <div className="filter-accordion">
                    <button className="filter-accordion-header" onClick={() => toggleSection('size')}>
                        <span>Size</span>
                        <ChevronDown size={17} className={`accordion-chevron ${openSections.size ? 'open' : ''}`} />
                    </button>
                    {openSections.size && (
                        <div className="filter-accordion-body">
                            <div className="size-pill-grid">
                                {sizeOptions.map(size => (
                                    <button
                                        key={size}
                                        className={`size-pill ${selectedSizes.includes(size) ? 'active' : ''}`}
                                        onClick={() => toggleInList(selectedSizes, setSelectedSizes, size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Price accordion */}
            <div className="filter-accordion">
                <button className="filter-accordion-header" onClick={() => toggleSection('price')}>
                    <span>Price</span>
                    <ChevronDown size={17} className={`accordion-chevron ${openSections.price ? 'open' : ''}`} />
                </button>
                {openSections.price && (
                    <div className="filter-accordion-body">
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
                )}
            </div>

            {/* Discount accordion */}
            <div className="filter-accordion">
                <button className="filter-accordion-header" onClick={() => toggleSection('discount')}>
                    <span>Discount</span>
                    <ChevronDown size={17} className={`accordion-chevron ${openSections.discount ? 'open' : ''}`} />
                </button>
                {openSections.discount && (
                    <div className="filter-accordion-body">
                        <div className="sort-options-pro">
                            <label className="radio-label">
                                <input type="radio" name="discount" checked={minDiscount === 0} onChange={() => setMinDiscount(0)} />
                                <span>All</span>
                            </label>
                            {DISCOUNT_OPTIONS.map(pct => (
                                <label key={pct} className="radio-label">
                                    <input type="radio" name="discount" checked={minDiscount === pct} onChange={() => setMinDiscount(pct)} />
                                    <span>{pct}% and above</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Color accordion */}
            {showAttributeFilters && colorOptions.length > 0 && (
                <div className="filter-accordion">
                    <button className="filter-accordion-header" onClick={() => toggleSection('color')}>
                        <span>Color</span>
                        <ChevronDown size={17} className={`accordion-chevron ${openSections.color ? 'open' : ''}`} />
                    </button>
                    {openSections.color && (
                        <div className="filter-accordion-body">
                            <div className="color-swatch-grid">
                                {colorOptions.map(color => (
                                    <button
                                        key={color}
                                        className={`color-swatch-btn ${selectedColors.includes(color) ? 'active' : ''}`}
                                        onClick={() => toggleInList(selectedColors, setSelectedColors, color)}
                                        title={color}
                                    >
                                        <span className="color-swatch-dot" style={{ background: swatchFor(color) }} />
                                        <span className="color-swatch-label">{color}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Occasion accordion — data-driven from products actually in this category */}
            {showAttributeFilters && occasionOptions.length > 0 && (
                <div className="filter-accordion">
                    <button className="filter-accordion-header" onClick={() => toggleSection('occasion')}>
                        <span>Occasion</span>
                        <ChevronDown size={17} className={`accordion-chevron ${openSections.occasion ? 'open' : ''}`} />
                    </button>
                    {openSections.occasion && (
                        <div className="filter-accordion-body">
                            <div className="subcategory-dropdown no-border">
                                {occasionOptions.map(val => (
                                    <label key={val} className="subcategory-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedOccasions.includes(val)}
                                            onChange={() => toggleInList(selectedOccasions, setSelectedOccasions, val)}
                                        />
                                        <span>{val}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Material accordion — data-driven from products actually in this category */}
            {showAttributeFilters && materialOptions.length > 0 && (
                <div className="filter-accordion">
                    <button className="filter-accordion-header" onClick={() => toggleSection('material')}>
                        <span>Material</span>
                        <ChevronDown size={17} className={`accordion-chevron ${openSections.material ? 'open' : ''}`} />
                    </button>
                    {openSections.material && (
                        <div className="filter-accordion-body">
                            <div className="subcategory-dropdown no-border">
                                {materialOptions.map(val => (
                                    <label key={val} className="subcategory-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedMaterials.includes(val)}
                                            onChange={() => toggleInList(selectedMaterials, setSelectedMaterials, val)}
                                        />
                                        <span>{val}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Availability accordion */}
            <div className="filter-accordion">
                <button className="filter-accordion-header" onClick={() => toggleSection('availability')}>
                    <span>Availability</span>
                    <ChevronDown size={17} className={`accordion-chevron ${openSections.availability ? 'open' : ''}`} />
                </button>
                {openSections.availability && (
                    <div className="filter-accordion-body">
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
                )}
            </div>
        </aside>
    );
}
