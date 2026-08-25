import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { auth } from '@/modules/shared/config/firebase';
import { API_BASE, fetchWithTimeout } from '@/modules/shared/utils/api';
import { addToCart } from '@/modules/shared/utils/cartUtils';
import { addToWishlist, removeFromWishlist, listenToWishlist } from '@/modules/shared/utils/wishlistUtils';
import QuickViewModal from '@/modules/shared/components/common/QuickViewModal';
import LoadingSpinner from '@/modules/shared/components/common/LoadingSpinner';
import { fetchWithCache } from '@/modules/shared/utils/firestoreCache';
import { fetchProductReviews } from '@/modules/shared/utils/reviewUtils';

// Extracted Components
import HeroCarousel from '../components/Home/HeroCarousel';
import CategoryShowcase from '../components/Home/CategoryShowcase';
import ProductSection from '../components/Home/ProductSection';

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [latestProducts, setLatestProducts] = useState([]);
    const [dealsProducts, setDealsProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slowLoad, setSlowLoad] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [wishlist, setWishlist] = useState([]);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
    const [productReviews, setProductReviews] = useState({}); // Cache reviews for all products
    const navigate = useNavigate();

    useEffect(() => {
        // The backend is hosted on Render's free tier, which spins down when
        // idle — the first request after a while can take 20-60s to wake it
        // back up. That's normal, not a bug, but a bare spinner with no
        // explanation makes it look frozen. Swap in a more honest message
        // once it's been a few seconds so it's clear it's still working.
        setLoadError(null);
        setSlowLoad(false);
        const slowLoadTimer = setTimeout(() => setSlowLoad(true), 6000);

        const fetchData = async () => {
            try {
                // Use cache with 5 minute TTL to reduce Firestore reads
                const allProducts = await fetchWithCache(
                    'home_products',
                    async () => {
                        // Use backend API (avoids direct client-side Firestore reads).
                        // fetchWithTimeout aborts after 25s instead of hanging forever
                        // if the request stalls (dead port, silent firewall drop, a
                        // cold-start that never finishes).
                        const res = await fetchWithTimeout(`${API_BASE}/products?limit=100`);
                        if (!res.ok) throw new Error('Products API failed');
                        const apiData = await res.json();
                        return (apiData.products || []).map(p => {
                            if (!p.name && p.title) p.name = p.title;
                            return p;
                        });
                    },
                    5 * 60 * 1000 // 5 minutes localStorage cache
                );

                // If no products in database, show empty state
                if (allProducts.length === 0) {
                    setFeaturedProducts([]);
                    setLatestProducts([]);
                    setDealsProducts([]);
                    setLoading(false);
                    return;
                }

                // Group products by category first
                const groupByCategory = (items) => {
                    return items.reduce((acc, p) => {
                        const cat = p.category || 'Other';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(p);
                        return acc;
                    }, {});
                };

                // Featured: Take 5 products from each category
                const featuredGrouped = groupByCategory(allProducts);
                const featured = [];
                Object.keys(featuredGrouped).forEach(cat => {
                    featured.push(...featuredGrouped[cat].slice(0, 5));
                });
                
                // Latest: Take 5 products from each category (reversed for newest)
                const latestGrouped = groupByCategory([...allProducts].reverse());
                const latest = [];
                Object.keys(latestGrouped).forEach(cat => {
                    latest.push(...latestGrouped[cat].slice(0, 5));
                });
                
                // Deals: Products with discount, take 5 from each category
                const dealsFiltered = allProducts.filter(p => p.discount || p.oldPrice);
                const dealsGrouped = groupByCategory(dealsFiltered);
                const deals = [];
                Object.keys(dealsGrouped).forEach(cat => {
                    deals.push(...dealsGrouped[cat].slice(0, 5));
                });

                setFeaturedProducts(featured);
                setLatestProducts(latest);
                setDealsProducts(deals);
                setLoading(false);

                // Lazy load reviews - fetch only first 15 products' reviews initially
                const priorityProducts = [...featured.slice(0, 5), ...latest.slice(0, 5), ...deals.slice(0, 5)];
                fetchReviewsForProducts(priorityProducts);
            } catch (err) {
                console.error(err);
                setLoadError(err.message || 'Failed to load products');
                setLoading(false);
            } finally {
                clearTimeout(slowLoadTimer);
            }
        };
        fetchData();

        return () => clearTimeout(slowLoadTimer);
    }, [retryCount]);

    // Fetch reviews for products
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

    const handleAddToCart = async (e, product) => {
        if (e) e.stopPropagation();
        const res = await addToCart(product);
        if (res.success) {
            // Silently added - no popup
            window.dispatchEvent(new Event('cartUpdate'));
        }
    };

    // Listen to wishlist changes
    useEffect(() => {
        const unsubscribe = listenToWishlist((items) => {
            setWishlist(items);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const toggleWishlist = async (e, product) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const alreadySaved = wishlist.some(item => item.id === product.id);
        try {
            if (alreadySaved) {
                await removeFromWishlist(product.id);
            } else {
                await addToWishlist(product);
            }
        } catch (error) {
            console.error('Wishlist toggle failed:', error);
        }
    };

    const groupByCategory = (items) => {
        return items.reduce((acc, p) => {
            const cat = p.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {});
    };

    const groupedDeals = useMemo(() => groupByCategory(dealsProducts), [dealsProducts]);
    const groupedFeatured = useMemo(() => groupByCategory(featuredProducts), [featuredProducts]);
    const groupedLatest = useMemo(() => groupByCategory(latestProducts), [latestProducts]);

    const openQuickView = (e, product) => {
        if (e) e.stopPropagation();
        setSelectedQuickProduct(product);
        setIsQuickViewOpen(true);
    };

    if (loading) {
        return (
            <LoadingSpinner
                fullScreen
                size="large"
                message={
                    slowLoad
                        ? "Still loading — our server may be waking up after a period of inactivity, this can take up to a minute on the first visit."
                        : "Loading amazing products for you..."
                }
            />
        );
    }

    if (loadError) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '60vh', textAlign: 'center', padding: '24px', gap: '12px',
            }}>
                <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a1a2e' }}>
                    Couldn't load products right now
                </p>
                <p style={{ color: '#6b7280', maxWidth: 420 }}>
                    {loadError.includes('timed out')
                        ? "The request timed out — the server may still be waking up. Give it a moment and try again."
                        : "There was a problem reaching the server. Check your connection and try again."}
                </p>
                <button
                    onClick={() => { setLoading(true); setRetryCount(c => c + 1); }}
                    style={{
                        marginTop: '4px', padding: '10px 24px', borderRadius: '8px', border: 'none',
                        background: '#1800AD', color: '#fff', fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="home-wrapper" style={{ background: '#F8F9FA' }}>
            <HeroCarousel />

            <CategoryShowcase 
                groupedDeals={groupedDeals} 
                wishlist={wishlist}
                productReviews={productReviews}
                handleAddToCart={handleAddToCart}
                toggleWishlist={toggleWishlist}
                openQuickView={openQuickView}
            />

            {[
                /* "New Arrivals" moved above "Featured Products" per request — this reuses the
                   same newest-first product grouping that previously powered the bottom
                   "Latest Releases" section, just relabeled and repositioned. */
                { title: "New Arrivals", subtitle: "Fresh picks just added to the store", groupedData: groupedLatest, bg: "#F8F9FA" },
                { title: "Featured Products", subtitle: "Our top picks for you", groupedData: groupedFeatured, bg: "#FFFFFF" }
            ].map((sec, idx) => (
                <ProductSection 
                    key={idx}
                    title={sec.title}
                    subtitle={sec.subtitle}
                    groupedData={sec.groupedData}
                    bg={sec.bg}
                    loading={false}
                    wishlist={wishlist}
                    productReviews={productReviews}
                    handleAddToCart={handleAddToCart}
                    toggleWishlist={toggleWishlist}
                    openQuickView={openQuickView}
                />
            ))}

            <QuickViewModal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={selectedQuickProduct}
                navigate={navigate}
            />
        </div>
    );
}