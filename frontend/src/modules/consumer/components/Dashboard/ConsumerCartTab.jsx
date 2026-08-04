import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import { removeFromCart, updateCartItemQuantity } from '@/modules/shared/utils/cartUtils';

export default function ConsumerCartTab({ cart, onCartUpdate }) {
    const navigate = useNavigate();

    const handleRemoveFromCart = async (cartItemId) => {
        const result = await removeFromCart(cartItemId);
        if (!result.success) {
            alert(result.message || 'Failed to remove from cart');
        }
    };

    const handleQuantityChange = async (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;
        const result = await updateCartItemQuantity(cartItemId, newQuantity);
        if (!result.success) {
            alert(result.message || 'Failed to update quantity');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Cart</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{cart.length} items</span>
                    {cart.length > 0 && (
                        <button
                            onClick={() => navigate('/checkout')}
                            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#120085] transition-colors"
                        >
                            Proceed to Checkout
                        </button>
                    )}
                </div>
            </div>
            {cart.length === 0 ? (
                <div className="text-center py-12">
                    <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <button onClick={() => navigate('/products')}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#120085] transition-colors">
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="p-6">
                    <div className="product-uniform-grid">
                        {cart.map((item, index) => (
                            <motion.div
                                key={item.id}
                                className="product-card-premium"
                                whileHover={{ y: -8 }}
                                onClick={() => {
                                    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                                    const productData = {
                                        id: item.productId,
                                        name: item.name,
                                        imageUrl: item.imageUrl,
                                        price: item.price,
                                        discountPrice: item.discountPrice,
                                        category: item.category
                                    };
                                    const filtered = recentlyViewed.filter(p => p.id !== item.productId);
                                    const updated = [productData, ...filtered].slice(0, 8);
                                    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                                    navigate("/product/" + item.productId);
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="card-media">
                                    <img src={item.imageUrl} alt={item.name} />
                                    <div className="overlay-tools">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFromCart(item.id);
                                            }}
                                            className="tool-btn"
                                            title="Remove from Cart"
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <div className="category-row">
                                        <span className="category">{item.category || 'Product'}</span>
                                    </div>
                                    <h3 className="title">{item.name}</h3>

                                    {/* Selections Display */}
                                    {(item.selections?.color || item.selections?.size || item.selections?.storage || item.selections?.memory) && (
                                        <div className="text-xs text-gray-500 mb-2 space-y-0.5">
                                            {item.selections.color && (
                                                <div>Color: {item.selections.color}</div>
                                            )}
                                            {item.selections.size && (
                                                <div>Size: {item.selections.size}</div>
                                            )}
                                            {item.selections.storage && (
                                                <div>Storage: {typeof item.selections.storage === 'object' ? item.selections.storage.label : item.selections.storage}</div>
                                            )}
                                            {item.selections.memory && (
                                                <div>Memory: {typeof item.selections.memory === 'object' ? item.selections.memory.label : item.selections.memory}</div>
                                            )}
                                        </div>
                                    )}

                                    <div className="info-bottom">
                                        <PriceDisplay product={item} size="sm" showGSTIndicator={false} />
                                    </div>

                                    {/* Quantity Controls */}
                                    <div 
                                        className="flex items-center gap-2 mt-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(item.id, item.quantity - 1);
                                            }}
                                            disabled={item.quantity <= 1}
                                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            -
                                        </button>
                                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(item.id, item.quantity + 1);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                            +
                                        </button>
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
