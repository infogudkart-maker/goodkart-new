import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';

export default function ConsumerWishlistTab({ wishlist, onRemoveFromWishlist }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Wishlist</h2>
                <span className="text-sm text-gray-500">{wishlist.length} items</span>
            </div>
            {wishlist.length === 0 ? (
                <div className="text-center py-12">
                    <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <button onClick={() => navigate('/products')}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#120085] transition-colors">
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="p-6">
                    <div className="product-uniform-grid">
                        {wishlist.map((product, index) => (
                            <motion.div
                                key={product.id}
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
                                    {product.discount && <span className="discount-badge">{product.discount}</span>}
                                    <img src={product.image || product.imageUrl} alt={product.name} />
                                    <div className="overlay-tools">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveFromWishlist(product.id);
                                            }}
                                            className="tool-btn active"
                                            title="Remove from Wishlist"
                                        >
                                            <Heart
                                                size={18}
                                                fill="#ef4444"
                                                color="#ef4444"
                                            />
                                        </button>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <div className="category-row">
                                        <span className="category">{product.category || 'Product'}</span>
                                    </div>
                                    <h3 className="title">{product.name}</h3>

                                    <div className="info-bottom">
                                        <PriceDisplay product={product} size="sm" showGSTIndicator={false} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            
            <style>{`
                /* Professional Grid System - 5 columns desktop, compact spacing */
                .product-uniform-grid { 
                    display: grid; 
                    grid-template-columns: repeat(5, 1fr); 
                    gap: 16px; 
                }
                
                @media (max-width: 1024px) {
                    .product-uniform-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                    }
                }
                
                @media (max-width: 768px) {
                    .product-uniform-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }
                }
                
                @media (max-width: 480px) {
                    .product-uniform-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

