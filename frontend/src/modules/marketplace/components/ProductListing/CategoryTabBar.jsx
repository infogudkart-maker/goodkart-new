import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { MAIN_CATEGORIES } from '@/modules/shared/config/categories';

// How many category tabs to show inline before collapsing the rest into "More",
// matching the Women / Men / Kids / Home / All Brands / More pattern from the
// Nykaa reference.
const VISIBLE_COUNT = 7;

export default function CategoryTabBar({ selectedCategory }) {
    const navigate = useNavigate();
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef(null);

    const visibleCategories = MAIN_CATEGORIES.slice(0, VISIBLE_COUNT);
    const overflowCategories = MAIN_CATEGORIES.slice(VISIBLE_COUNT);
    const isOverflowActive = overflowCategories.includes(selectedCategory);

    useEffect(() => {
        if (!moreOpen) return;
        const handleClickOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [moreOpen]);

    const goToCategory = (cat) => {
        setMoreOpen(false);
        navigate(`/products?category=${encodeURIComponent(cat)}`);
    };

    return (
        <nav className="category-tab-bar">
            <div className="category-tab-scroll">
                <button
                    className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`}
                    onClick={() => navigate('/products')}
                >
                    All
                </button>
                {visibleCategories.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => goToCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            {/* Rendered as a sibling of the scrollable tab row (not inside it) —
                that row has overflow-x:auto, which per the CSS spec forces its
                overflow-y to 'auto' as well, clipping any absolutely-positioned
                dropdown that tries to open below it. Keeping the "More" button
                and its panel outside that scroller avoids the clipping entirely
                and pins it in place while the tabs scroll underneath it. */}
            {overflowCategories.length > 0 && (
                <div className="category-tab-more" ref={moreRef}>
                    <button
                        className={`category-tab category-tab-more-btn ${isOverflowActive ? 'active' : ''} ${moreOpen ? 'open' : ''}`}
                        onClick={() => setMoreOpen(o => !o)}
                    >
                        More <ChevronDown size={15} />
                    </button>
                    {moreOpen && (
                        <div className="category-tab-more-panel">
                            {overflowCategories.map(cat => (
                                <button
                                    key={cat}
                                    className={`category-tab-more-item ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => goToCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
