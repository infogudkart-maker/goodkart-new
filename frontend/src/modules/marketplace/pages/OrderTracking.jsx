import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, FileText, MapPin, Download, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/modules/shared/config/firebase';
import OrderTimeline from '@/modules/shared/components/common/OrderTimeline';
import ShippingDetailsCard from '@/modules/shared/components/common/ShippingDetailsCard';
import { mapOrderStatus } from '@/modules/shared/utils/orderUtils';
import { authFetch } from '@/modules/shared/utils/api';

export default function OrderTracking() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const cancellationReasons = [
        'Changed my mind',
        'Found a better price elsewhere',
        'Ordered by mistake',
        'Delivery time is too long',
        'Product no longer needed',
        'Want to change shipping address',
        'Want to modify order items',
        'Other'
    ];

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                // First, try to find by document ID
                let orderDoc = await getDoc(doc(db, 'orders', orderId));

                if (orderDoc.exists()) {
                    setOrder({ id: orderDoc.id, ...orderDoc.data() });
                } else {
                    // If not found by document ID, search by orderId field
                    const ordersRef = collection(db, 'orders');
                    const q = query(ordersRef, where('orderId', '==', orderId));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        setOrder({ id: doc.id, ...doc.data() });
                    } else {
                        setOrder(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const handleCancelOrder = async () => {
        if (!order || !order.id) return;

        // Validate reason selection
        if (!cancellationReason) {
            alert('Please select a reason for cancellation');
            return;
        }

        if (cancellationReason === 'Other' && !customReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        const finalReason = cancellationReason === 'Other' ? customReason : cancellationReason;

        setCancelling(true);
        try {
            const url = `/orders/${order.id}/cancel`;
            const response = await authFetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cancellationReason: finalReason })
            });

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[CANCEL-TRACK] JSON parse failure:', e);
                throw new Error(`Invalid server response: ${text.substring(0, 100)}`);
            }

            if (data.success) {
                // Refresh order data
                const orderDoc = await getDoc(doc(db, 'orders', order.id));
                if (orderDoc.exists()) {
                    setOrder({ id: orderDoc.id, ...orderDoc.data() });
                }
                
                // Show refund information
                const refundInfo = data.refundInfo || data.data?.refundInfo;
                if (refundInfo) {
                    alert(
                        `Order cancelled successfully!\n\n` +
                        `${refundInfo.message}\n\n` +
                        (refundInfo.refundAmount > 0 ? 
                            `Refund Amount: ₹${refundInfo.refundAmount}\n` +
                            `Refund Method: ${refundInfo.refundMethod}\n` +
                            `Processing Time: ${refundInfo.processingTime}` 
                            : '')
                    );
                } else {
                    alert('Order cancelled successfully!');
                }
                
                // Reset modal state
                setShowCancelModal(false);
                setCancellationReason('');
                setCustomReason('');
            } else {
                alert(`Failed to cancel order: ${data.message}`);
            }
        } catch (error) {
            console.error('[CANCEL-TRACK] Error caught:', error);
            alert(`Failed to cancel order. Please try again. (${error.message})`);
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <Package size={64} className="text-gray-300" />
                <h2>Order not found</h2>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const currentStatus = mapOrderStatus(order);
    const cancellableStatuses = ['Order Placed', 'Placed', 'Processing', 'Pending'];
    const canCancel = order.status !== 'Cancelled' && order.status !== 'Delivered' && cancellableStatuses.includes(order.status);

    return (
        <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '80vh' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm font-medium"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <ArrowLeft size={16} />
                        Back to Shopping
                    </button>
                    <h1 style={{ margin: 0 }}>Track <span className="gradient-text">Order</span></h1>
                </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                {/* Tracking Timeline */}
                <div className="glass-card" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Order ID</p>
                            <h3 style={{ margin: 0 }}>#{order.orderId || order.id}</h3>
                        </div>
                        {order.awbNumber && (
                            <div style={{ textAlign: 'right' }}>
                                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>AWB Number</p>
                                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{order.awbNumber}</h3>
                            </div>
                        )}
                    </div>

                    {/* Shipping / Courier Details Section */}
                    {order.status !== 'Cancelled' && (
                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--surface)',
                            borderRadius: '16px',
                            marginBottom: '2.5rem',
                            border: '1px solid var(--border)'
                        }}>
                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Truck size={18} className="text-primary" /> Delivery Information
                            </h4>

                            {order.awbNumber ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Courier Partner</p>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{order.courierName || 'Assigned Courier'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Tracking Number (AWB)</p>
                                        <a
                                            href={`https://shiprocket.co/tracking/${order.awbNumber}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontWeight: 600, margin: 0, fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                            {order.awbNumber}
                                        </a>
                                    </div>
                                    {order.estimatedDeliveryDays && (
                                        <div>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Est. Delivery</p>
                                            <p style={{ fontWeight: 600, margin: 0 }}>{order.estimatedDeliveryDays}</p>
                                        </div>
                                    )}
                                </div>
                            ) : order.shipmentId ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Courier assignment in progress. AWB will be generated shortly.</p>
                                </div>
                            ) : (
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Shipping details will be updated once the order is processed.
                                </p>
                            )}
                        </div>
                    )}

                    {order.status === 'Cancelled' && (
                        <>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <XCircle size={20} style={{ color: '#ef4444' }} />
                                <div>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#ef4444' }}>Order Cancelled</p>
                                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                                        {order.cancellationReason || 'This order has been cancelled'}
                                    </p>
                                </div>
                            </div>
                            
                            {order.refundStatus && order.refundStatus !== 'Not Applicable' && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '12px',
                                    marginBottom: '2rem'
                                }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#3b82f6' }}>Refund Information</h4>
                                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Refund Amount:</span>
                                            <span style={{ fontWeight: '600' }}>₹{order.refundAmount?.toLocaleString('en-IN') || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Refund Status:</span>
                                            <span style={{ fontWeight: '600', color: order.refundStatus === 'Completed' ? '#10b981' : '#f59e0b' }}>
                                                {order.refundStatus}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Refund Method:</span>
                                            <span style={{ fontWeight: '600' }}>{order.refundMethod || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Processing Time:</span>
                                            <span style={{ fontWeight: '600' }}>{order.refundProcessingTime || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <OrderTimeline currentStatus={currentStatus} />

                    {/* Detailed Tracking Events */}
                    {order.trackingEvents && order.trackingEvents.length > 0 && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            background: 'var(--surface)',
                            borderRadius: '16px',
                            border: '1px solid var(--border)'
                        }}>
                            <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} className="text-primary" /> Tracking Updates
                            </h4>
                            <div className="flex flex-col gap-4">
                                {order.trackingEvents.map((event, index) => (
                                    <div key={index} className="flex gap-4 relative">
                                        {/* Connecting Line */}
                                        {index !== order.trackingEvents.length - 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                left: '7px',
                                                top: '24px',
                                                bottom: '-16px',
                                                width: '2px',
                                                background: 'var(--border)'
                                            }} />
                                        )}

                                        {/* Node Marker */}
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: index === 0 ? 'var(--primary)' : 'var(--surface)',
                                            border: `2px solid ${index === 0 ? 'var(--primary)' : 'var(--border)'}`,
                                            marginTop: '4px',
                                            zIndex: 1
                                        }} />

                                        <div className="flex-1">
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{event.status}</p>
                                            {event.location && <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{event.location}</p>}
                                            {event.remarks && <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontStyle: 'italic' }}>{event.remarks}</p>}
                                            <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
                                                {new Date(event.date).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delivery Info */}
                <div className="flex flex-col gap-6">
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={20} className="text-primary" /> Delivery Address
                        </h3>
                        {order.shippingAddress ? (
                            <>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {order.shippingAddress.firstName && order.shippingAddress.lastName 
                                        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` 
                                        : order.customerName || 'N/A'}
                                </p>
                                <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                                    {order.shippingAddress.addressLine || 'N/A'}<br />
                                    {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''} {order.shippingAddress.pincode || ''}<br />
                                    {order.shippingAddress.country || 'India'}<br />
                                    Phone: {order.shippingAddress.phone || order.phone || 'N/A'}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted">No address information available</p>
                        )}
                    </div>

                    <ShippingDetailsCard order={order} />

                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Items in this Order</h3>
                        <div className="flex flex-col gap-4">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-center">
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            background: 'var(--surface)',
                                            borderRadius: '8px',
                                            backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}></div>
                                        <div className="flex-1">
                                            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{item.name || 'Product'}</h4>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Qty: {item.quantity || 1}</p>
                                        </div>
                                        <span style={{ fontWeight: 'BOLD' }}>
                                            ₹{((item.priceWithGST || item.price) * (item.quantity || 1)).toLocaleString('en-IN')}*
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted">No items found</p>
                            )}
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />
                        
                        {/* Payment Method & Status */}
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>Shipping Charges</span>
                            <div style={{ textAlign: 'right' }}>
                                {order.actualShippingCharge || order.courierRate ? (
                                    <>
                                        <span style={{ fontWeight: '700', fontSize: '1rem' }}>
                                            ₹{(order.actualShippingCharge || order.courierRate).toLocaleString('en-IN')}
                                        </span>
                                        {order.estimatedShippingCharge && order.estimatedShippingCharge !== (order.actualShippingCharge || order.courierRate) && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Estimated: ₹{order.estimatedShippingCharge.toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </>
                                ) : order.estimatedShippingCharge ? (
                                    <>
                                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f59e0b' }}>
                                            ₹{order.estimatedShippingCharge.toLocaleString('en-IN')}
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            (Estimated)
                                        </div>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calculating...</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>Payment Method</span>
                            <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{order.paymentMethod || 'N/A'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>Payment Status</span>
                            <span style={{ 
                                fontWeight: '600',
                                color: order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected' ? '#10b981' : '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                {order.paymentStatus === 'Completed' ? (
                                    <>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                        Paid Online
                                    </>
                                ) : order.paymentStatus === 'Collected' ? (
                                    <>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                        Payment Collected
                                    </>
                                ) : order.paymentMethod === 'COD' ? (
                                    <>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                                        Pay on Delivery
                                    </>
                                ) : (
                                    <>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                        Paid Online
                                    </>
                                )}
                            </span>
                        </div>
                        
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />
                        
                        <div className="flex justify-between items-center">
                            <span style={{ fontWeight: '600' }}>Order Total</span>
                            <span className="gradient-text" style={{ fontWeight: '800', fontSize: '1.25rem' }}>₹{order.total?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate(`/invoice?orderId=${order.orderId || order.id}`)}
                        className="btn btn-primary flex items-center justify-center gap-3"
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #3B7CF1 0%, #5BB8FF 100%)',
                            boxShadow: '0 10px 20px -5px rgba(24, 0, 173, 0.4)',
                            fontWeight: '700',
                            fontSize: '1rem'
                        }}
                    >
                        <FileText size={20} />
                        View Bill
                    </button>

                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="btn flex items-center justify-center gap-3"
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '16px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '2px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                fontWeight: '700',
                                fontSize: '1rem'
                            }}
                        >
                            <XCircle size={20} />
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>

            {/* Cancellation Modal */}
            {showCancelModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => !cancelling && setShowCancelModal(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{
                            maxWidth: '500px',
                            width: '90%',
                            padding: '1.5rem',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            margin: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <XCircle size={20} style={{ color: '#ef4444' }} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Cancel Order</h3>
                                <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                                    Order #{order.orderId || order.id}
                                </p>
                            </div>
                        </div>

                        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Please select a reason for cancelling this order. This helps us improve our service.
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                Cancellation Reason <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {cancellationReasons.map((reason) => (
                                    <label
                                        key={reason}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: cancellationReason === reason ? 'rgba(24, 0, 173, 0.1)' : 'var(--surface)',
                                            border: `2px solid ${cancellationReason === reason ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (cancellationReason !== reason) {
                                                e.currentTarget.style.borderColor = 'var(--primary-light)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (cancellationReason !== reason) {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                            }
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="cancellationReason"
                                            value={reason}
                                            checked={cancellationReason === reason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                accentColor: 'var(--primary)'
                                            }}
                                        />
                                        <span style={{ flex: 1, fontWeight: cancellationReason === reason ? '600' : '400' }}>
                                            {reason}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {cancellationReason === 'Other' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                    Please specify <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Enter your reason for cancellation..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: '2px solid var(--border)',
                                        background: 'var(--surface)',
                                        fontSize: '0.9rem',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </motion.div>
                        )}

                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            marginBottom: '1rem'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                ⚠️ Once cancelled, this action cannot be undone. Any applicable refunds will be processed according to our refund policy.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancellationReason('');
                                    setCustomReason('');
                                }}
                                disabled={cancelling}
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    background: 'var(--surface)',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling || !cancellationReason || (cancellationReason === 'Other' && !customReason.trim())}
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    opacity: (cancelling || !cancellationReason || (cancellationReason === 'Other' && !customReason.trim())) ? 0.5 : 1,
                                    cursor: (cancelling || !cancellationReason || (cancellationReason === 'Other' && !customReason.trim())) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}



