import { useNavigate } from 'react-router-dom';
import { Package, XCircle, MapPin, Truck } from 'lucide-react';
import { useState } from 'react';
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

export default function ConsumerOrdersTab({ orders, onSelectOrder, onCancelOrder }) {
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState(orders.length > 0 ? orders[0] : null);

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
    };

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <button onClick={() => navigate('/products')} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">Start Shopping</button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-x-hidden">
                {/* Orders List - Left Side */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-50">
                        <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
                        <span className="text-sm text-gray-500">{orders.length} total</span>
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: '70vh' }}>
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                onClick={() => handleOrderClick(order)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${
                                    selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-l-primary' : 'hover:bg-gray-50'
                                }`}
                                whileHover={{ 
                                    scale: 1.02,
                                    x: 8,
                                    transition: { type: "spring", stiffness: 400, damping: 25 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                animate={selectedOrder?.id === order.id ? {
                                    x: [0, 10, 0],
                                    transition: { duration: 0.5, ease: "easeOut" }
                                } : {}}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {order.items?.[0]?.imageUrl || order.items?.[0]?.image ? (
                                            <img src={order.items[0].imageUrl || order.items[0].image} alt="Product" className="w-full h-full object-cover" />
                                        ) : (<Package size={20} className="text-gray-400" />)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-gray-900">
                                                #{order.orderId || order.id.substring(0, 8)}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                ● {order.status || 'Processing'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">{formatDate(order.createdAt)}</p>
                                        <p className="text-sm text-gray-700 truncate">{order.items?.length || 0} items • ₹{order.total?.toLocaleString('en-IN')}</p>
                                        {order.items?.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">{order.items[0].name}{order.items.length > 1 && ` +${order.items.length - 1} more`}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Order Details - Right Side */}
                <AnimatePresence mode="wait">
                    {selectedOrder && (
                        <motion.div
                            key={selectedOrder.id}
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 30,
                                mass: 1
                            }}
                            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                        >
                            <motion.div 
                                className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                            >
                                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                                <p className="text-sm text-gray-500">
                                    #{selectedOrder.orderId || selectedOrder.id}
                                </p>
                            </motion.div>
                            <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                                {/* Order Status */}
                                <motion.div 
                                    className="mb-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Status</span>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                            selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            selectedOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                            selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            ● {selectedOrder.status || 'Processing'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">Ordered on {formatDate(selectedOrder.createdAt)}</p>
                                </motion.div>

                                {/* Shipping Address */}
                                {selectedOrder.shippingAddress && (
                                    <motion.div 
                                        className="mb-6 p-4 bg-gray-50 rounded-lg"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                    >
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <MapPin size={16} className="text-primary" /> Delivery Address
                                    </h3>
                                    <p className="text-sm text-gray-700">
                                        {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}<br />
                                        {selectedOrder.shippingAddress.addressLine}<br />
                                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.pincode}<br />
                                        Phone: {selectedOrder.shippingAddress.phone}
                                    </p>
                                    </motion.div>
                                )}

                                {/* Shipping Info */}
                                {selectedOrder.awbNumber && (
                                    <motion.div 
                                        className="mb-6 p-4 bg-blue-50 rounded-lg"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25, duration: 0.3 }}
                                    >
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Truck size={16} className="text-primary" /> Shipping Details
                                    </h3>
                                    <div className="text-sm text-gray-700 space-y-1">
                                        <p>Courier: <span className="font-medium">{selectedOrder.courierName || 'Assigned'}</span></p>
                                        <p>AWB: <span className="font-medium font-mono">{selectedOrder.awbNumber}</span></p>
                                        {selectedOrder.estimatedDeliveryDays && (
                                            <p>Est. Delivery: <span className="font-medium">{selectedOrder.estimatedDeliveryDays}</span></p>
                                        )}
                                    </div>
                                    </motion.div>
                                )}

                                {/* Items */}
                                <motion.div 
                                    className="mb-6"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                >
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Items ({selectedOrder.items?.length || 0})</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {item.imageUrl || item.image ? (
                                                    <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (<Package size={20} className="text-gray-400" />)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                                    ₹{((item.priceWithGST || item.price) * (item.quantity || 1)).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                </motion.div>

                                {/* Payment Summary */}
                                <motion.div 
                                    className="mb-6 p-4 bg-gray-50 rounded-lg"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35, duration: 0.3 }}
                                >
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Method</span>
                                        <span className="font-medium uppercase">{selectedOrder.paymentMethod || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Status</span>
                                        <span className={`font-medium ${
                                            selectedOrder.paymentStatus === 'Completed' ? 'text-green-600' : 'text-orange-600'
                                        }`}>{selectedOrder.paymentStatus || 'Pending'}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                                        <span className="font-semibold text-gray-900">Order Total</span>
                                        <span className="font-bold text-primary text-lg">₹{selectedOrder.total?.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div 
                                    className="space-y-3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.3 }}
                                >
                                <button
                                    onClick={() => navigate(`/track?orderId=${selectedOrder.orderId || selectedOrder.id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                                >
                                    <Truck size={18} />
                                    Track Order
                                </button>
                                
                                <button
                                    onClick={() => navigate(`/invoice?orderId=${selectedOrder.orderId || selectedOrder.id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    <Package size={18} />
                                    Download Invoice
                                </button>

                                {['Placed', 'Pending', 'Processing'].includes(selectedOrder.status) && (
                                    <button
                                        onClick={() => onCancelOrder(selectedOrder.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                                    >
                                        <XCircle size={18} />
                                        Cancel Order
                                    </button>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
