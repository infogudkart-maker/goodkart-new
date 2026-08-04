import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Users, Box, Truck, AlertOctagon, Loader, Home, Mail, DollarSign, FileText, Settings } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import SellerAnalyticsModal from '@/modules/admin/components/SellerAnalyticsModal';
import SellerInvoiceModal from '@/modules/admin/components/SellerInvoiceModal';
import OverviewTab from '@/modules/admin/components/OverviewTab';
import SellersTab from '@/modules/admin/components/SellersTab';
import ProductsTab from '@/modules/admin/components/ProductsTab';
import OrdersTab from '@/modules/admin/components/OrdersTab';
import ReviewsTab from '@/modules/admin/components/ReviewsTab';
import PayoutsTab from '@/modules/admin/components/PayoutsTab';
import InvoicesTab from '@/modules/admin/components/InvoicesTab';
import PlatformSettingsTab from '@/modules/admin/components/PlatformSettingsTab';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data states
    const [stats, setStats] = useState({
        totalSellers: 0, totalProducts: 0, todayOrders: 0,
        pendingApprovals: 0, totalFeedback: 0, ordersToDeliver: 0, allSellers: 0
    });
    const [sellers, setSellers] = useState([]);
    const [allSellers, setAllSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [selectedAnalyticsSeller, setSelectedAnalyticsSeller] = useState(null);
    const [selectedInvoiceSeller, setSelectedInvoiceSeller] = useState(null);
    const [invoiceFilterDateFrom, setInvoiceFilterDateFrom] = useState('');
    const [invoiceFilterDateTo, setInvoiceFilterDateTo] = useState('');
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductDate, setSelectedProductDate] = useState('');

    // Track which tabs have already been loaded
    const [loadedTabs, setLoadedTabs] = useState(new Set());
    const contentRef = useRef(null);

    // Update selected invoice seller when allSellers data changes
    useEffect(() => {
        if (selectedInvoiceSeller && allSellers.length > 0) {
            const updatedSeller = allSellers.find(s => s.uid === selectedInvoiceSeller.uid);
            if (updatedSeller) {
                setSelectedInvoiceSeller(updatedSeller);
            }
        }
    }, [allSellers]);

    // Update selected analytics seller when analytics data changes
    useEffect(() => {
        if (selectedAnalyticsSeller && analytics.length > 0) {
            const updatedSeller = analytics.find(s => s.uid === selectedAnalyticsSeller.uid);
            if (updatedSeller) {
                setSelectedAnalyticsSeller(updatedSeller);
            }
        }
    }, [analytics]);

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    // Lazy-load tab data when active tab changes
    useEffect(() => {
        if (activeTab === 'home') return;
        if (!loadedTabs.has(activeTab)) {
            fetchTabData(activeTab);
        }
    }, [activeTab]);

    const safeFetch = (path, opts = {}, timeoutMs = 15000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return authFetch(path, { ...opts, signal: controller.signal })
            .then(r => { clearTimeout(timer); return r; })
            .catch(e => { clearTimeout(timer); throw e; });
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            setLoading(true);
            const res = await safeFetch('/admin/stats');
            if (res.ok) {
                const d = await res.json();
                if (d.success) {
                    setStats(prev => ({
                        ...prev, ...d.stats,
                        allSellers: d.stats.totalSellers,
                        ordersToDeliver: d.stats.ordersToDeliver || prev.ordersToDeliver
                    }));
                }
            } else {
                const d = await res.json().catch(() => ({}));
                console.warn('[fetchStats] non-ok response:', res.status, d.message);
                if (res.status === 401 || res.status === 403) {
                    setError(d.message || 'Access denied. Please login again as admin.');
                }
            }
        } catch (err) {
            console.warn('[fetchStats] failed:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async (tab, force = false) => {
        if (!force && loadedTabs.has(tab)) return;
        setLoading(true);
        setError('');
        try {
            if (tab === 'sellers') {
                const timestamp = Date.now(); // Cache buster
                const [sellersRes, allSellersRes] = await Promise.allSettled([
                    safeFetch(`/admin/sellers?_t=${timestamp}`),
                    safeFetch(`/admin/all-sellers?_t=${timestamp}`),
                ]);
                if (sellersRes.status === 'fulfilled' && sellersRes.value.ok) {
                    const d = await sellersRes.value.json();
                    if (d.success) setSellers(d.sellers);
                }
                if (allSellersRes.status === 'fulfilled' && allSellersRes.value.ok) {
                    const d = await allSellersRes.value.json();
                    if (d.success) {
                        setAllSellers(d.sellers);
                        if (selectedInvoiceSeller) {
                            const updated = d.sellers.find(s => s.uid === selectedInvoiceSeller.uid);
                            if (updated) {
                                setSelectedInvoiceSeller(updated);
                            }
                        }
                    }
                }
            } else if (tab === 'products') {
                const res = await safeFetch('/admin/products');
                if (res.ok) { const d = await res.json(); if (d.success) setProducts(d.products); }
            } else if (tab === 'orders') {
                const res = await safeFetch('/admin/orders');
                if (res.ok) {
                    const d = await res.json();
                    if (d.success) {
                        setOrders(d.orders);
                        const toDeliver = d.orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
                        setStats(prev => ({ ...prev, ordersToDeliver: toDeliver }));
                    }
                }
            } else if (tab === 'feedback') {
                const res = await safeFetch('/admin/reviews');
                if (res.ok) {
                    const d = await res.json();
                    if (d.success) {
                        setReviews(d.reviews);
                        setStats(prev => ({ ...prev, totalFeedback: d.reviews.length }));
                    }
                }
            } else if (tab === 'payouts' || tab === 'payout' || tab === 'invoice' || tab === 'invoices') {
                const timestamp = Date.now(); // Cache buster
                const res = await safeFetch(`/admin/seller-analytics?_t=${timestamp}`);
                if (res.ok) {
                    const d = await res.json();
                    if (d.success && d.analytics) {
                        setAnalytics(d.analytics);
                        if (selectedAnalyticsSeller) {
                            const updated = d.analytics.find(s => s.uid === selectedAnalyticsSeller.uid);
                            if (updated) {
                                setSelectedAnalyticsSeller(updated);
                            }
                        }
                    }
                }
                // Also fetch all sellers for invoice tab
                const allSellersRes = await safeFetch(`/admin/all-sellers?_t=${timestamp}`);
                if (allSellersRes.ok) {
                    const d = await allSellersRes.json();
                    if (d.success) {
                        setAllSellers(d.sellers);
                        if (selectedInvoiceSeller) {
                            const updated = d.sellers.find(s => s.uid === selectedInvoiceSeller.uid);
                            if (updated) {
                                setSelectedInvoiceSeller(updated);
                            }
                        }
                    }
                }
            }
            setLoadedTabs(prev => new Set([...prev, tab]));
        } catch (err) {
            console.error(`[fetchTabData:${tab}] error:`, err);
            setError('Failed to load data. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        // Clear the loaded tabs cache to force refetch
        setLoadedTabs(new Set());
        
        await Promise.all([
            fetchStats(),
            fetchTabData(activeTab, true) // Force refresh
        ]);
    };

    const handleDownloadPDF = async (url, filename) => {
        setIsDownloadingPDF(true);
        try {
            const response = await authFetch(url);
            if (!response.ok) { const text = await response.text(); throw new Error(text || 'Failed to download PDF'); }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl; link.download = filename;
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF: ' + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    if (error) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--error)', marginBottom: '1rem', background: 'rgba(var(--error-rgb), 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    <AlertOctagon size={48} style={{ margin: '0 auto 1rem' }} />
                    <p>{error}</p>
                </div>
                <button className="btn btn-primary" onClick={fetchAllData}>Retry Connection</button>
            </div>
        );
    }

    const tabs = [
        { key: 'home', label: 'Home', icon: <Home size={20} /> },
        { key: 'sellers', label: 'Seller Management', icon: <Users size={20} /> },
        { key: 'products', label: 'Product Review', icon: <Box size={20} /> },
        { key: 'orders', label: 'Global Orders', icon: <Truck size={20} /> },
        { key: 'feedback', label: 'Customer Feedback', icon: <Mail size={20} /> },
        { key: 'payout', label: 'Payout', icon: <DollarSign size={20} /> },
        { key: 'invoice', label: 'Seller Invoice', icon: <FileText size={20} /> },
        { key: 'settings', label: 'Platform Settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="admin-shell" style={{ 
            minHeight: '100vh',
            width: '100%',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}>
            <div className="admin-shell-inner flex" style={{ 
                width: '100%', 
                maxWidth: '1800px',
                margin: '0 auto',
                gap: '2rem'
            }}>
            {selectedAnalyticsSeller ? (
                <SellerAnalyticsModal
                    seller={selectedAnalyticsSeller}
                    onClose={() => setSelectedAnalyticsSeller(null)}
                    onDownloadPDF={handleDownloadPDF}
                    isDownloading={isDownloadingPDF}
                    onRefresh={fetchAllData}
                />
            ) : selectedInvoiceSeller ? (
                <SellerInvoiceModal
                    seller={selectedInvoiceSeller}
                    onClose={() => setSelectedInvoiceSeller(null)}
                    onDownloadPDF={handleDownloadPDF}
                    isDownloading={isDownloadingPDF}
                    onRefresh={fetchAllData}
                    invoiceFilterDateFrom={invoiceFilterDateFrom}
                    setInvoiceFilterDateFrom={setInvoiceFilterDateFrom}
                    invoiceFilterDateTo={invoiceFilterDateTo}
                    setInvoiceFilterDateTo={setInvoiceFilterDateTo}
                />
            ) : (
                <>
                    {/* Sidebar */}
                    <aside className="admin-sidebar" style={{ 
                        width: '260px', 
                        minWidth: '260px',
                        height: 'fit-content',
                        padding: '1.5rem', 
                        position: 'sticky', 
                        top: '2rem',
                        background: 'white',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}>
                        <div>
                            <div className="admin-sidebar-title flex items-center gap-2" style={{ 
                                marginBottom: '1.5rem', 
                                color: 'var(--primary)', 
                                paddingBottom: '1.25rem', 
                                borderBottom: '1px solid #f1f5f9'
                            }}>
                                <ShieldCheck size={26} />
                                <h3 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>Admin Panel</h3>
                            </div>
                            <nav className="admin-nav flex flex-col gap-2">
                                {tabs.map(t => (
                                    <button
                                        key={t.key}
                                        className={`admin-nav-btn btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ 
                                            width: '100%', 
                                            justifyContent: 'flex-start', 
                                            padding: '0.875rem 1.25rem', 
                                            fontSize: '0.95rem',
                                            fontWeight: activeTab === t.key ? 600 : 500,
                                            borderRadius: '14px',
                                            border: activeTab === t.key ? 'none' : '1px solid #f1f5f9',
                                            background: activeTab === t.key ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'white',
                                            color: activeTab === t.key ? 'white' : '#334155',
                                            transition: 'all 0.2s ease',
                                            boxShadow: activeTab === t.key ? '0 4px 12px rgba(123, 77, 219, 0.25)' : 'none',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem'
                                        }}
                                        onClick={() => { setActiveTab(t.key); setSearchTerm(''); }}
                                        onMouseEnter={(e) => {
                                            if (activeTab !== t.key) {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeTab !== t.key) {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#f1f5f9';
                                            }
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{t.icon}</span>
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="admin-main flex-1" style={{ minWidth: 0 }}>
                        {loading ? (
                            <div style={{ 
                                background: 'white', 
                                borderRadius: '20px', 
                                padding: '3rem', 
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                            }}>
                                <Loader className="animate-spin" />
                            </div>
                        ) : (
                            <div ref={contentRef} className="admin-content" style={{ 
                                padding: activeTab === 'home' ? '0' : '1.5rem', 
                                background: activeTab === 'home' ? 'transparent' : 'white',
                                borderRadius: activeTab === 'home' ? '0' : '20px',
                                boxShadow: activeTab === 'home' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                minHeight: activeTab === 'home' ? 'auto' : '600px'
                            }}>
                                {activeTab === 'home' && <OverviewTab stats={stats} loading={loading} setActiveTab={setActiveTab} setSearchTerm={setSearchTerm} setSelectedProductDate={setSelectedProductDate} />}
                                    {activeTab === 'sellers' && <SellersTab sellers={sellers} allSellers={allSellers} orders={orders} loading={loading} fetchAllData={fetchAllData} scrollToTop={() => { if (contentRef.current) contentRef.current.scrollTop = 0; }} />}
                                    {activeTab === 'products' && <ProductsTab products={products} fetchAllData={fetchAllData} />}
                                    {activeTab === 'orders' && <OrdersTab orders={orders} fetchAllData={fetchAllData} />}
                                    {activeTab === 'feedback' && <ReviewsTab reviews={reviews} fetchAllData={fetchAllData} />}
                                    {activeTab === 'payout' && <PayoutsTab analytics={analytics} setSelectedAnalyticsSeller={setSelectedAnalyticsSeller} fetchAllData={fetchAllData} />}
                                    {activeTab === 'invoice' && <InvoicesTab allSellers={allSellers} setSelectedInvoiceSeller={setSelectedInvoiceSeller} fetchAllData={fetchAllData} />}
                                    {activeTab === 'settings' && <PlatformSettingsTab />}
                            </div>
                        )}
                    </div>
                </>
            )}
            </div>
        </div>
    );
}

