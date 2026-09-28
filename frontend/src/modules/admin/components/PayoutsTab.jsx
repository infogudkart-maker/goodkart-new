import { useState } from 'react';
import { Package, TrendingUp, Loader, Download } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function PayoutsTab({ analytics, setSelectedAnalyticsSeller, fetchAllData }) {
    const [payoutSearch, setPayoutSearch] = useState('');
    const [payoutCategory, setPayoutCategory] = useState('');
    const [payoutDate, setPayoutDate] = useState('');
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

    const handleDownloadPDF = async (url, filename) => {
        setIsDownloadingPDF(true);
        try {
            const response = await authFetch(url);
            if (!response.ok) { const text = await response.text(); throw new Error(text || 'Failed to download PDF'); }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF: ' + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    const filterSeller = (s) => {
        const matchesSearch = payoutSearch === '' ||
            (s.shopName || '').toLowerCase().includes(payoutSearch.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(payoutSearch.toLowerCase());
        const matchesCategory = payoutCategory === '' || s.category === payoutCategory;
        let matchesDate = true;
        if (payoutDate && s.createdAt) {
            const inputDate = new Date(payoutDate);
            const inputDDMMYYYY = `${String(inputDate.getDate()).padStart(2, '0')}/${String(inputDate.getMonth() + 1).padStart(2, '0')}/${inputDate.getFullYear()}`;
            matchesDate = s.joined === inputDDMMYYYY;
        }
        return matchesSearch && matchesCategory && matchesDate;
    };

    const thStyle = { padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface)' };

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="admin-tab-header flex justify-between items-center">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Seller Payouts & Analytics</h3>
                <div className="flex gap-2">
                    <input type="text" placeholder="Name or Email..." value={payoutSearch} onChange={(e) => setPayoutSearch(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '180px', fontSize: '0.8rem' }} />
                    <select value={payoutCategory} onChange={(e) => setPayoutCategory(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                        <option value="">All Categories</option>
                        {[...new Set(analytics.map(s => s.category))].sort().map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                    <input type="date" value={payoutDate} onChange={(e) => setPayoutDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} title="Filter by listing date" />
                    <button className="btn btn-secondary" onClick={() => { setPayoutSearch(''); setPayoutCategory(''); setPayoutDate(''); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
                    <button className="btn btn-secondary" onClick={fetchAllData}>Refresh</button>
                </div>
            </div>
            <div id="payout-table-container" className="glass-card" style={{ padding: 0, overflowY: 'auto', maxHeight: '600px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={thStyle}>Shop Overview</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Date Listed</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Products Listed</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Inventory (Stock)</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Units Sold</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Gross Payout</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.filter(filterSeller).length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{analytics.length === 0 ? 'No approved sellers with analytics data yet.' : 'No sellers found matching your search criteria.'}</td></tr>
                        ) : (
                            analytics.filter(filterSeller).map(s => (
                                <tr key={s.uid} style={{ borderBottom: '1px solid var(--border)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{s.shopName}</span>
                                            <span className="text-muted" style={{ fontSize: '0.65rem', marginTop: '2px' }}>{s.category} | {s.email}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}><span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{s.joined || 'N/A'}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{s.metrics.totalProducts}</span>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                        <div className="flex flex-col items-center"><Package size={11} className="text-muted mb-1" /><span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{s.metrics.totalStockLeft}</span></div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                        <div className="flex flex-col items-center"><TrendingUp size={11} className="text-primary mb-1" /><span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{s.metrics.unitsSold}</span></div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}><span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.75rem' }}>₹{s.metrics.grossRevenue.toLocaleString()}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                        <div className="flex gap-1 justify-center">
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => {
                                                    setSelectedAnalyticsSeller(s);
                                                }} 
                                                style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 600 }}
                                            >
                                                View
                                            </button>
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={() => handleDownloadPDF(`/admin/seller/${s.uid}/analytics-pdf`, `analytics_${(s.shopName || 'seller').replace(/\s+/g, '_')}.pdf`)} 
                                                disabled={isDownloadingPDF} 
                                                style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }} 
                                                title="Download PDF"
                                            >
                                                {isDownloadingPDF ? <Loader size={11} className="animate-spin" /> : <Download size={11} />} PDF
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

