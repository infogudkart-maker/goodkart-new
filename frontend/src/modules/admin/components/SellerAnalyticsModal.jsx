import { X, Box, ShoppingCart, Package, DollarSign, TrendingUp, Download, Loader, ArrowLeft, RefreshCw, CreditCard, ChevronUp, ChevronDown, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import BankDetailsModal from './BankDetailsModal';
import SellerAnalyticsTable from './SellerAnalyticsTable';

export default function SellerAnalyticsModal({ seller, onClose, onDownloadPDF, isDownloading, onRefresh }) {
    if (!seller) return null;

    const [showBankDetails, setShowBankDetails] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ── Bank Details inline page ──
    if (showBankDetails) {
        return <BankDetailsModal seller={seller} onClose={() => setShowBankDetails(false)} />;
    }

    // Handle refresh with loading state
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            // Keep loading state for a bit to show feedback
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Truncate product names for chart display - only show products with revenue > 0
    const chartData = seller.productMatrix
        .filter(p => p.revenue > 0) // Only show products that have sales
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
        .slice(0, 10)
        .map(p => ({
            ...p,
            displayName: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
        }));

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex-1 flex flex-col" style={{ width: '100%', height: '100%' }}>
            {/* Header with Back Button */}
            <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white', borderRadius: '16px' }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 600 }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            <ArrowLeft size={20} />
                            Back to List
                        </button>
                        <div style={{ borderLeft: '2px solid rgba(255,255,255,0.3)', height: '40px', margin: '0 1rem' }}></div>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                                {seller.shopName}
                            </h2>
                            <div className="flex items-center gap-2" style={{ marginTop: '0.25rem' }}>
                                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {seller.category}
                                </span>
                                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Seller Analytics & Performance Dashboard</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBankDetails(true)}
                            className="btn"
                            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', fontWeight: 600 }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            <CreditCard size={18} />
                            Bank Details
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="btn"
                            style={{ 
                                padding: '0.75rem 1.5rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: isRefreshing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', 
                                color: 'white', 
                                border: 'none', 
                                fontWeight: 600,
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                opacity: isRefreshing ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !isRefreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                            onMouseOut={(e) => !isRefreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                        <button
                            onClick={() => onDownloadPDF(`/admin/seller/${seller.uid}/analytics-pdf`, `analytics_${(seller.shopName || 'seller').replace(/\s+/g, '_')}.pdf`)}
                            className="btn"
                            disabled={isDownloading}
                            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: 'var(--primary)', border: 'none', fontWeight: 600 }}
                        >
                            {isDownloading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Stat Cards with Click to Scroll */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <StatCardClickable
                        icon={<Box size={24} />}
                        value={seller.metrics.totalProducts}
                        label="Total Products"
                        color="rgba(24, 0, 173, 0.1)"
                        iconColor="var(--primary)"
                        onClick={() => scrollToSection('all-products-section')}
                    />
                    <StatCardClickable
                        icon={<ShoppingCart size={24} />}
                        value={seller.metrics.unitsSold}
                        label="Units Sold"
                        color="rgba(16, 185, 129, 0.1)"
                        iconColor="var(--success)"
                        onClick={() => scrollToSection('all-products-section')}
                    />
                    <StatCardClickable
                        icon={<Package size={24} />}
                        value={seller.metrics.totalStockLeft}
                        label="Stock Left"
                        color="rgba(245, 158, 11, 0.1)"
                        iconColor="var(--warning)"
                        onClick={() => scrollToSection('all-products-section')}
                    />
                    <StatCardClickable
                        icon={<DollarSign size={24} />}
                        value={`₹${seller.metrics.grossRevenue.toLocaleString()}`}
                        label="Total Revenue"
                        color="rgba(239, 68, 68, 0.1)"
                        iconColor="var(--error)"
                        onClick={() => scrollToSection('all-products-section')}
                    />
                </div>

                {/* Top Products by Revenue Chart */}
                {chartData.length > 0 ? (
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                            Top Products by Revenue
                        </h3>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis 
                                        dataKey="displayName" 
                                        tick={{ fontSize: 11 }} 
                                        angle={0}
                                        textAnchor="middle"
                                        height={60}
                                        interval={0}
                                    />
                                    <YAxis />
                                    <RechartsTooltip 
                                        contentStyle={{ 
                                            background: 'var(--surface)', 
                                            border: '1px solid var(--border)', 
                                            borderRadius: '8px',
                                            padding: '12px'
                                        }}
                                        formatter={(value, name) => {
                                            if (name === 'Revenue (₹)') return [`₹${value.toLocaleString()}`, name];
                                            return [value, name];
                                        }}
                                        labelFormatter={(label) => {
                                            const product = chartData.find(p => p.displayName === label);
                                            return `Product: ${product?.name || label}`;
                                        }}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        name="Revenue (₹)" 
                                        fill="var(--success)" 
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <TrendingUp size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            No Sales Data Yet
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Products will appear here once they generate revenue
                        </p>
                    </div>
                )}

                {/* All Products Table */}
                <SellerAnalyticsTable seller={seller} onDownloadPDF={onDownloadPDF} />
            </div>
        </div>
    );
}

function StatCardClickable({ icon, value, label, color, iconColor, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="glass-card" 
            style={{ padding: '1.5rem', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div className="flex items-center justify-between mb-3">
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: color, color: iconColor }}>
                    {icon}
                </div>
                <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                    View Details
                </button>
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {value}
            </h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>{label}</p>
        </div>
    );
}





