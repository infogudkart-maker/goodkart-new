import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProductListing.css';
import { auth } from '@/modules/shared/config/firebase';
import { API_BASE } from '@/modules/shared/utils/api';
import { addToCart } from '@/modules/shared/utils/cartUtils';
import { addToWishlist, removeFromWishlist, listenToWishlist } from '@/modules/shared/utils/wishlistUtils';
import ReviewModal from '@/modules/shared/components/common/ReviewModal';
import QuickViewModal from '@/modules/shared/components/common/QuickViewModal';
import { fetchProductReviews } from '@/modules/shared/utils/reviewUtils';
import FilterSidebar from '../components/ProductListing/FilterSidebar';
import ProductGrid from '../components/ProductListing/ProductGrid';

export default function ProductListing() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [priceRange, setPriceRange] = useState(200000);
    const [sortBy, setSortBy] = useState('newest');
    const [stockFilter, setStockFilter] = useState('all'); // New stock filter state
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [productReviews, setProductReviews] = useState({});

    const location = useLocation();
    const navigate = useNavigate();

    // Add class to body for footer styling
    useEffect(() => {
        document.body.classList.add('product-listing-page');
        return () => {
            document.body.classList.remove('product-listing-page');
        };
    }, []);

    // Parse query params and handle subcategory selection
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cat = params.get('category');
        const subCats = params.getAll('subcategory');
        const subCat = subCats.length > 0 ? subCats : (params.get('sub') ? [params.get('sub')] : []);
        
        if (cat) {
            setSelectedCategory(cat.trim());
            setSelectedSubcategories(subCat.map(s => s.trim()));
        } else {
            setSelectedCategory('All');
            setSelectedSubcategories([]);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/products?limit=100`);
                if (!res.ok) throw new Error('Products API failed');
                const apiData = await res.json();
                let data = (apiData.products || []).map(p => {
                    if (!p.name && p.title) p.name = p.title;
                    return p;
                });
                setProducts(data);
                setLoading(false);
                // Lazy load reviews - fetch only first 10 products' reviews initially
                fetchReviewsForProducts(data.slice(0, 10));
            } catch (err) {
                console.warn('[ProductListing] API failed, falling back to Firestore:', err.message);
                try {
                    const { collection: col, getDocs: gd, query: q, limit: lim } = await import('firebase/firestore');
                    const { db: firestoreDb } = await import('@/modules/shared/config/firebase');
                    const snap = await gd(q(col(firestoreDb, 'products'), lim(50)));
                    let data = snap.docs.map(doc => {
                        const d = { id: doc.id, ...doc.data() };
                        if (!d.name && d.title) d.name = d.title;
                        return d;
                    });
                    setProducts(data);
                    setLoading(false);
                    fetchReviewsForProducts(data.slice(0, 10));
                } catch (fbErr) {
                    console.error('Both API and Firestore failed:', fbErr);
                    setProducts([]);
                    setLoading(false);
                }
            }
        };
        fetchProducts();
    }, []);

    const fetchReviewsForProducts = async (productsToFetch) => {
        const reviewPromises = productsToFetch.map(async (product) => {
            try {
                const { reviews, stats } = await fetchProductReviews(product.id);
                return { productId: product.id, reviews, stats };
            } catch (error) {
                console.error(`Failed to fetch reviews for product ${product.id}:`, error);
                return { productId: product.id, reviews: [], stats: { averageRating: 0, totalReviews: 0 } };
            }
        });

        try {
            const reviewResults = await Promise.all(reviewPromises);
            const reviewsMap = {};
            reviewResults.forEach(result => {
                reviewsMap[result.productId] = result;
            });
            setProductReviews(reviewsMap);
        } catch (error) {
            console.error('Error fetching product reviews:', error);
        }
    };

    useEffect(() => {
        let result = [...products];
        const params = new URLSearchParams(location.search);
        const searchQuery = params.get('search')?.toLowerCase();
        const itemName = params.get('item');

        if (searchQuery) {
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(searchQuery)) ||
                (p.category && p.category.toLowerCase().includes(searchQuery)) ||
                (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery))
            );
        }

        if (selectedCategory !== 'All') {
            result = result.filter(p => 
                p.category === selectedCategory ||
                p.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // selectedSubcategories is always synced from URL params, so use it as single source of truth
        if (selectedSubcategories.length > 0) {
            result = result.filter(p =>
                selectedSubcategories.includes(p.subCategory)
            );
        }

        if (itemName) {
            const queryName = itemName.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(queryName)) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(queryName)))
            );
        }

        result = result.filter(p => p.price <= priceRange);

        // Apply stock filter
        if (stockFilter === 'inStock') {
            result = result.filter(p => p.stock > 0 && p.status !== 'Out of Stock');
        } else if (stockFilter === 'outOfStock') {
            result = result.filter(p => p.stock === 0 || p.status === 'Out of Stock');
        }

        if (sortBy === 'priceLow') result.sort((a, b) => a.price - b.price);
        else if (sortBy === 'priceHigh') result.sort((a, b) => b.price - a.price);

        setFilteredProducts(result);
    }, [products, selectedCategory, selectedSubcategories, priceRange, sortBy, stockFilter, location.search]);

    useEffect(() => {
        const unsubscribe = listenToWishlist((items) => {
            setWishlist(items);
        });
        return () => { unsubscribe(); };
    }, []);

    const toggleWishlist = async (e, p) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const isSaved = wishlist.some(item => item.id === p.id);
        try {
            if (isSaved) { await removeFromWishlist(p.id); }
            else { await addToWishlist(p); }
        } catch (error) {
            console.error('Wishlist error:', error);
        }
    };

    const handleAddToCart = async (p) => {
        const res = await addToCart(p);
        if (res.success) {
            // Silently added - no popup
            window.dispatchEvent(new Event('cartUpdate'));
        }
    };

    const clearAllFilters = () => {
        setSelectedCategory('All');
        setSelectedSubcategories([]);
        setPriceRange(200000);
        setSortBy('newest');
        setStockFilter('all'); // Reset stock filter
        navigate('/products');
    };

    return (
        <div className="listing-wrapper" style={{ background: '#F8F9FA' }}>
            <div className="container">
                <div className="listing-layout">
                    <FilterSidebar
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        selectedSubcategories={selectedSubcategories}
                        setSelectedSubcategories={setSelectedSubcategories}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        stockFilter={stockFilter}
                        setStockFilter={setStockFilter}
                        clearAllFilters={clearAllFilters}
                    />

                    <ProductGrid
                        filteredProducts={filteredProducts}
                        loading={loading}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        setPriceRange={setPriceRange}
                        productReviews={productReviews}
                        wishlist={wishlist}
                        toggleWishlist={toggleWishlist}
                        handleAddToCart={handleAddToCart}
                        setSelectedProduct={setSelectedProduct}
                        setIsReviewModalOpen={setIsReviewModalOpen}
                        setSelectedQuickProduct={setSelectedQuickProduct}
                        setIsQuickViewOpen={setIsQuickViewOpen}
                        locationSearch={location.search}
                    />
                </div>
            </div>

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                productId={selectedProduct?.id}
                productName={selectedProduct?.name}
            />

            <QuickViewModal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={selectedQuickProduct}
                navigate={navigate}
            />
        </div>
    );
}

