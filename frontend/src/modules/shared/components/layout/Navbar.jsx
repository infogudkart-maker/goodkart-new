import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, ChevronDown, Heart, ShoppingBag, Menu } from 'lucide-react';
import AuthModal from '@/modules/auth/components/AuthModal';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, auth } from '@/modules/shared/config/firebase';
import { listenToCart } from '@/modules/shared/utils/cartUtils';
import { listenToWishlist } from '@/modules/shared/utils/wishlistUtils';
import { MAIN_CATEGORIES, SPECIAL_CATEGORIES, SUBCATEGORIES, ALL_CATEGORIES } from '@/modules/shared/config/categories';
import { fetchWithCache } from '@/modules/shared/utils/firestoreCache';
import NavbarMegaMenu from './NavbarMegaMenu';
import CategorySidebar from './CategorySidebar';
import { authFetch } from '@/modules/shared/utils/api';
import CartNotification from '@/modules/shared/components/common/CartNotification';
import WishlistNotification from '@/modules/shared/components/common/WishlistNotification';
import './Navbar.css';

function GoodkartLogo() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/goodkart-logo.png" alt="" style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1, letterSpacing: '-0.5px', display: 'flex', flexDirection: 'column' }}>
                <span>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1800AD' }}>Good</span><span style={{ fontSize: '2rem', fontWeight: 400, color: '#5BB8FF' }}>kart</span>
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#1800AD', letterSpacing: '0.3px', marginTop: '2px', textAlign: 'center' }}>Good Deals. Good Life</span>
            </span>
        </div>
    );
}

