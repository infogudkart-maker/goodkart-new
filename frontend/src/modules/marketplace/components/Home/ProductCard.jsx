import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';

export default function ProductCard({ 
    product, 
    index, 
    wishlist, 
    productReviews, 
    handleAddToCart, 
    toggleWishlist, 
    openQuickView 
}) {
    const navigate = useNavigate();
    
    if (!product || !product.id) return null;
    const isWishlisted = wishlist.some(item => item.id === product.id);
    const isOutOfStock = product.stock === 0 || product.status === 'Out of Stock';

    return (
        <motion.div
            className="product-card-premium"
            whileHover={{ y: -8 }}
            onClick={() => {
                const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const filtered = recentlyViewed.filter(item => item.id !== product.id);
                const updated = [product, ...filtered].slice(0, 8);
                localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                navigate("/product/" + product.id);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div className="card-media">
                {product.discount && !isOutOfStock && <span className="discount-badge">{product.discount}</span>}
                {isOutOfStock && <span className="out-of-stock-badge">OUT OF STOCK</span>}
                <img 
                    src={product.image || product.imageUrl} 
                    alt={product.name}
                    style={isOutOfStock ? { filter: 'grayscale(100%)', opacity: 0.7 } : {}}
                />
                <div className="overlay-tools">
                    <button
                        onClick={(e) => toggleWishlist(e, product)}
                        className={`tool-btn ${isWishlisted ? 'active' : ''}`}
                        title="Add to Wishlist"
                    >
                        <Heart
                            size={18}
                            fill={isWishlisted ? "#ef4444" : "none"}
                            color={isWishlisted ? "#ef4444" : "currentColor"}
                        />
                    </button>
                    <button
                        onClick={(e) => openQuickView(e, product)}
                        className="tool-btn"
                        title="Quick View"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            </div>
            <div className="card-info">
                <div className="category-row">
                    <span className="category">{product.category || 'Product'}</span>
                </div>
                <h3 className="title">{product.name}</h3>

                <div className="rating-row">
                    <Rating
                        averageRating={productReviews[product.id]?.stats?.averageRating || 0}
                        totalReviews={productReviews[product.id]?.stats?.totalReviews || 0}
                        size={12}
                        showCount={true}
                        className="home-product-rating"
                    />
                </div>

                <div className="info-bottom">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <PriceDisplay product={product} size="sm" showGSTIndicator={false} />
                        {isOutOfStock && (
                            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
                                Out of Stock
                            </span>
                        )}
                    </div>
                    {isOutOfStock ? (
                        <button
                            onClick={(e) => toggleWishlist(e, product)}
                            className="add-to-cart-simple"
                            title="Add to Wishlist"
                            style={{ background: isWishlisted ? '#ef4444' : '#3B7CF1' }}
                        >
                            <Heart size={18} fill={isWishlisted ? "white" : "none"} />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="add-to-cart-simple"
                            title="Add to Cart"
                        >
                            <ShoppingCart size={18} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
