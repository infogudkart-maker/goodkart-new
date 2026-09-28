import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Clock, CheckCircle2, Package, TrendingUp,
    RotateCcw, Bookmark
} from 'lucide-react';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return 'Invalid Date';
    } catch { return 'Invalid Date'; }
};

export default function ConsumerOverviewTab({
    stats, orders, selectedOrder, setSelectedOrder,
    recentlyViewed, recommendedProducts,
    onSwitchTab, onCancelOrder
}) {
    const navigate = useNavigate();

    return (
        <div>
            {/* Stats Cards - Compact Horizontal Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Orders', value: stats.total, icon: <ShoppingBag size={22} className="text-[#3B7CF1]" />, bg: 'bg-blue-100' },
                    { label: 'Pending Orders', value: stats.pending, icon: <Clock size={22} className="text-orange-600" />, bg: 'bg-orange-100' },
                    { label: 'Delivered', value: stats.delivered, icon: <CheckCircle2 size={22} className="text-green-600" />, bg: 'bg-green-100' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                                <p className="text-base font-semibold text-gray-700">{s.label}</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">My Orders</h2>
                            <button onClick={() => onSwitchTab('orders')} className="text-sm text-primary hover:underline">View All</button>
                        </div>
                        <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(5 * 52px + 48px)' }}>
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        {['Order ID', 'Date', 'Items', 'Amount', 'Status', 'Action'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {orders.map((order, index) => (
                                        <motion.tr 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className={`cursor-pointer transition-all ${
                                                selectedOrder?.id === order.id 
                                                    ? 'bg-gradient-to-r from-blue-100 via-blue-50 to-transparent border-l-4 border-l-primary shadow-sm' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ 
                                                opacity: 1, 
                                                x: 0,
                                                scale: selectedOrder?.id === order.id ? 1.02 : 1,
                                            }}
                                            transition={{ 
                                                delay: index * 0.05,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30
                                            }}
                                            whileHover={{ 
                                                scale: 1.01,
                                                x: 4,
                                                backgroundColor: selectedOrder?.id === order.id ? undefined : 'rgba(249, 250, 251, 1)',
                                                transition: { type: "spring", stiffness: 400, damping: 25 }
                                            }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                        {order.items?.[0]?.imageUrl || order.items?.[0]?.image ? (
                                                            <img src={order.items[0].imageUrl || order.items[0].image} alt="Product" className="w-full h-full object-cover" />
                                                        ) : (<Package size={16} className="text-gray-400" />)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">#{order.orderId || order.id.substring(0, 6)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || 0} items</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{order.total?.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {order.status === 'Delivered' && '●'}{order.status === 'Pending' && '●'}{order.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/track?orderId=${order.orderId || order.id}`); }}
                                                    className="text-sm text-primary hover:underline font-medium">Track</button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            {orders.length === 0 && (
                                <div className="p-12 text-center">
                                    <Package size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">No orders yet</p>
                                    <button onClick={() => navigate('/products')} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">Start Shopping</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recently Viewed */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">Recently Viewed</h2>
                            <button onClick={() => navigate('/products')} className="text-sm text-primary hover:underline">View All</button>
                        </div>
                        <div className="p-4">
                            {recentlyViewed.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {recentlyViewed.map((product) => (
                                        <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                                <img src={product.imageUrl || product.image || '/placeholder.png'} alt={product.name}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-xs text-gray-700 font-medium truncate">{product.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <PriceDisplay product={product} size="xs" showGSTIndicator={false} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package size={48} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No recently viewed products</p>
                                    <button onClick={() => navigate('/products')} className="mt-3 text-primary text-sm font-medium hover:underline">Start Shopping</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommended Products */}
                    {recommendedProducts.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-gray-900">Recommended for You</h2>
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">HOT</span>
                                </div>
                                <button onClick={() => navigate('/products')} className="text-sm text-primary hover:underline">View All</button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {recommendedProducts.map((product) => (
                                        <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                                <img src={product.imageUrl || product.image || '/placeholder.png'} alt={product.name}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-xs text-gray-700 font-medium truncate">{product.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <PriceDisplay product={product} size="xs" showGSTIndicator={false} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <AnimatePresence mode="wait">
                        {selectedOrder && (
                            <motion.div 
                                key={selectedOrder.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    transition: {
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                        mass: 1
                                    }
                                }}
                                exit={{ 
                                    opacity: 0, 
                                    y: -50,
                                    transition: { duration: 0.2 }
                                }}
                            >
                            <div className="flex items-center justify-between mb-3">
                                <motion.h3 
                                    className="text-base font-semibold text-gray-900"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Order Details
                                </motion.h3>
                                <motion.span 
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                                >
                                    ● {selectedOrder.status || 'Pending'}
                                </motion.span>
                            </div>

                            {/* Timeline and Product Image Layout */}
                            <div className="flex gap-4 mb-4">
                                {/* Timeline - Left Side */}
                                <motion.div 
                                    className="flex-1 space-y-1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {[
                                        { label: 'Order Placed', icon: <CheckCircle2 size={14} />, active: !!selectedOrder.status, color: 'green', date: formatDate(selectedOrder.createdAt) },
                                        { label: 'Processing', icon: <Clock size={14} />, active: ['Processing','Shipped','Delivered'].includes(selectedOrder.status), color: 'orange' },
                                        { label: 'Shipped', icon: <Package size={14} />, active: ['Shipped','Delivered'].includes(selectedOrder.status), color: 'blue' },
                                        { label: 'Out for Delivery', icon: <TrendingUp size={14} />, active: ['Out for Delivery','Delivered'].includes(selectedOrder.status), color: 'purple' },
                                        { label: 'Delivered', icon: <CheckCircle2 size={14} />, active: selectedOrder.status === 'Delivered', color: 'green' }
                                    ].map((step, idx, arr) => (
                                        <div key={step.label}>
                                            <div className="flex items-start gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.active ? `bg-${step.color}-500 text-white` : 'bg-gray-200 text-gray-400'}`}>
                                                    {step.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-900 leading-tight">{step.label}</p>
                                                    {step.date && <p className="text-xs text-gray-500 leading-tight mt-0.5">{step.date}</p>}
                                                </div>
                                            </div>
                                            {idx < arr.length - 1 && <div className="ml-3.5 w-0.5 h-2 bg-gray-200"></div>}
                                        </div>
                                    ))}
                                </motion.div>

                                {/* Product Image - Right Side */}
                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <motion.div 
                                        className="w-40 h-40 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        {selectedOrder.items[0].imageUrl || selectedOrder.items[0].image ? (
                                            <img 
                                                src={selectedOrder.items[0].imageUrl || selectedOrder.items[0].image} 
                                                alt={selectedOrder.items[0].name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={40} className="text-gray-300" />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Order Items */}
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <motion.div 
                                    className="mb-4 pb-4 border-b border-gray-200"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Items</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">{item.name}</p>
                                                    <p className="text-xs text-gray-500 leading-tight mt-0.5">Qty: {item.quantity} × ₹{item.price}</p>
                                                </div>
                                                <p className="text-sm font-black text-primary ml-3">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Shipping Address */}
                            {selectedOrder.shippingAddress && (
                                <motion.div 
                                    className="mb-4 pb-4 border-b border-gray-200"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Address</h4>
                                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 leading-relaxed">
                                        <p className="font-bold text-gray-900">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                                        <p className="mt-1">{selectedOrder.shippingAddress.addressLine}</p>
                                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.pincode}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Payment Method & Status */}
                            {selectedOrder.paymentMethod && (
                                <motion.div 
                                    className="mb-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Details</h4>
                                    <div className="p-2 bg-gray-50 rounded">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-gray-500 leading-tight">Method:</p>
                                            <p className="text-sm font-bold text-gray-900 uppercase leading-tight">{selectedOrder.paymentMethod}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500 leading-tight">Status:</p>
                                            <p className={`text-sm font-bold leading-tight ${
                                                selectedOrder.paymentStatus === 'Completed' || selectedOrder.paymentStatus === 'Collected' 
                                                    ? 'text-green-600' 
                                                    : 'text-amber-600'
                                            }`}>
                                                {selectedOrder.paymentStatus === 'Completed' 
                                                    ? 'Paid Online' 
                                                    : selectedOrder.paymentStatus === 'Collected'
                                                    ? 'Payment Collected'
                                                    : selectedOrder.paymentMethod === 'COD' 
                                                    ? 'Pay on Delivery' 
                                                    : 'Paid Online'}
                                            </p>
                                        </div>
                                        {selectedOrder.paymentId && <p className="text-xs text-gray-500 mt-1 leading-tight">Payment ID: {selectedOrder.paymentId}</p>}
                                    </div>
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <button onClick={() => navigate(`/track?orderId=${selectedOrder.orderId || selectedOrder.id}`)}
                                    className="w-full px-3 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-[#120085] transition-colors">Track Order</button>
                                <button onClick={() => navigate(`/invoice?orderId=${selectedOrder.orderId || selectedOrder.id}`)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">Download Invoice</button>
                                {['Placed', 'Pending', 'Processing'].includes(selectedOrder.status) && (
                                    <button onClick={() => onCancelOrder(selectedOrder.id)}
                                        className="w-full px-3 py-2 border border-red-200 text-red-600 rounded text-sm font-medium hover:bg-red-50 transition-colors">
                                        Cancel Order
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => navigate('/products')} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-50 transition-colors text-left border border-transparent hover:border-blue-200"
                            >
                                <ShoppingBag size={18} className="text-[#3B7CF1]" />
                                <span className="text-sm font-medium text-gray-700">Buy Again</span>
                            </button>
                            <button 
                                onClick={() => {
                                    if (!selectedOrder) {
                                        alert('Please select an order first to initiate a return.');
                                        return;
                                    }
                                    if (selectedOrder.status === 'Delivered') {
                                        alert('Return request initiated for Order #' + (selectedOrder.orderId || selectedOrder.id) + '. Our team will contact you within 24 hours.');
                                    } else if (selectedOrder.status === 'Cancelled') {
                                        alert('This order has already been cancelled.');
                                    } else {
                                        alert('Only delivered orders can be returned. This order is currently: ' + selectedOrder.status);
                                    }
                                }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-orange-50 transition-colors text-left border border-transparent hover:border-orange-200"
                                disabled={!selectedOrder}
                                style={{ opacity: !selectedOrder ? 0.5 : 1, cursor: !selectedOrder ? 'not-allowed' : 'pointer' }}
                            >
                                <RotateCcw size={18} className="text-orange-600" />
                                <span className="text-sm font-medium text-gray-700">Return Order</span>
                            </button>
                            <button 
                                onClick={() => onSwitchTab('wishlist')} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 transition-colors text-left border border-transparent hover:border-red-200"
                            >
                                <Bookmark size={18} className="text-red-600" />
                                <span className="text-sm font-medium text-gray-700">Wishlist</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



