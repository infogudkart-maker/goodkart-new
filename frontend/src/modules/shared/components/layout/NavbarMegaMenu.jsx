import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SUBCATEGORIES, ALL_SUBCATEGORIES } from '@/modules/shared/config/categories';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';

/**
 * NavbarMegaMenu — the full-width dropdown panel rendered beneath the category row.
 * Extracted from Navbar.jsx to keep that file under 300 lines.
 *
 * Props:
 *   activeMegaMenu        - currently active category key (string)
 *   activeSubCategory     - index of the highlighted sub-category
 *   setActiveSubCategory  - setter
 *   setActiveMegaMenu     - setter (pass null to close)
 *   showAllSubcategories  - bool
 *   setShowAllSubcategories - setter
 *   dynamicMegaData       - fetched product data keyed by category
 */
export default function NavbarMegaMenu({
    activeMegaMenu,
    activeSubCategory,
    setActiveSubCategory,
    setActiveMegaMenu,
    showAllSubcategories,
    setShowAllSubcategories,
    dynamicMegaData,
}) {
    const navigate = useNavigate();
    if (!activeMegaMenu) return null;

    let subList = (showAllSubcategories ? ALL_SUBCATEGORIES : SUBCATEGORIES)[activeMegaMenu] || [];
    
    // For 'Others' category, use dynamic subcategories (custom categories) from products
    if (activeMegaMenu === 'Others' && dynamicMegaData['Others']?.categories?.length > 0) {
        subList = dynamicMegaData['Others'].categories.map(c => c.name);
    }

    const handleSubCategoryClick = (category, subcategory) => {
        setActiveMegaMenu(null);
        navigate(`/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
    };

    const currentSubName = subList[activeSubCategory];
    const currentItems = dynamicMegaData[activeMegaMenu]?.categories?.find(
        c => c.name?.toLowerCase() === currentSubName?.toLowerCase()
    )?.items;

    return (
        <div
            className="mega-menu animate-slide-down"
            onMouseEnter={() => setActiveMegaMenu(activeMegaMenu)}
            onMouseLeave={() => setActiveMegaMenu(null)}
        >
            <div className="container mega-menu-content">
                {/* Sidebar – subcategory list */}
                <div className="mega-sidebar">
                    <h3
                        onClick={() => { navigate(`/products?category=${encodeURIComponent(activeMegaMenu)}`); setActiveMegaMenu(null); }}
                        style={{ cursor: 'pointer' }}
                    >
                        {activeMegaMenu}
                    </h3>
                    <div className="sidebar-items">
                        {subList.map((subcategory, idx) => (
                            <button
                                key={subcategory}
                                className={activeSubCategory === idx ? 'active' : ''}
                                onMouseEnter={() => setActiveSubCategory(idx)}
                                onClick={() => handleSubCategoryClick(activeMegaMenu, subcategory)}
                            >
                                {subcategory} <ArrowRight size={14} className="arrow" />
                            </button>
                        ))}
                        {!showAllSubcategories && (
                            <button
                                className="other-btn"
                                onClick={e => { e.stopPropagation(); setShowAllSubcategories(true); }}
                            >
                                Other <ArrowRight size={14} className="arrow" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main panel – product grid for the active sub-category */}
                <div className="mega-main">
                    {currentSubName ? (
                        <>
                            <div className="mega-title-row"><h4>{currentSubName}</h4></div>
                            {currentItems?.length > 0 ? (
                                <div className="mega-grid">
                                    {currentItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="mega-item-card"
                                                onClick={() => { navigate(`/product/${item.id}`); setActiveMegaMenu(null); }}
                                            >
                                                <div className="img-box">
                                                    <img src={item.images?.[0] || item.image || item.imageUrl} alt={item.name || item.title || 'Product'} />
                                                </div>
                                                <div className="item-info">
                                                    <h5 style={{ 
                                                        display: '-webkit-box', 
                                                        visibility: 'visible', 
                                                        opacity: 1,
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#111827',
                                                        lineHeight: '1.4',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        minHeight: '35px',
                                                        margin: 0,
                                                        padding: 0
                                                    }}>{item.name || item.title || 'Product'}</h5>
                                                    <div style={{ marginTop: '4px' }}>
                                                        <PriceDisplay 
                                                            product={item} 
                                                            size="xs" 
                                                            showGSTIndicator={false}
                                                            showBadge={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="mega-empty-state">
                                    <p>Browse {currentSubName} products</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            navigate(`/products?category=${encodeURIComponent(activeMegaMenu)}&subcategory=${encodeURIComponent(currentSubName)}`);
                                            setActiveMegaMenu(null);
                                        }}
                                    >
                                        Browse All {currentSubName}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}

                    {/* Footer */}
                    <div className="mega-footer">
                        <div className="popular-tags">
                            <span className="label">Popular Tags:</span>
                            {dynamicMegaData[activeMegaMenu]?.popular?.map(tag => (
                                <Link key={tag} to={`/products?search=${tag}`} className="tag" onClick={() => setActiveMegaMenu(null)}>{tag}</Link>
                            ))}
                        </div>
                        <Link
                            to={`/products?category=${encodeURIComponent(activeMegaMenu)}`}
                            className="explore-link"
                            onClick={() => setActiveMegaMenu(null)}
                        >
                            Explore {activeMegaMenu} <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

