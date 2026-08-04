import { useState } from 'react';
import { User, Loader, Download } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function InvoicesTab({ allSellers, setSelectedInvoiceSeller, fetchAllData }) {
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceCategory, setInvoiceCategory] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

    const approvedSellers = allSellers.filter(s => s.status === 'APPROVED');

    // Calculate weekly sales from financials data
    const calculateWeeklySales = (seller) => {
        if (!seller.financials || !seller.financials.weeklySales) return '0';
        return seller.financials.weeklySales.toLocaleString();
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const filterSeller = (s) => {
        const matchesSearch = invoiceSearch === '' ||
            (s.shopName || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(invoiceSearch.toLowerCase());
        const matchesCategory = invoiceCategory === '' || s.category === invoiceCategory;
        let matchesDate = true;
        if (invoiceDate) {
            const inputDate = new Date(invoiceDate);
            const inputDDMMYYYY = `${String(inputDate.getDate()).padStart(2, '0')}/${String(inputDate.getMonth() + 1).padStart(2, '0')}/${inputDate.getFullYear()}`;
            matchesDate = s.joined === inputDDMMYYYY;
        }
        return matchesSearch && matchesCategory && matchesDate;
    };

    const thStyle = { padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface)' };

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="admin-tab-header flex justify-between items-center">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Seller Invoices</h3>
                <div className="flex gap-2">
                    <input type="text" placeholder="Search Seller" value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '200px', fontSize: '0.8rem' }} />
                    <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} title="Filter by join date" />
                    <select value={invoiceCategory} onChange={(e) => setInvoiceCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <option value="">All Categories</option>
                        {[...new Set(approvedSellers.map(s => s.category))].sort().map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                    <button className="btn btn-secondary" onClick={() => { setInvoiceSearch(''); setInvoiceCategory(''); setInvoiceDate(''); }} style={{ padding: '0.5rem 1rem' }}>Clear</button>
                    <button className="btn btn-secondary" onClick={fetchAllData}>Refresh</button>
                </div>
            </div>
            <div className="glass-card" style={{ padding: 0, overflowY: 'auto', maxHeight: '600px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={thStyle}>Seller</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Category</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Join Date</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Products</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Weekly Sales</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedSellers.filter(filterSeller).length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sellers found.</td></tr>
                        ) : (
                            approvedSellers.filter(filterSeller).map(s => (
                                <tr key={s.uid} style={{ borderBottom: '1px solid var(--border)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{s.shopName}</span>
                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>{s.email}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}><span style={{ padding: '4px 8px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>{s.category}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}><span style={{ fontSize: '0.7rem' }}>{s.joined || formatDate(s.createdAt)}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}><span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{s.financials?.totalProducts || 0}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}><span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.7rem' }}>₹{calculateWeeklySales(s)}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                        <div className="flex gap-1 justify-center">
                                            <button className="btn btn-secondary" onClick={() => setSelectedInvoiceSeller(s)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}><User size={11} /> View Details</button>
                                            <button className="btn btn-primary" onClick={() => handleDownloadPDF(`/admin/seller/${s.uid}/pdf`, `invoice_${(s.shopName || 'seller').replace(/\s+/g, '_')}.pdf`)} disabled={isDownloadingPDF} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
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

