import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AdminLoginModal from '@/modules/auth/components/AdminLoginModal';
import { ShieldCheck } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function Footer() {
    const navigate = useNavigate();
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    const handleBecomeSellerClick = async () => {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) {
            alert('Please register first to become a seller.');
            return;
        }

        const userData = JSON.parse(rawUser);

        // Admin accounts cannot apply as sellers
        if (userData.role === 'ADMIN') {
            alert('Admin accounts cannot become sellers.');
            return;
        }

        // Check if user has already applied as a seller
        try {
            const response = await authFetch('/auth/check-seller-status');
            const data = await response.json();
            if (data.success && data.hasApplied) {
                if (data.sellerStatus === 'APPROVED') {
                    alert('You are already an approved seller! Redirecting to your dashboard.');
                    navigate('/seller/dashboard');
                    return;
                } else if (data.sellerStatus === 'PENDING') {
                    alert('You have already applied to become a seller. Your application is currently under review. Please wait for admin approval.');
                    return;
                }
                // REJECTED status — allow re-application
            }
        } catch (err) {
            console.error('Error checking seller status:', err);
        }

        window.open(window.location.origin + '/#/seller', '_blank');
    };

    return (
        <>
            <footer style={{
                marginTop: '4rem',
                padding: '4rem 0',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)'
            }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '-12px' }}>
                                <img src="/goodkart-logo.png" alt="" style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
                                <span style={{ lineHeight: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span>
                                        <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1800AD' }}>Good</span><span style={{ fontSize: '2rem', fontWeight: 400, color: '#5BB8FF' }}>kart</span>
                                    </span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#1800AD', letterSpacing: '0.3px', marginTop: '2px', textAlign: 'center' }}>Good Deals. Good Life</span>
                                </span>
                            </div>
                            <p className="text-muted" style={{ lineHeight: 1.6 }}>The future of global marketplace. Fast, secure, and seller-friendly.</p>
                        </div>

                        <div style={{ paddingLeft: '2rem' }}>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Marketplace</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li><Link to="/products" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>All Products</Link></li>
                                <li><Link to="/categories" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Categories</Link></li>
                                <li><Link to="/track" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Track Order</Link></li>
                            </ul>
                        </div>

                        <div style={{ paddingLeft: '2rem' }}>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Support</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li><Link to="/faq" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>FAQ</Link></li>
                                <li><Link to="/contact" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Contact Us</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Consumer Policy</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li><Link to="/cancellation-returns" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Cancellation &amp; Returns</Link></li>
                                <li><Link to="/terms-of-use" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Terms of Use</Link></li>
                                <li><Link to="/security" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Security</Link></li>
                                <li><Link to="/privacy" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Privacy</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Management</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li>
                                    <button
                                        onClick={() => setIsAdminModalOpen(true)}
                                        className="text-muted"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <ShieldCheck size={16} /> Management Login
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => {
                                            const rawUser = localStorage.getItem('user');
                                            if (!rawUser) {
                                                alert('Please login as a customer first to access the Seller Portal.');
                                                return;
                                            }
                                            navigate('/seller');
                                        }}
                                        className="text-muted"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            display: 'inline'
                                        }}
                                    >
                                        Seller Portal
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            {(() => {
                                const rawUser = localStorage.getItem('user');
                                const role = rawUser ? JSON.parse(rawUser).role : null;
                                if (role === 'SELLER') return null;

                                return (
                                    <>
                                        <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Earn with Us</h4>
                                        <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <button
                                                onClick={handleBecomeSellerClick}
                                                className="btn btn-primary"
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '0.75rem 1.5rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    borderRadius: '99px',
                                                    background: '#3B7CF1',
                                                    border: 'none',
                                                    color: 'white'
                                                }}
                                            >
                                                Become a Seller
                                            </button>
                                            <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>Open your shop in minutes.</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>&copy; 2026 Goodkart Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <AdminLoginModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
        </>
    );
}




