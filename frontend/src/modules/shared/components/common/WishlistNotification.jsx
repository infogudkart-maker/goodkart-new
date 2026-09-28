import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Heart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WishlistNotification({ isOpen, onClose, productName = '' }) {
    const navigate = useNavigate();

    const handleContinueShopping = () => {
        onClose();
    };

    const handleGoToWishlist = () => {
        navigate('/wishlist');
        onClose();
    };

    // Truncate product name to 40 characters (standard length)
    const truncatedName = productName.length > 40 ? productName.substring(0, 40) + '...' : productName;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            zIndex: 9998,
                        }}
                    />

                    {/* Notification Card */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            position: 'fixed',
                            top: '90px',
                            right: '20px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            padding: '18px',
                            zIndex: 9999,
                            minWidth: '280px',
                            maxWidth: '350px',
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#666',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <X size={16} />
                        </button>

                        {/* Success Icon and Message */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                            <div style={{
                                backgroundColor: '#ef4444',
                                borderRadius: '50%',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Heart size={20} color="white" fill="white" />
                            </div>
                            <div style={{ flex: 1, paddingRight: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                                    Added to Wishlist!
                                </h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }} title={productName}>
                                    {truncatedName || 'Your item has been added to the wishlist.'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleContinueShopping}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: '1.5px solid #e5e7eb',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#ef4444';
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.color = '#374151';
                                }}
                            >
                                Continue
                            </button>
                            <button
                                onClick={handleGoToWishlist}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: 'none',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ef4444';
                                }}
                            >
                                <Heart size={14} />
                                View Wishlist
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