export default function Navbar() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeMegaMenu, setActiveMegaMenu] = useState(null);
    const [activeSubCategory, setActiveSubCategory] = useState(0);
    const [showAllSubcategories, setShowAllSubcategories] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [dynamicMegaData, setDynamicMegaData] = useState({});
    const [isHoverLocked, setIsHoverLocked] = useState(false);
    const [customAdminCategories, setCustomAdminCategories] = useState([]);
    const [showCartNotification, setShowCartNotification] = useState(false);
    const [cartProductName, setCartProductName] = useState('');
    const [showWishlistNotification, setShowWishlistNotification] = useState(false);
    const [wishlistProductName, setWishlistProductName] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const isSellerDashboard = location.pathname.startsWith('/seller/dashboard');
    const menuRef = useRef(null);
    const profileRef = useRef(null);

    // Don't auto-collapse when navigating - let user control it
    // useEffect(() => {
    //     if (location.pathname !== '/') {
    //         setShowAllSubcategories(false);
    //     }
    // }, [location.pathname]);

    const calculateAge = (dob) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        // Fetch custom admin categories using the correct API base
        const API_BASE = import.meta.env.PROD
            ? (import.meta.env.VITE_API_BASE_URL || 'https://sellsathi-refactored.onrender.com')
            : 'http://localhost:5000';
        fetch(`${API_BASE}/admin/config/public`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.config?.categoryGstRates) {
                    const custom = Object.keys(d.config.categoryGstRates).filter(k => !MAIN_CATEGORIES.includes(k) && k !== 'Others');
                    setCustomAdminCategories(custom);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const fetchMegaData = async () => {
            try {
                // Use cache with 15 minute TTL to reduce Firestore reads
                const products = await fetchWithCache(
                    'navbar_products',
                    async () => {
                        // Fetch more products to ensure we get all categories
                        const q = query(collection(db, "products"), limit(100));
                        const snap = await getDocs(q);
                        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    },
                    15 * 60 * 1000 // 15 minutes cache
                );

                // Only proceed if we have products from database
                if (products.length === 0) {
                    setDynamicMegaData({});
                    return;
                }

                const mega = {};
                [...MAIN_CATEGORIES, ...SPECIAL_CATEGORIES, ...customAdminCategories].forEach(cat => {
                    let catProducts;
                    if (cat === "Today's Deals") {
                        catProducts = products.filter(p => p.discount || p.oldPrice);
                    } else if (cat === "New Arrivals") {
                        catProducts = [...products].reverse().slice(0, 8);
                    } else if (cat === "Trending") {
                        catProducts = products.filter(p => (p.rating || 0) >= 4.5);
                    } else if (cat === "Fashion (Men)") {
                        catProducts = products.filter(p =>
                            p.category === "Fashion (Men)" ||
                            p.category === "Men's Fashion" ||
                            p.category === "Fashion" ||
                            p.category === "Mens Fashion" ||
                            p.category === "Men Fashion" ||
                            p.subCategory?.toLowerCase().includes('men') ||
                            p.name?.toLowerCase().includes('men')
                        );
                    } else if (cat === "Fashion (Women)") {
                        catProducts = products.filter(p =>
                            p.category === "Fashion (Women)" ||
                            p.category === "Women's Fashion" ||
                            p.category === "Fashion" ||
                            p.category === "Womens Fashion" ||
                            p.category === "Women Fashion" ||
                            p.subCategory?.toLowerCase().includes('women') ||
                            p.name?.toLowerCase().includes('women')
                        );
                    } else if (cat === "Books & Stationery") {
                        catProducts = products.filter(p =>
                            p.category === "Books & Stationery" ||
                            p.category === "Books" ||
                            p.category === "Stationery" ||
                            p.subCategory?.toLowerCase().includes('book') ||
                            p.subCategory?.toLowerCase().includes('stationery')
                        );
                    } else if (cat === "Food & Beverages") {
                        catProducts = products.filter(p =>
                            p.category === "Food & Beverages" ||
                            p.category === "Food" ||
                            p.category === "Beverages" ||
                            p.subCategory?.toLowerCase().includes('food') ||
                            p.subCategory?.toLowerCase().includes('beverage')
                        );
                    } else if (cat === "Handicrafts") {
                        catProducts = products.filter(p =>
                            p.category === "Handicrafts" ||
                            p.category === "Handicraft" ||
                            p.subCategory?.toLowerCase().includes('handicraft') ||
                            p.subCategory?.toLowerCase().includes('handmade')
                        );
                    } else {
                        // For other categories, try exact match first, then fuzzy match
                        catProducts = products.filter(p =>
                            p.category === cat ||
                            p.category?.toLowerCase().includes(cat.toLowerCase()) ||
                            p.subCategory?.toLowerCase().includes(cat.toLowerCase())
                        );
                    }

                    const subGroups = {};
                    catProducts.forEach(p => {
                        const sub = p.subCategory || 'Featured';
                        if (!subGroups[sub]) subGroups[sub] = [];
                        subGroups[sub].push(p);
                    });

                    // Create mega menu data only if products exist for this category
                    if (catProducts.length > 0) {
                        // Get the predefined subcategory list for this category
                        const predefinedSubs = SUBCATEGORIES[cat] || [];

                        // Build categories array: First add predefined subcategories that have products
                        const orderedCategories = [];
                        const addedSubcategories = new Set();
                        
                        predefinedSubs.forEach(subName => {
                            // Try exact match first
                            let items = subGroups[subName] || [];
                            
                            // If no exact match, try case-insensitive match
                            if (items.length === 0) {
                                const matchingKey = Object.keys(subGroups).find(
                                    key => key.toLowerCase() === subName.toLowerCase()
                                );
                                if (matchingKey) {
                                    items = subGroups[matchingKey];
                                    addedSubcategories.add(matchingKey.toLowerCase());
                                }
                            } else {
                                addedSubcategories.add(subName.toLowerCase());
                            }
                            
                            // Only add to ordered categories if there are products
                            if (items.length > 0) {
                                orderedCategories.push({
                                    id: subName.toLowerCase().replace(/\s+/g, '-'),
                                    name: subName,
                                    items: items.slice(0, 4)
                                });
                            }
                        });

                        // Then add any database subcategories not in predefined list
                        Object.keys(subGroups).forEach(sub => {
                            // Check if already added (case-insensitive)
                            if (!addedSubcategories.has(sub.toLowerCase()) && subGroups[sub].length > 0) {
                                orderedCategories.push({
                                    id: sub.toLowerCase().replace(/\s+/g, '-'),
                                    name: sub,
                                    items: subGroups[sub].slice(0, 4)
                                });
                                addedSubcategories.add(sub.toLowerCase());
                            }
                        });

                        mega[cat] = {
                            categories: orderedCategories,
                            popular: Array.from(new Set(catProducts.flatMap(p => p.tags || []))).slice(0, 4)
                        };
                    }
                    // If no products, don't create mega menu data - category will still be clickable but won't show dropdown
                });
                setDynamicMegaData(mega);
            } catch (err) {
                console.error("Error fetching mega menu data:", err);
            }
        };
        fetchMegaData();
    }, []);

    useEffect(() => {
        const unsubscribeCart = listenToCart((items) => {
            const count = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
            setCartCount(count);
        });

        const unsubscribeWishlist = listenToWishlist((items) => {
            setWishlistCount(items.length);
        });

        // Listen for cart add event to show notification
        const handleCartAdded = (event) => {
            const productName = event.detail?.productName || '';
            setCartProductName(productName);
            setShowCartNotification(true);
            // Auto-close after 5 seconds
            setTimeout(() => {
                setShowCartNotification(false);
            }, 5000);
        };
        window.addEventListener('cartItemAdded', handleCartAdded);

        // Listen for wishlist add event to show notification
        const handleWishlistAdded = (event) => {
            const productName = event.detail?.productName || '';
            setWishlistProductName(productName);
            setShowWishlistNotification(true);
            // Auto-close after 5 seconds
            setTimeout(() => {
                setShowWishlistNotification(false);
            }, 5000);
        };
        window.addEventListener('wishlistItemAdded', handleWishlistAdded);

        return () => {
            unsubscribeCart();
            unsubscribeWishlist();
            window.removeEventListener('cartItemAdded', handleCartAdded);
            window.removeEventListener('wishlistItemAdded', handleWishlistAdded);
        };
    }, []);

    useEffect(() => {
        const checkUser = () => {
            const isSellerRoute = location.pathname.startsWith('/seller');
            const key = isSellerRoute ? 'seller_user' : 'user';
            const userData = localStorage.getItem(key);
            
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    
                    // Sync loginContext if it's missing or contradictory
                    const currentCtx = sessionStorage.getItem('loginContext');
                    if (isSellerRoute && currentCtx !== 'SELLER') {
                        sessionStorage.setItem('loginContext', 'SELLER');
                    } else if (!isSellerRoute && currentCtx === 'SELLER') {
                        // If we are on a consumer route but context is SELLER, 
                        // check if we have a consumer user to show.
                        const consumerData = localStorage.getItem('user');
                        if (consumerData) {
                            sessionStorage.setItem('loginContext', 'CONSUMER');
                            setUser(JSON.parse(consumerData));
                            return;
                        }
                    }

                    setUser(parsed);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        checkUser();

        // Retry once after 500ms to handle race condition where localStorage
        // is set slightly after navigation (e.g. after phone/email login)
        const retryTimer = setTimeout(checkUser, 500);

        const handleUserChange = () => checkUser();
        window.addEventListener('userDataChanged', handleUserChange);
        window.addEventListener('storage', handleUserChange);
        const handleOpenLogin = () => setIsLoginModalOpen(true);
        window.addEventListener('openLoginModal', handleOpenLogin);

        return () => {
            clearTimeout(retryTimer);
            window.removeEventListener('userDataChanged', handleUserChange);
            window.removeEventListener('storage', handleUserChange);
            window.removeEventListener('openLoginModal', handleOpenLogin);
        };
    }, [location.pathname]);

    // Independent UI listeners
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMegaMenu(null);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out from Firebase:', error);
        }
        
        const isSellerRoute = location.pathname.startsWith('/seller');
        if (isSellerRoute) {
            localStorage.removeItem('seller_user');
            localStorage.removeItem('seller_userName');
            localStorage.removeItem('seller_dob');
            sessionStorage.removeItem('loginContext');
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('userName');
            localStorage.removeItem('dob');
            sessionStorage.removeItem('loginContext');
        }
        
        setUser(null);
        setIsProfileOpen(false);
        window.dispatchEvent(new CustomEvent('userDataChanged'));
        navigate(isSellerRoute ? '/seller' : '/');
    };

    const handleLoginSuccess = () => {
        setIsLoginModalOpen(false);
        setIsProfileOpen(false);
    };

    const handleMegaMenuToggle = (cat) => {
        if (activeMegaMenu === cat) {
            setActiveMegaMenu(null);
        } else {
            setActiveMegaMenu(cat);
            setActiveSubCategory(0);
        }
    };

    const handleSubCategoryClick = (category, subcategory) => {
        setActiveMegaMenu(null);
        navigate(`/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
    };

    const handleItemClick = (category, subCategory, item) => {
        setActiveMegaMenu(null);
        navigate(`/products?category=${category}&sub=${subCategory}&item=${item}`);
    };

    const handleBecomeSellerClick = () => {
        // ALWAYS open seller page in new tab on Home Page Navbar,
        // even if user is a SELLER in the database.
        // They must login from /#/seller to access the Seller Dashboard.
        window.open(`${window.location.origin}${window.location.pathname}#/seller`, '_blank');
    };

    return (
        <>
            <nav className="navbar-container" ref={menuRef}>
                <div className="main-nav-wrapper">
                    <div className="container main-nav">
                        {location.pathname === '/' ? (
                            <div className="brand-logo" style={{ cursor: 'default' }}>
                                <GoodkartLogo />
                            </div>
                        ) : (
                            <Link to="/" className="brand-logo">
                                <GoodkartLogo />
                            </Link>
                        )}

                        {!location.pathname.startsWith('/checkout') && (
                            <>
                                <div className="nav-search">
                                    <Search size={18} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search products, brands and more..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                const params = new URLSearchParams();
                                                params.set('search', e.target.value.trim());
                                                navigate(`/products?${params.toString()}`);
                                                e.target.blur();
                                            }
                                        }}
                                    />
                                </div>

                                {user && user.role !== 'ADMIN' ? (
                                    <button
                                        onClick={handleBecomeSellerClick}
                                        className="btn btn-seller"
                                    >
                                        Seller
                                    </button>
                                ) : !user ? (
                                    <button
                                        onClick={handleBecomeSellerClick}
                                        className="btn btn-seller"
                                    >
                                        Seller
                                    </button>
                                ) : null}
                            </>
                        )}

                        <div className="nav-actions">
                            <Link
                                to={user ? "/wishlist" : "#"}
                                onClick={(e) => {
                                    if (!user) {
                                        e.preventDefault();
                                        setIsLoginModalOpen(true);
                                    }
                                }}
                                className="btn btn-secondary icon-btn wishlist-btn-nav"
                            >
                                <Heart size={20} />
                                {user && wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
                            </Link>

                            <Link
                                to={user ? "/cart" : "#"}
                                onClick={(e) => {
                                    if (!user) {
                                        e.preventDefault();
                                        setIsLoginModalOpen(true);
                                    }
                                }}
                                className="btn btn-secondary icon-btn cart-btn-nav"
                            >
                                <ShoppingCart size={20} />
                                {user && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>

                            {user ? (
                                <div className="profile-dropdown-container" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="btn btn-secondary icon-btn"
                                    >
                                        <User size={20} />
                                    </button>
                                    {isProfileOpen && (
                                        <div className="profile-menu">
                                            <div className="menu-header">
                                                <div className="avatar">{(user.fullName || 'U').charAt(0).toUpperCase()}</div>
                                                <div className="info">
                                                    <p className="name">{localStorage.getItem(location.pathname.startsWith('/seller') ? 'seller_userName' : 'userName') || user.fullName || 'User'}</p>
                                                    <p className="email">{user.phone ? (user.phone.startsWith('+') ? user.phone : '+91' + user.phone) : ''}</p>
                                                </div>
                                            </div>
                                            <div className="menu-items">
                                                {!isSellerDashboard && user?.role !== 'SELLER' && (
                                                    <button onClick={() => {
                                                        navigate('/dashboard');
                                                        setIsProfileOpen(false);
                                                    }}>
                                                        <ShoppingBag size={16} /> My Dashboard
                                                    </button>
                                                )}
                                                <button onClick={() => { setIsLoginModalOpen(true); setIsProfileOpen(false); }}>
                                                    <User size={16} /> Switch Account
                                                </button>
                                                <button onClick={handleLogout} className="signout-btn">
                                                    <LogOut size={16} /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-secondary icon-btn">
                                    <User size={20} />
                                </button>
                            )}

                            {user && user.role === 'SELLER' && !isSellerDashboard && (
                                <button
                                    onClick={() => navigate('/seller/dashboard')}
                                    className="btn btn-seller"
                                    style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px' }}
                                >
                                    Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories section - Only visible on Home page */}
                {location.pathname === '/' && (
                    <div
                        className="sub-nav-wrapper"
                        style={{ display: 'block' }}
                    >
                        <div className="container">
                            {/* Row 1: All button + First 10 categories + More button */}
                            <div className="sub-nav sub-nav-row-1">
                                {/* All Categories Button */}
                                <button
                                    className="sub-nav-link all-categories-btn"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <Menu size={14} />
                                    All
                                </button>

                                {MAIN_CATEGORIES.slice(0, 10).map(cat => {
                                    const path = `/products?category=${cat}`;
                                    const isMega = !!SUBCATEGORIES[cat];

                                    return (
                                        <div key={cat} className="sub-nav-item">
                                            <button
                                                className={`sub-nav-link ${activeMegaMenu === cat ? 'active' : ''}`}
                                                onMouseEnter={() => {
                                                    // Only trigger hover if not locked
                                                    if (isMega && !isHoverLocked) {
                                                        setActiveMegaMenu(cat);
                                                        setActiveSubCategory(0);
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (isMega) {
                                                        // Open megamenu and lock hover for 2 seconds
                                                        setActiveMegaMenu(cat);
                                                        setActiveSubCategory(0);
                                                        setIsHoverLocked(true);
                                                        
                                                        // Unlock after 2 seconds
                                                        setTimeout(() => {
                                                            setIsHoverLocked(false);
                                                        }, 2000);
                                                    } else {
                                                        // If no megamenu, navigate to category page
                                                        navigate(path);
                                                    }
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    className="sub-nav-link more-categories-btn"
                                    onClick={() => setShowAllSubcategories(!showAllSubcategories)}
                                >
                                    {showAllSubcategories ? 'Less' : 'More'}
                                    <ChevronDown size={12} style={{ transform: showAllSubcategories ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', strokeWidth: 3 }} />
                                </button>
                            </div>

                            {/* Row 2: Remaining categories starting from Gifts & Customization (collapsible) */}
                            {showAllSubcategories && (
                                <div className="sub-nav sub-nav-row-2 animate-slide-down">
                                    {[...MAIN_CATEGORIES.slice(10), ...customAdminCategories].map(cat => {
                                        const path = `/products?category=${cat}`;
                                        const isMega = !!SUBCATEGORIES[cat];

                                        return (
                                            <div key={cat} className="sub-nav-item">
                                                <button
                                                    className={`sub-nav-link ${activeMegaMenu === cat ? 'active' : ''}`}
                                                    onMouseEnter={() => {
                                                        // Only trigger hover if not locked
                                                        if (isMega && !isHoverLocked) {
                                                            setActiveMegaMenu(cat);
                                                            setActiveSubCategory(0);
                                                        }
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (isMega) {
                                                            // Open megamenu and lock hover for 2 seconds
                                                            setActiveMegaMenu(cat);
                                                            setActiveSubCategory(0);
                                                            setIsHoverLocked(true);
                                                            
                                                            // Unlock after 2 seconds
                                                            setTimeout(() => {
                                                                setIsHoverLocked(false);
                                                            }, 2000);
                                                        } else {
                                                            // If no megamenu, navigate to category page
                                                            navigate(path);
                                                        }
                                                    }}
                                                >
                                                    {cat}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Row 3: Special categories */}
                            <div className="sub-nav sub-nav-row-3">
                                {SPECIAL_CATEGORIES.map(cat => {
                                    let path = "/deals";
                                    if (cat === "New Arrivals") path = "/new-arrivals";
                                    if (cat === "Trending") path = "/trending";

                                    return (
                                        <div key={cat} className="sub-nav-item">
                                            <Link
                                                to={path}
                                                className={`sub-nav-link special-category ${location.pathname === path ? 'active' : ''}`}
                                                onClick={() => setActiveMegaMenu(null)}
                                            >
                                                {cat}
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mega Menu Dropdown */}
                        <NavbarMegaMenu
                            activeMegaMenu={activeMegaMenu}
                            activeSubCategory={activeSubCategory}
                            setActiveSubCategory={setActiveSubCategory}
                            setActiveMegaMenu={setActiveMegaMenu}
                            showAllSubcategories={showAllSubcategories}
                            setShowAllSubcategories={setShowAllSubcategories}
                            dynamicMegaData={dynamicMegaData}
                        />
                    </div>
                )}
            </nav >

            {/* Category Sidebar */}
            <CategorySidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={handleLoginSuccess}
            />

            <CartNotification
                isOpen={showCartNotification}
                onClose={() => setShowCartNotification(false)}
                productName={cartProductName}
            />

            <WishlistNotification
                isOpen={showWishlistNotification}
                onClose={() => setShowWishlistNotification(false)}
                productName={wishlistProductName}
            />
        </>
    );
}


