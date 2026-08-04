import { X, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MAIN_CATEGORIES, SPECIAL_CATEGORIES, SUBCATEGORIES } from '@/modules/shared/config/categories';
import './CategorySidebar.css';

export default function CategorySidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        checkUser();
        const handleUserChange = () => checkUser();
        window.addEventListener('userDataChanged', handleUserChange);

        return () => {
            window.removeEventListener('userDataChanged', handleUserChange);
        };
    }, []);

    const handleSignInClick = () => {
        onClose();
        window.dispatchEvent(new CustomEvent('openLoginModal'));
    };

    const handleCategoryClick = (category) => {
        navigate(`/products?category=${encodeURIComponent(category)}`);
        onClose();
    };

    const handleSubcategoryClick = (category, subcategory) => {
        navigate(`/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div 
                    className="category-sidebar-overlay" 
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`category-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Header with User Greeting */}
                <div className="category-sidebar-header">
                    {!user ? (
                        <div className="header-user-section">
                            <div className="user-greeting">
                                <User size={20} />
                                <span>Hello, Sign in</span>
                            </div>
                            <button className="signin-btn-header" onClick={handleSignInClick}>
                                Sign in to your account
                            </button>
                        </div>
                    ) : (
                        <div className="header-user-section logged-in">
                            <div className="user-greeting">
                                <div className="user-avatar">
                                    {(localStorage.getItem('userName') || user.fullName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info">
                                    <span className="greeting-text">Hello,</span>
                                    <span className="user-name">{localStorage.getItem('userName') || user.fullName || 'User'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="category-sidebar-content">
                    {/* Special Categories Section */}
                    <div className="category-section">
                        <h3 className="section-title">Trending</h3>
                        {SPECIAL_CATEGORIES.map(cat => {
                            let path = "/deals";
                            if (cat === "New Arrivals") path = "/new-arrivals";
                            if (cat === "Trending") path = "/trending";

                            return (
                                <button
                                    key={cat}
                                    className="category-item special"
                                    onClick={() => {
                                        navigate(path);
                                        onClose();
                                    }}
                                >
                                    <span>{cat}</span>
                                    <ChevronRight size={18} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Categories Section */}
                    <div className="category-section">
                        <h3 className="section-title">Shop by Category</h3>
                        {MAIN_CATEGORIES.map(cat => {
                            const hasSubcategories = SUBCATEGORIES[cat] && SUBCATEGORIES[cat].length > 0;

                            return (
                                <div key={cat} className="category-group">
                                    <button
                                        className="category-item"
                                        onClick={() => handleCategoryClick(cat)}
                                    >
                                        <span>{cat}</span>
                                        {hasSubcategories && <ChevronRight size={18} />}
                                    </button>

                                    {/* Subcategories */}
                                    {hasSubcategories && (
                                        <div className="subcategory-list">
                                            {SUBCATEGORIES[cat].map(subcat => (
                                                <button
                                                    key={subcat}
                                                    className="subcategory-item"
                                                    onClick={() => handleSubcategoryClick(cat, subcat)}
                                                >
                                                    {subcat}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

