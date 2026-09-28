import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingCart, TrendingUp } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/modules/shared/config/firebase';
import { addToCart } from '@/modules/shared/utils/cartUtils';
import { listenToWishlist, addToWishlist, removeFromWishlist } from '@/modules/shared/utils/wishlistUtils';
import { fetchProductReviews } from '@/modules/shared/utils/reviewUtils';
import { fetchWithCache } from '@/modules/shared/utils/firestoreCache';
import LoadingSpinner from '@/modules/shared/components/common/LoadingSpinner';
import QuickViewModal from '@/modules/shared/components/common/QuickViewModal';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import './Trending.css';

export default function Trending() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState([]);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
    const [productReviews, setProductReviews] = useState({});

    useEffect(() => {
        const unsubscribe = listenToWishlist((items) => {
            setWishlist(items);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                // Use cache with 5 minute TTL to reduce Firestore reads
                const data = await fetchWithCache(
                    'trending_products',
                    async () => {
                        const q = query(collection(db, "products"), limit(12));
                        const snap = await getDocs(q);
                        return snap.docs.map(doc => {
                            const productData = doc.data();
                            return {
                                id: doc.id,
                                ...productData,
                                rating: productData.rating !== undefined ? productData.rating : 0,
                                reviews: productData.reviewCount || 0
                            };
                        });
                    },
                    5 * 60 * 1000 // 5 minutes cache
                );
                setProducts(data);
                setLoading(false);
                // Lazy load reviews - fetch only first 8 products' reviews
                fetchReviewsForProducts(data.slice(0, 8));
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchTrending();
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

    const handleAddToCart = async (e, p) => {
        if (e) e.stopPropagation();
        const res = await addToCart(p);
        if (res.success) {
            // Silently added - no popup
            window.dispatchEvent(new Event('cartUpdate'));
        }
    };

    const toggleWishlist = async (e, product) => {
        if (e) e.stopPropagation();
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

    const openQuickView = (e, product) => {
        if (e) e.stopPropagation();
        setSelectedQuickProduct(product);
        setIsQuickViewOpen(true);
    };

    return (
        <div className="trending-page bg-light">
            <div className="container">
                <header className="page-header">
                    <div className="badge-hot"><TrendingUp size={16} /> TRENDING NOW</div>
                    <h1>What's <span className="gradient-text">Hot</span></h1>
                    <p>Discover the most popular products based on recent sales</p>
                </header>

                {loading ? (
                    <LoadingSpinner size="large" message="Checking what's viral..." />
                ) : (
                    <div className="trending-grid">
                        {products.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                className="product-card-premium"
                                onClick={() => {
                                    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                                    const filtered = recentlyViewed.filter(item => item.id !== p.id);
                                    const updated = [p, ...filtered].slice(0, 8);
                                    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                                    navigate("/product/" + p.id);
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -8 }}
                            >
                                <div className="card-media">
                                    <div className="rank">#{idx + 1}</div>
                                    <img src={p.imageUrl || p.image} alt={p.name} />
                                    <div className="overlay-tools">
                                        <button
                                            onClick={(e) => toggleWishlist(e, p)}
                                            className={`tool-btn ${wishlist.some(item => item.id === p.id) ? 'active' : ''}`}
                                            title="Add to Wishlist"
                                        >
                                            <Heart
                                                size={18}
                                                fill={wishlist.some(item => item.id === p.id) ? "#ef4444" : "none"}
                                                color={wishlist.some(item => item.id === p.id) ? "#ef4444" : "currentColor"}
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => openQuickView(e, p)}
                                            className="tool-btn"
                                            title="Quick View"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="product-details">
                                    <p className="p-cat">{p.category || 'Trending'}</p>
                                    <h3 className="p-name">{p.name}</h3>
                                    <div className="p-rating">
                                        <Rating
                                            averageRating={productReviews[p.id]?.stats?.averageRating || 0}
                                            totalReviews={productReviews[p.id]?.stats?.totalReviews || 0}
                                            size={14}
                                            showCount={true}
                                        />
                                    </div>
                                    <div className="p-footer">
                                        <div className="p-price-group">
                                            <PriceDisplay product={p} size="sm" />
                                        </div>
                                        <button
                                            onClick={(e) => handleAddToCart(e, p)}
                                            className="add-to-cart-simple"
                                            title="Add to Cart"
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <QuickViewModal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={selectedQuickProduct}
                navigate={navigate}
            />
        </div>
    );
}

