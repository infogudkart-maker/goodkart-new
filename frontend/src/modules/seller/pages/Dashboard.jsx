import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, DollarSign, Plus, Truck, Loader, AlertCircle, X, User, LogOut, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';

import SellerOverviewTab from '@/modules/seller/components/dashboard/SellerOverviewTab';
import SellerProductsTab from '@/modules/seller/components/dashboard/SellerProductsTab';
import SellerOrdersTab from '@/modules/seller/components/dashboard/SellerOrdersTab';
import SellerProfileTab from '@/modules/seller/components/dashboard/SellerProfileTab';
import ProductViewModal from '@/modules/seller/components/dashboard/ProductViewModal';
import TrackOrderModal from '@/modules/seller/components/dashboard/TrackOrderModal';

// Helper to get current user UID (works for both Firebase and test login)
const getUserUid = () => {
    try {
        const userData = JSON.parse(localStorage.getItem('seller_user'));
        if (userData?.uid) {
            // Priority 1: Current seller session in localStorage
            return userData.uid;
        }
    } catch (e) { console.error("[SellerDashboard] Storage error:", e); }

    // Priority 2: Firebase auth (global)
    if (auth.currentUser) return auth.currentUser.uid;
    
    return null;
};

export default function SellerDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [sellerUid, setSellerUid] = useState(null);
    const [error, setError] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const profileRef = React.useRef(null);

    // Data States
    const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0, newOrders: 0, pendingOrders: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ name: '...', shopName: '' });

    // Modal States
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState(null);

    // Performance Analytics State
    const [performanceYear, setPerformanceYear] = useState('This Year');

    // Quota
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadDashboard = async () => {
            const uid = getUserUid();
            setSellerUid(uid);
            if (!uid) {
                console.warn("[SellerDashboard] No UID found in session.");
                setLoading(false);
                setError("Session expired. Please login again.");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await authFetch(`/seller/${uid}/dashboard-data`);

                if (response.status === 404) {
                    setError("Seller profile not found. Have you completed onboarding?");
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                if (data.success) {
                    const sellerProfile = data.profile || {};
                    setProfile(sellerProfile);
                    if (sellerProfile.name) {
                        localStorage.setItem('seller_userName', sellerProfile.name);
                        window.dispatchEvent(new CustomEvent('userDataChanged', { detail: sellerProfile }));
                    }
                    setStats(data.stats || { totalSales: 0, totalProducts: 0, newOrders: 0, pendingOrders: 0 });
                    setProducts(data.products || []);
                    setOrders(data.orders || []);
                    if (data.quotaExceeded) setQuotaExceeded(true);
                } else {
                    setError(data.message || "Failed to load dashboard data");
                }
            } catch (error) {
                console.error("[SellerDashboard] ERROR:", error);
                setError("Unable to connect to the server. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setShowViewModal(true);
    };

    const handleUpdateProduct = async (payloadData) => {
        const uid = sellerUid || getUserUid();
        if (!uid) return;

        const response = await authFetch(`/products/${selectedProduct.id}`, {
            method: 'PUT',
            body: JSON.stringify({ sellerId: uid, productData: payloadData })
        });
        const data = await response.json();
        if (data.success) {
            // Product updated - respect any server-side forcing of GST
            const updatedProduct = { 
                ...payloadData, 
                id: selectedProduct.id,
                gstPercent: data.forcedGst !== undefined ? data.forcedGst : payloadData.gstPercent
            };
            setSelectedProduct(updatedProduct);
            setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
        } else {
            alert("Failed to update: " + data.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const response = await authFetch(`/seller/product/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) setProducts(products.filter(p => p.id !== id));
            else alert("Failed to delete product");
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('[SellerDashboard] Error signing out:', error);
        }
        localStorage.removeItem('seller_user');
        localStorage.removeItem('seller_userName');
        localStorage.removeItem('seller_dob');
        sessionStorage.removeItem('loginContext');
        
        // Dispatch event for other potential listeners
        window.dispatchEvent(new CustomEvent('userDataChanged'));
        
        // FORCE a hard redirect to the seller landing page
        // Using window.location.href with the hash is the most reliable way to break out of the dashboard
        window.location.href = window.location.origin + '/#/seller';
        
        // Optional: force reload to clear any remaining in-memory state
        window.location.reload();
    };

    const handleDownloadLabel = async (orderId, awbNumber, existingLabelUrl) => {
        if (!awbNumber) { alert("AWB is not generated yet for this order."); return; }
        if (existingLabelUrl) { window.open(existingLabelUrl, '_blank'); return; }
        try {
            setLoading(true);
            const response = await authFetch(`/orders/${orderId}/label`);
            const data = await response.json();
            if (data.success && data.labelUrl) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, labelUrl: data.labelUrl } : o));
                window.open(data.labelUrl, '_blank');
            } else { alert(data.message || "Failed to fetch shipping label"); }
        } catch (error) {
            console.error("Error downloading label:", error);
            alert("Error trying to download shipping label.");
        } finally { setLoading(false); }
    };

    const statCards = [
        { label: 'Total Sales', value: `₹${stats?.totalSales?.toLocaleString() || 0}`, icon: <DollarSign />, color: 'var(--success)' },
        { label: 'Active Products', value: stats?.totalProducts || 0, icon: <Package />, color: 'var(--primary)' },
        { label: 'New Orders', value: stats?.newOrders || 0, icon: <ShoppingBag />, color: 'var(--secondary)' },
        { label: 'Pending', value: stats?.pendingOrders || 0, icon: <Truck />, color: 'var(--warning)' },
    ];

    try {
        if (loading) {
            return (
                <div className="flex flex-col justify-center items-center h-screen gap-4" style={{ background: 'var(--background)' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Loader className="animate-spin" size={40} color="var(--primary)" />
                        <span style={{ marginTop: '1rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em' }}>LOADING...</span>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', marginTop: '2rem' }}>Initializing your dashboard...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col justify-center items-center h-screen gap-6 p-8 text-center" style={{ background: 'var(--background)' }}>
                    <div style={{ padding: '2rem', background: 'var(--error)15', borderRadius: '50%', color: 'var(--error)' }}><AlertCircle size={64} /></div>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Error Loading Dashboard</h2>
                        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>{error}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => window.location.reload()} className="btn btn-secondary">Retry</button>
                        <Link to="/" className="btn btn-primary">Return Home</Link>
                    </div>
                </div>
            );
        }

        if (profile?.status === 'PENDING') {
            return (
                <div className="flex flex-col justify-center items-center h-screen gap-6 p-8 text-center" style={{ background: 'var(--background)' }}>
                    <div style={{ padding: '2rem', background: 'var(--warning)15', borderRadius: '50%', color: 'var(--warning)' }}><Truck size={64} /></div>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Application Pending</h2>
                        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>
                            Thanks for applying to be a seller! Your application is currently under review by our admin team.<br />You will be notified once it is approved.
                        </p>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Check Status</button>
                </div>
            );
        }

        if (profile?.status === 'REJECTED') {
            return (
                <div className="flex flex-col justify-center items-center h-screen gap-6 p-8 text-center" style={{ background: 'var(--background)' }}>
                    <div style={{ padding: '2rem', background: 'var(--error)15', borderRadius: '50%', color: 'var(--error)' }}><X size={64} /></div>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Application Rejected</h2>
                        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>We're sorry, but your seller application was not approved at this time.</p>
                    </div>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return to Home</Link>
                </div>
            );
        }

        return (
            <div className="flex relative" style={{ minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
                {/* Mobile sidebar overlay */}
                {isMobileSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar — Dark Obsidian */}
                <aside 
                    className={`fixed md:sticky top-0 left-0 z-50 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out h-screen`}
                    style={{
                        width: '280px', 
                        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                        padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
                        flexShrink: 0
                    }}>
                    
                    {/* Mobile Close Button */}
                    <button 
                        className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <LayoutDashboard size={22} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '10px', 
                                    background: 'rgba(255,255,255,0.1)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 800, fontSize: '1.1rem',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                }}>
                                    {(profile.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                        {profile.name || "Seller"}
                                    </h3>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 500 }}>
                                        Supplier Account
                                    </span>
                                </div>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-3">

                            {['overview', 'products', 'orders', 'personal'].map(tab => (
                                <button key={tab} onClick={() => { setActiveTab(tab); setIsMobileSidebarOpen(false); }} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '1rem', fontSize: '0.95rem', borderRadius: '12px', textTransform: 'capitalize',
                                    transition: 'all 0.2s ease',
                                    background: activeTab === tab ? 'var(--primary)' : 'transparent',
                                    color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.7)',
                                    fontWeight: activeTab === tab ? 600 : 400, border: 'none', cursor: 'pointer'
                                }}>
                                    {tab === 'overview' && <LayoutDashboard size={18} />}
                                    {tab === 'products' && <Package size={18} />}
                                    {tab === 'orders' && <ShoppingBag size={18} />}
                                    {tab === 'personal' && <User size={18} />}
                                    {tab === 'personal' ? 'Personal Details' : tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '1rem', fontSize: '0.95rem', borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                fontWeight: 600, border: 'none', cursor: 'pointer'
                            }}
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col" style={{ background: '#f8fafc', minHeight: '100vh', overflowY: 'auto' }}>
                    
                    {/* Sticky Header */}
                    <header className="px-4 py-4 md:px-12 md:py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm" style={{
                        background: 'white',
                        borderBottom: '1px solid #e2e8f0',
                    }}>
                        <div className="flex items-center gap-3 md:gap-4">
                            <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100" onClick={() => setIsMobileSidebarOpen(true)}>
                                <Menu size={24} color="#1e293b" />
                            </button>
                            <h2 className="text-lg md:text-2xl font-extrabold text-slate-800 m-0">
                                {activeTab === 'overview' ? 'Dashboard Overview' : 
                                 activeTab === 'products' ? 'Product Management' :
                                 activeTab === 'orders' ? 'Order Management' : 'Seller Profile'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{profile.name || "Seller"}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{profile.shopName || "Verified Seller"}</span>
                            </div>

                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: 'var(--primary)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(123, 77, 219, 0.3)'
                                    }}
                                >
                                    {(profile.name || 'S').charAt(0).toUpperCase()}
                                </button>

                                {isProfileOpen && (
                                    <div style={{
                                        position: 'absolute', right: 0, mt: '0.75rem', top: '100%',
                                        width: '200px', backgroundColor: 'white', borderRadius: '16px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                        border: '1px solid #f1f5f9', padding: '0.5rem',
                                        marginTop: '10px'
                                    }}>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Account</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</p>
                                        </div>
                                        <button
                                            onClick={() => { setActiveTab('personal'); setIsProfileOpen(false); }}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#475569',
                                                borderRadius: '8px', border: 'none', background: 'transparent',
                                                cursor: 'pointer', textAlign: 'left'
                                            }}
                                            className="hover:bg-gray-50"
                                        >
                                            <User size={16} /> My Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#ef4444',
                                                borderRadius: '8px', border: 'none', background: 'transparent',
                                                cursor: 'pointer', textAlign: 'left', fontWeight: 600
                                            }}
                                            className="hover:bg-red-50"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="p-4 md:p-12 flex flex-col gap-6 md:gap-8">
                        {quotaExceeded && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex items-start md:items-center gap-3 text-sm md:text-base">
                                <AlertCircle size={20} className="shrink-0 mt-0.5 md:mt-0" />
                                <div><strong>Cloud Database Quota Exceeded.</strong> You are currently seeing limited/cached demo data. Real-time updates may be restricted until the quota resets.</div>
                            </motion.div>
                        )}

                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-1">
                                    {activeTab === 'overview' ? 'Performance Summary' : 
                                     activeTab === 'products' ? 'Inventory' :
                                     activeTab === 'orders' ? 'Shipments' : 'Business Credentials'}
                                </h2>
                                <p className="text-slate-500 text-sm md:text-base">Manage your <span className="font-semibold text-primary">{activeTab}</span> activities below.</p>
                            </div>
                            {activeTab === 'products' && (
                                <button className="btn btn-primary shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 px-6 py-3 rounded-full w-full md:w-auto" onClick={() => navigate('/seller/add-product')}>
                                    <Plus size={20} /> New Product
                                </button>
                            )}
                        </div>

                        {activeTab === 'overview' && statCards && (
                            <SellerOverviewTab statCards={statCards} orders={orders || []} performanceYear={performanceYear} setPerformanceYear={setPerformanceYear} />
                        )}
                        {activeTab === 'products' && (
                            <SellerProductsTab products={products || []} onViewProduct={handleViewProduct} onDeleteProduct={handleDeleteProduct} />
                        )}
                        {activeTab === 'orders' && (
                            <SellerOrdersTab orders={orders || []} onTrackOrder={(o) => { setTrackingOrder(o); setShowTrackModal(true); }} />
                        )}
                        {activeTab === 'personal' && profile && (
                            <SellerProfileTab profile={profile} sellerUid={sellerUid} />
                        )}
                    </div>
                </div>

                {/* Product Removal/Restoration Notification Banner */}
                {profile?.productRemovedNotification?.seen === false && (
                    <div className="admin-toast" style={{
                        position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                        background: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxWidth: '380px',
                        border: profile.productRemovedNotification.type === 'REMOVAL' ? '1.5px solid #fee2e2' : '1.5px solid #dcfce7',
                        animation: 'fadeInUp 0.3s ease-out',
                        display: 'flex', gap: '12px', alignItems: 'flex-start'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: profile.productRemovedNotification.type === 'REMOVAL' ? '#fef2f2' : '#f0fdf4',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            {profile.productRemovedNotification.type === 'REMOVAL' ? <X size={22} color="#ef4444" /> : <Package size={22} color="#22c55e" />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                                Product {profile.productRemovedNotification.type === 'REMOVAL' ? 'Removed' : 'Restored'}
                            </p>
                            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                Your product <strong>{profile.productRemovedNotification.productName}</strong> has been {profile.productRemovedNotification.type === 'REMOVAL' ? 'removed from the store by admin.' : 'restored and is now active.'}
                            </p>
                            <button
                                onClick={async () => {
                                    try {
                                        const uid = sellerUid || getUserUid();
                                        if (uid) {
                                            await authFetch(`/seller/${uid}/product-notification-seen`, { method: 'PUT' });
                                            setProfile(prev => ({
                                                ...prev,
                                                productRemovedNotification: { ...prev.productRemovedNotification, seen: true }
                                            }));
                                        }
                                    } catch (e) { console.error(e); }
                                }}
                                style={{
                                    marginTop: '0.75rem', padding: '0.4rem 1rem',
                                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                <ProductViewModal
                    show={showViewModal}
                    selectedProduct={selectedProduct}
                    onClose={() => { setShowViewModal(false); setSelectedProduct(null); }}
                    onUpdateProduct={handleUpdateProduct}
                    products={products}
                    setProducts={setProducts}
                    setSelectedProduct={setSelectedProduct}
                    sellerProfile={profile}
                />

                <TrackOrderModal
                    show={showTrackModal}
                    trackingOrder={trackingOrder}
                    onClose={() => setShowTrackModal(false)}
                    onDownloadLabel={handleDownloadLabel}
                />
            </div>
        );
    } catch (err) {
        console.error("[SellerDashboard] FATAL RENDER ERROR:", err);
        return (
            <div className="p-20 text-center">
                <h1 style={{ color: 'red' }}>Component Crash Detected</h1>
                <pre style={{ background: '#eee', padding: '20px', textAlign: 'left' }}>{err.message}</pre>
                <button onClick={() => window.location.reload()} className="btn btn-primary">Refresh App</button>
            </div>
        );
    }
}


