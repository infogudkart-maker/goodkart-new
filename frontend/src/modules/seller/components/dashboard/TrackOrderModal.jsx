import { X, Package, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackOrderModal({ show, trackingOrder, onClose, onDownloadLabel }) {
    if (!show || !trackingOrder) return null;

    // Map shipping status to 3-stage seller timeline
    const SELLER_STAGES = [
        { key: 'ORDERED', label: 'Ordered', desc: 'Order placed by customer' },
        { key: 'PICKUP', label: 'Pickup', desc: 'Courier picked up package' },
        { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered to customer' },
    ];

    const shippingToStage = (s) => {
        if (trackingOrder.status === 'Cancelled') return 'CANCELLED';
        if (trackingOrder.status === 'Delivered' || s === 'DELIVERED') return 'DELIVERED';
        if (['PACKING', 'SHIPPING', 'OUT_FOR_DELIVERY', 'PICKUP_SCHEDULED', 'PICKUP_COMPLETE', 'SHIPPED', 'IN_TRANSIT'].includes(s) || trackingOrder.status === 'Shipped') return 'PICKUP';
        if (trackingOrder.status === 'Processing') return 'PROCESSING';
        if (!s || s === 'ORDERED') return 'ORDERED';
        return 'ORDERED';
    };

    const currentStage = shippingToStage(trackingOrder.shippingStatus);
    let currentIdx = SELLER_STAGES.findIndex(s => s.key === currentStage);
    if (currentIdx === -1) {
        if (currentStage === 'CANCELLED') currentIdx = 0;
        else if (currentStage === 'PROCESSING') currentIdx = 0.5;
        else currentIdx = 0;
    }

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,15,0.8)', backdropFilter: 'blur(16px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem'
            }} onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        background: 'var(--background)', borderRadius: '20px',
                        width: '100%', maxWidth: '640px', maxHeight: '90vh',
                        overflowY: 'auto', position: 'relative',
                        border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
                    }}
                    className="p-4 md:p-8 md:rounded-3xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Order Tracking</h2>
                            <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>#{trackingOrder.orderId}</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* 3-Stage Timeline */}
                    <div className="p-4 md:p-6 rounded-2xl mb-4 md:mb-6" style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {/* Progress bar behind */}
                            <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 0 }}>
                                <div style={{
                                    height: '100%', background: 'var(--primary)',
                                    width: currentIdx === 0 ? '0%' : currentIdx === 1 ? '50%' : '100%',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                            {SELLER_STAGES.map((stage, idx) => {
                                const done = idx <= currentIdx;
                                const active = idx === currentIdx;
                                return (
                                    <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                                        <motion.div
                                            animate={active ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 0 rgba(24, 0, 173,0.4)', '0 0 0 8px rgba(24, 0, 173,0.15)', '0 0 0 0 rgba(24, 0, 173,0.4)'] } : {}}
                                            transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: done ? 'var(--primary)' : 'var(--background)',
                                                border: `2px solid ${done ? 'var(--primary)' : 'var(--border)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: done ? 'white' : 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700
                                            }}
                                        >
                                            {done ? '✓' : idx + 1}
                                        </motion.div>
                                        <p style={{ marginTop: '0.5rem', fontWeight: active ? 700 : 500, fontSize: '0.85rem', color: done ? 'var(--text)' : 'var(--text-muted)', textAlign: 'center' }}>{stage.label}</p>
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '90px' }}>{stage.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={16} className="text-primary" /> Shipping Details
                        </h4>
                        {trackingOrder.status === 'Cancelled' ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--error)', marginBottom: '1rem' }}>
                                    <X size={18} />
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Order cancelled.</p>
                                </div>
                                {trackingOrder.cancellationReason && (
                                    <div style={{ 
                                        padding: '0.75rem 1rem', 
                                        background: 'rgba(239, 68, 68, 0.08)', 
                                        borderRadius: '10px', 
                                        border: '1px solid rgba(239, 68, 68, 0.2)' 
                                    }}>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.3rem 0', fontWeight: 600 }}>Cancellation Reason:</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 }}>
                                            {trackingOrder.cancellationReason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : trackingOrder.awbNumber ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Courier Partner</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{trackingOrder.courierName || 'Assigned'}</p>
                                </div>
                                <div>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>AWB / Tracking No.</p>
                                    <a href={`https://shiprocket.co/tracking/${trackingOrder.awbNumber}`} target="_blank" rel="noopener noreferrer"
                                        style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                                        {trackingOrder.awbNumber}
                                    </a>
                                </div>
                                {trackingOrder.estimatedDeliveryDays && (
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Est. Delivery</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{trackingOrder.estimatedDeliveryDays} days</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Shipping Label</p>
                                    <button
                                        onClick={() => onDownloadLabel(trackingOrder.id, trackingOrder.awbNumber, trackingOrder.labelUrl)}
                                        className="btn btn-primary btn-sm flex items-center gap-1"
                                        style={{ padding: '0.35rem 0.75rem', marginTop: '0.1rem' }}
                                    >
                                        <Package size={13} /> Download Label
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Courier assignment pending. AWB will appear here automatically.</p>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Items Ordered</h4>
                        <div className="flex flex-col gap-3">
                            {trackingOrder.items && trackingOrder.items.length > 0 ? (
                                trackingOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3" style={{ paddingBottom: idx < trackingOrder.items.length - 1 ? '0.75rem' : 0, borderBottom: idx < trackingOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                                            background: item.imageUrl ? `url(${item.imageUrl}) center/cover` : 'var(--primary)20',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {!item.imageUrl && <Package size={20} style={{ color: 'var(--primary)' }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</p>
                                            <p className="text-muted" style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem' }}>Qty: {item.quantity}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {item.originalPrice && item.originalPrice > (item.priceWithGST || item.price) && (
                                                <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem', textDecoration: 'line-through' }}>
                                                    ₹{(item.originalPrice * item.quantity).toFixed(2)}
                                                </p>
                                            )}
                                            <p style={{ margin: 0, fontWeight: 700 }}>₹{((item.priceWithGST || item.price) * item.quantity).toFixed(2)}*</p>
                                            <p className="text-muted" style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem' }}>₹{(item.priceWithGST || item.price).toFixed(2)} each</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>No item details available.</p>
                            )}
                        </div>
                        {/* Order total */}
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Order Total</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>₹{trackingOrder.total}</span>
                        </div>
                        {/* Payment method & Customer */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Customer: <strong>{trackingOrder.customer}</strong></span>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Payment: <strong style={{ textTransform: 'uppercase' }}>{trackingOrder.paymentMethod || 'N/A'}</strong></span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}



