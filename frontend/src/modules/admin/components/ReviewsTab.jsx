import { useState } from 'react';
import { X } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function ReviewsTab({ reviews, fetchAllData }) {
    const [feedbackSearch, setFeedbackSearch] = useState('');
    const [selectedFeedbackDate, setSelectedFeedbackDate] = useState('');

    const handleDeleteReview = async (reviewId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this review? This action cannot be undone.');
        if (!confirmDelete) return;
        try {
            const response = await authFetch(`/admin/review/${reviewId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorText = await response.text();
                alert(`Failed to delete review: ${response.status} ${response.statusText}`);
                return;
            }
            const data = await response.json();
            if (data.success) {
                alert('✅ Review deleted successfully! The product rating has been updated.');
                fetchAllData();
            } else {
                alert(`❌ Failed to delete review: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('[DeleteReview] Exception:', err);
            alert(`Error deleting review: ${err.message}.`);
        }
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = feedbackSearch === '' ||
            r.productName.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
            r.customerName.toLowerCase().includes(feedbackSearch.toLowerCase());
        const matchesDate = selectedFeedbackDate === '' || r.date === (() => {
            const date = new Date(selectedFeedbackDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        })();
        return matchesSearch && matchesDate;
    });

    const thStyle = { padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)' };

    const getProductStatusBadge = (status) => {
        if (status === 'INACTIVE') return { label: 'Inactive', bg: '#fef2f2', color: '#dc2626' };
        if (status === 'OUT_OF_STOCK') return { label: 'Out of Stock', bg: '#fffbeb', color: '#d97706' };
        return { label: 'Active', bg: '#f0fdf4', color: '#16a34a' };
    };

    return (
        <div className="animate-fade-in flex flex-col gap-4">
            <div className="admin-tab-header flex justify-between items-center">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Customer Reviews ({reviews.length})</h3>
                <div className="flex gap-2">
                    <input type="text" placeholder="Search by product or customer..." value={feedbackSearch} onChange={(e) => setFeedbackSearch(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', width: '200px', fontSize: '0.8rem' }} />
                    <input type="date" value={selectedFeedbackDate} onChange={(e) => setSelectedFeedbackDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} title="Filter by review date" />
                    <button className="btn btn-secondary" onClick={() => { setFeedbackSearch(''); setSelectedFeedbackDate(''); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
                    <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Refresh</button>
                </div>
            </div>
            <div id="feedback-table-container" className="glass-card" style={{ padding: 0, overflowY: 'scroll', maxHeight: '600px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={thStyle}>Product Details</th>
                            <th style={thStyle}>Customer</th>
                            <th style={thStyle}>Rating</th>
                            <th style={thStyle}>Review</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Date</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReviews.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{feedbackSearch || selectedFeedbackDate ? 'No reviews found matching your search criteria.' : 'No customer reviews yet.'}</td></tr>
                        ) : (
                            filteredReviews.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        <div className="flex items-start gap-2">
                                            {/* Product Image */}
                                            <div style={{ 
                                                width: '60px', 
                                                height: '60px', 
                                                borderRadius: '6px', 
                                                overflow: 'hidden', 
                                                border: '1px solid var(--border)',
                                                flexShrink: 0,
                                                background: 'var(--surface)'
                                            }}>
                                                {r.productImage ? (
                                                    <img 
                                                        src={r.productImage} 
                                                        alt={r.productName}
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'cover' 
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface);color:var(--text-muted);font-size:0.6rem;text-align:center;padding:4px;">No Image</div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        background: 'var(--surface)',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.6rem',
                                                        textAlign: 'center',
                                                        padding: '4px'
                                                    }}>
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            {/* Product Details */}
                                            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{r.productName}</span>
                                                <div className="flex gap-2" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                    <span>Category: <strong>{r.productCategory}</strong></span>
                                                    <span>Brand: <strong>{r.productBrand}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
                                                    <div style={{ display: 'flex', gap: '1px' }}>
                                                        {[...Array(5)].map((_, i) => (<span key={i} style={{ color: i < Math.round(r.productAvgRating) ? '#fbbf24' : '#d1d5db', fontSize: '0.7rem' }}>★</span>))}
                                                    </div>
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>{r.productAvgRating.toFixed(1)} ({r.productReviewCount})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{r.customerName}</span>
                                                {r.verified && (<span title="Verified Purchase" style={{ color: '#10b981', background: '#10b98115', padding: '2px 4px', borderRadius: '3px', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>)}
                                            </div>
                                            <span className="text-muted" style={{ fontSize: '0.6rem' }}>ID: {r.customerId?.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', gap: '1px' }}>
                                                {[...Array(5)].map((_, i) => (<span key={i} style={{ color: i < r.rating ? '#fbbf24' : '#d1d5db', fontSize: '0.9rem' }}>★</span>))}
                                            </div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: r.rating >= 4 ? 'var(--success)' : r.rating >= 3 ? 'var(--warning)' : 'var(--error)' }}>{r.rating}/5</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', maxWidth: '300px' }}>
                                        <div className="flex flex-col gap-1">
                                            {r.title && (<span style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text)', marginBottom: '2px' }}>"{r.title}"</span>)}
                                            <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>{r.body ? (r.body.length > 120 ? r.body.substring(0, 120) + '...' : r.body) : 'No review text provided'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        {(() => { const s = getProductStatusBadge(r.productStatus); return <span style={{ padding: '4px 8px', background: s.bg, color: s.color, borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.label}</span>; })()}
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}><span className="text-muted" style={{ fontSize: '0.65rem' }}>{r.date}</span></td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                        <button className="btn btn-secondary" onClick={() => handleDeleteReview(r.id)} title="Delete Review" style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', alignItems: 'center', gap: '3px' }}><X size={11} /> Remove</button>
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

