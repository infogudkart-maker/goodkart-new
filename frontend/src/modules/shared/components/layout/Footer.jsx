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
                    alert(
                        'You are already an approved seller! Redirecting to your dashboard.'
                    );
                    navigate('/seller/dashboard');
                    return;
                } else if (data.sellerStatus === 'PENDING') {
                    alert(
                        'You have already applied to become a seller. Your application is currently under review. Please wait for admin approval.'
                    );
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
            <footer
                style={{
                    marginTop: '4rem',
                    padding: '4rem 0',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)',
                }}
            >
                <div className="container">
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '2rem',
                        }}
                    >
                        {/* Brand Section */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'clamp(6px, 1.6vw, 10px)',
                                }}
                            >
                                <img
                                    src="/goodkart-icon-only.png"
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        height: 'clamp(36px, 8vw, 56px)',
                                        width: 'auto',
                                        objectFit: 'contain',
                                        flexShrink: 0,
                                    }}
                                />

                                <span
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        minWidth: 0,
                                    }}
                                >
                                    <img
                                        src="/goodkart-wordmark.png"
                                        alt="Goodkart"
                                        style={{
                                            height: 'clamp(20px, 4.4vw, 30px)',
                                            width: 'auto',
                                            maxWidth: '100%',
                                            objectFit: 'contain',
                                            display: 'block',
                                        }}
                                    />

                                    <img
                                        src="/goodkart-tagline.png"
                                        alt="Good Deals. Good Life"
                                        style={{
                                            height: 'clamp(8px, 1.7vw, 12px)',
                                            width: 'auto',
                                            maxWidth: '100%',
                                            objectFit: 'contain',
                                            display: 'block',
                                            marginTop: '2px',
                                        }}
                                    />
                                </span>
                            </div>

                            <p
                                className="text-muted"
                                style={{ lineHeight: 1.6 }}
                            >
                                The future of global marketplace. Fast, secure,
                                and seller-friendly.
                            </p>
                        </div>

                        {/* Marketplace */}
                        <div style={{ paddingLeft: '2rem' }}>
                            <h4
                                style={{
                                    fontWeight: 800,
                                    marginBottom: '1.5rem',
                                }}
                            >
                                Marketplace
                            </h4>

                            <ul
                                style={{ listStyle: 'none' }}
                                className="flex flex-col gap-3"
                            >
                                <li>
                                    <Link
                                        to="/products"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        All Products
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/products"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Categories
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/track"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Track Order
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div style={{ paddingLeft: '2rem' }}>
                            <h4
                                style={{
                                    fontWeight: 800,
                                    marginBottom: '1.5rem',
                                }}
                            >
                                Support
                            </h4>

                            <ul
                                style={{ listStyle: 'none' }}
                                className="flex flex-col gap-3"
                            >
                                <li>
                                    <Link
                                        to="/faq"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        FAQ
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/contact"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Consumer Policy */}
                        <div>
                            <h4
                                style={{
                                    fontWeight: 800,
                                    marginBottom: '1.5rem',
                                }}
                            >
                                Consumer Policy
                            </h4>

                            <ul
                                style={{ listStyle: 'none' }}
                                className="flex flex-col gap-3"
                            >
                                <li>
                                    <Link
                                        to="/cancellation-returns"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Cancellation &amp; Returns
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/terms-of-use"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Terms of Use
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/security"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Security
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/privacy"
                                        className="text-muted"
                                        style={{
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Privacy
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Management */}
                        <div>
                            <h4
                                style={{
                                    fontWeight: 800,
                                    marginBottom: '1.5rem',
                                }}
                            >
                                Management
                            </h4>

                            <ul
                                style={{ listStyle: 'none' }}
                                className="flex flex-col gap-3"
                            >
                                <li>
                                    <button
                                        onClick={() =>
                                            setIsAdminModalOpen(true)
                                        }
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
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <ShieldCheck size={16} />
                                        Management Login
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={() => {
                                            const rawUser =
                                                localStorage.getItem('user');

                                            if (!rawUser) {
                                                alert(
                                                    'Please login as a customer first to access the Seller Portal.'
                                                );
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
                                            display: 'inline',
                                        }}
                                    >
                                        Seller Portal
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Earn with Us */}
                        <div style={{ textAlign: 'center' }}>
                            {(() => {
                                const rawUser =
                                    localStorage.getItem('user');

                                const role = rawUser
                                    ? JSON.parse(rawUser).role
                                    : null;

                                if (role === 'SELLER') return null;

                                return (
                                    <>
                                        <h4
                                            style={{
                                                fontWeight: 800,
                                                marginBottom: '1.5rem',
                                            }}
                                        >
                                            Earn with Us
                                        </h4>

                                        <div
                                            style={{
                                                marginTop: '0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <button
                                                onClick={
                                                    handleBecomeSellerClick
                                                }
                                                className="btn btn-primary"
                                                style={{
                                                    cursor: 'pointer',
                                                    padding:
                                                        '0.75rem 1.5rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    borderRadius: '99px',
                                                    background: '#3B7CF1',
                                                    border: 'none',
                                                    color: 'white',
                                                }}
                                            >
                                                Become a Seller
                                            </button>

                                            <p
                                                className="text-muted"
                                                style={{
                                                    marginTop: '0.75rem',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                Open your shop in minutes.
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div
                        style={{
                            marginTop: '4rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--border)',
                            textAlign: 'center',
                        }}
                    >
                        <p
                            className="text-muted"
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                marginBottom: '0.5rem',
                            }}
                        >
                            &copy; 2026 Madhwa Infotech &amp; S S Inphinite LLP.
                            All rights reserved.
                        </p>

                        <p
                            className="text-muted"
                            style={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                margin: 0,
                            }}
                        >
                            Developed and Maintained by{' '}
                            <span style={{ fontWeight: 700 }}>
                                Madhwa Infotech
                            </span>{' '}
                            &amp;{' '}
                            <span style={{ fontWeight: 700 }}>
                                Vinidra Softech
                            </span>
                        </p>
                    </div>
                </div>
            </footer>

            <AdminLoginModal
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
            />
        </>
    );
}
