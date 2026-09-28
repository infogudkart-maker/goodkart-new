import { useState, useEffect } from 'react';
import { Box, Check, X, Edit } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import SellerDetailModal from '@/modules/admin/components/SellerDetailModal';
import SellerEditModal from '@/modules/admin/components/SellerEditModal';

export default function SellersTab({
    sellers,
    allSellers,
    orders,
    loading,
    fetchAllData,
    scrollToTop,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [selectedJoinDate, setSelectedJoinDate] = useState('');
    const [selectedRejectDate, setSelectedRejectDate] = useState('');
    const [selectedRejectCategory, setSelectedRejectCategory] = useState('');
    const [selectedBlockDate, setSelectedBlockDate] = useState('');
    const [selectedBlockCategory, setSelectedBlockCategory] = useState('');
    const [editSearchTerm, setEditSearchTerm] = useState('');
    const [editSearchCategory, setEditSearchCategory] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [editingSeller, setEditingSeller] = useState(null);
    const [sellersWithEditRequests, setSellersWithEditRequests] = useState([]);
    const [editRequestsLoading, setEditRequestsLoading] = useState(false);

    const approvedSellers = allSellers.filter(s => s.status === 'APPROVED' && !s.isBlocked);
    const pendingSellers = sellers;
    const rejectedSellers = allSellers.filter(s => s.status === 'REJECTED' && !s.isBlocked);
    const blockedSellers = allSellers.filter(s => s.isBlocked);

    // Fetch sellers with edit requests
    useEffect(() => {
        fetchSellersWithEditRequests();
    }, []);

    const fetchSellersWithEditRequests = async () => {
        setEditRequestsLoading(true);
        try {
            const response = await authFetch('/admin/sellers-edit-requests');
            if (!response.ok) {
                console.error('Edit requests fetch failed with status:', response.status);
                setSellersWithEditRequests([]);
                return;
            }
            const data = await response.json();
            if (data.success) {
                setSellersWithEditRequests(data.sellers || []);
            } else {
                console.warn('Failed to fetch sellers with edit requests:', data.message);
                setSellersWithEditRequests([]);
            }
        } catch (error) {
            console.error('Error fetching sellers with edit requests:', error);
            setSellersWithEditRequests([]);
        } finally {
            setEditRequestsLoading(false);
        }
    };

    const calculateWeeklySales = (sellerUid) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return orders.reduce((total, order) => {
            const orderDate = new Date(order.date);
            if (orderDate >= oneWeekAgo && Array.isArray(order.items)) {
                const sellerItems = order.items.filter(item => item.sellerId === sellerUid);
                const salesForSeller = sellerItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                return total + salesForSeller;
            }
            return total;
        }, 0);
    };

    const handleApproveSeller = async (uid) => {
        try {
            const response = await authFetch(`/admin/seller/${uid}/approve`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert('? Seller approved successfully! The seller has been notified via email.');
                setSelectedSeller(null);
                fetchAllData();
            } else {
                alert('? Failed to approve seller: ' + data.message);
            }
        } catch (err) {
            console.error('Error approving seller:', err);
            alert('? Error approving seller. Please try again.');
        }
    };

    const handleRejectSeller = async (uid) => {
        const confirmReject = window.confirm('Are you sure you want to reject this seller application? The seller will be notified via email.');
        if (!confirmReject) return;
        try {
            const response = await authFetch(`/admin/seller/${uid}/reject`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert('? Seller rejected. The seller has been notified via email.');
                setSelectedSeller(null);
                fetchAllData();
            } else {
                alert('? Failed to reject seller: ' + data.message);
            }
        } catch (err) {
            console.error('Error rejecting seller:', err);
            alert('? Error rejecting seller. Please try again.');
        }
    };

    const handleBlockSeller = async (uid, duration) => {
        try {
            const response = await authFetch(`/admin/seller/${uid}/block`, {
                method: 'POST',
                body: JSON.stringify({ blockDuration: duration })
            });
            const data = await response.json();
            if (data.success) {
                alert('? Seller blocked successfully! The seller has been notified via email.');
                setSelectedSeller(null);
                fetchAllData();
            } else alert('? Failed to block seller: ' + data.message);
        } catch (err) {
            console.error('Error blocking seller:', err);
            alert('? Error blocking seller. Please try again.');
        }
    };

    const handleUnblockSeller = async (uid) => {
        if (!confirm('Are you sure you want to unblock this seller? They will be moved to Pending Approvals.')) return;
        try {
            const response = await authFetch(`/admin/seller/${uid}/unblock`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert(`? Seller unblocked successfully! The seller has been moved to Pending Approvals.`);
                fetchAllData();
            } else {
                alert('? Failed to unblock seller: ' + data.message);
            }
        } catch (err) {
            console.error('Error unblocking seller:', err);
            alert('? Error unblocking seller. Please try again.');
        }
    };

    const handleDeleteSeller = async (uid, shopName) => {
        if (!confirm(`?? WARNING: This will permanently delete the seller "${shopName}" and ALL their data including:\n\n� All products\n� All reviews\n� Seller account\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?`)) return;
        try {
            const response = await authFetch(`/admin/seller/${uid}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(`? Seller deleted successfully!\n\nDeleted:\n� 1 seller account\n� ${data.deletedProducts} products\n� Related reviews`);
                fetchAllData();
            } else {
                alert('? Failed to delete seller: ' + data.message);
            }
        } catch (err) {
            console.error('Error deleting seller:', err);
            alert('? Error deleting seller. Please try again.');
        }
    };

    const handleDeleteAllBlockedSellers = async () => {
        const blockedCount = allSellers.filter(s => s.isBlocked).length;
        if (blockedCount === 0) { alert('?? No blocked sellers to delete.'); return; }
        if (!confirm(`?? CRITICAL WARNING: This will permanently delete ALL ${blockedCount} blocked sellers and ALL their data including:\n\n� All products from all blocked sellers\n� All reviews\n� All seller accounts\n\nThis action CANNOT be undone!\n\nType "DELETE ALL" in the next prompt to confirm.`)) return;
        const confirmation = prompt('Type "DELETE ALL" to confirm permanent deletion:');
        if (confirmation !== 'DELETE ALL') { alert('? Deletion cancelled. Confirmation text did not match.'); return; }
        try {
            const response = await authFetch('/admin/blocked-sellers/all', { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(`? All blocked sellers deleted successfully!\n\nDeleted:\n� ${data.deletedSellers} seller accounts\n� ${data.deletedProducts} products\n� Related reviews`);
                fetchAllData();
            } else {
                alert('? Failed to delete blocked sellers: ' + data.message);
            }
        } catch (err) {
            console.error('Error deleting all blocked sellers:', err);
            alert('? Error deleting blocked sellers. Please try again.');
        }
    };

    const handleClearAllEditRequests = async () => {
        const editRequestCount = sellersWithEditRequests.length;
        if (editRequestCount === 0) { 
            alert('ℹ️ No edit requests to clear.'); 
            return; 
        }
        
        if (!confirm(`⚠️ WARNING: This will clear ALL ${editRequestCount} pending edit requests.\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?`)) return;
        
        try {
            const response = await authFetch('/admin/clear-all-edit-requests', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert(`✅ All edit requests cleared successfully!\n\nCleared: ${data.clearedCount} edit requests`);
                fetchSellersWithEditRequests();
                fetchAllData();
            } else {
                alert('❌ Failed to clear edit requests: ' + data.message);
            }
        } catch (err) {
            console.error('Error clearing edit requests:', err);
            alert('❌ Error clearing edit requests. Please try again.');
        }
    };

    const handleDeleteAllRejectedSellers = async () => {
        const rejectedCount = allSellers.filter(s => s.status === 'REJECTED' && !s.isBlocked).length;
        if (rejectedCount === 0) { alert('ℹ️ No rejected sellers to delete.'); return; }
        if (!confirm(`⚠️ CRITICAL WARNING: This will permanently delete ALL ${rejectedCount} rejected sellers and ALL their data including:\n\n• All products from all rejected sellers\n• All reviews\n• All seller accounts\n\nThis action CANNOT be undone!\n\nType "DELETE ALL" in the next prompt to confirm.`)) return;
        const confirmation = prompt('Type "DELETE ALL" to confirm permanent deletion:');
        if (confirmation !== 'DELETE ALL') { alert('❌ Deletion cancelled. Confirmation text did not match.'); return; }
        try {
            const response = await authFetch('/admin/rejected-sellers/all', { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(`✅ All rejected sellers deleted successfully!\n\nDeleted:\n• ${data.deletedSellers} seller accounts\n• ${data.deletedProducts} products\n• Related reviews`);
                fetchAllData();
            } else {
                alert('❌ Failed to delete rejected sellers: ' + data.message);
            }
        } catch (err) {
            console.error('Error deleting all rejected sellers:', err);
            alert('❌ Error deleting rejected sellers. Please try again.');
        }
    };

    const handleAcceptRejectedSeller = async (uid) => {
        if (!confirm('Are you sure you want to accept this rejected seller? They will be moved to Pending Approvals for review.')) return;
        try {
            const response = await authFetch(`/admin/seller/${uid}/accept-rejected`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert(`? Seller accepted successfully! The seller has been moved to Pending Approvals.`);
                fetchAllData();
            } else {
                alert('? Failed to accept seller: ' + data.message);
            }
        } catch (err) {
            console.error('Error accepting rejected seller:', err);
            alert('? Error accepting seller. Please try again.');
        }
    };

    const dateMatchesFilter = (sellerDate, filterDate) => {
        if (!filterDate) return true;
        const date = new Date(filterDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return sellerDate === `${day}/${month}/${year}`;
    };

    const thStyle = { padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)' };

    return (
        <>
            {/* If a seller is selected, show full-page detail view */}
            {selectedSeller ? (
                <SellerDetailModal
                    seller={selectedSeller}
                    onClose={() => { setSelectedSeller(null); if (scrollToTop) scrollToTop(); }}
                    onApprove={handleApproveSeller}
                    onReject={handleRejectSeller}
                    onBlock={handleBlockSeller}
                    scrollToTop={scrollToTop}
                />
            ) : editingSeller ? (
                <SellerEditModal
                    seller={editingSeller}
                    onClose={() => { setEditingSeller(null); if (scrollToTop) scrollToTop(); }}
                    onSave={async () => {
                        console.log('[SellersTab] Seller updated, refreshing all data...');
                        // Refresh all seller-related data
                        await fetchAllData();
                        await fetchSellersWithEditRequests();
                        setEditingSeller(null);
                        if (scrollToTop) scrollToTop();
                        console.log('[SellersTab] Data refresh complete');
                    }}
                />
            ) : (
            <div className="animate-fade-in flex flex-col" style={{ gap: '0.5rem' }}>
                {/* Pending Approvals Section */}
                <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                    <div className="admin-tab-header flex justify-between items-center">
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pending Approvals ({pendingSellers.length})</h3>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Search pending sellers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} />
                            <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Refresh</button>
                        </div>
                    </div>
                    {pendingSellers.filter(s => s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                        <div className="glass-card text-center p-8 text-muted">No pending approvals.</div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflowY: 'scroll', maxHeight: '400px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Phone Number</th>
                                        <th style={thStyle}>Aadhaar</th>
                                        <th style={thStyle}>Address</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Details</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingSellers.filter(s => s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                        <tr key={s.uid} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{s.extractedName || s.shopName}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.6rem', marginTop: '2px' }}>Shop: {s.shopName}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{s.email}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>{s.aadhaarNumber || 'N/A'}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span className="text-muted" style={{ fontSize: '0.65rem' }}>{s.address?.substring(0, 25)}...</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <button className="btn btn-secondary shadow-sm" onClick={() => setSelectedSeller(s)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px' }}>
                                                    <Box size={11} /> View Details
                                                </button>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                                <div className="flex gap-2 justify-end">
                                                    <button className="btn btn-primary" onClick={() => handleApproveSeller(s.uid)} title="Approve Seller" style={{ padding: '5px 10px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Check size={12} /> Accept
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => handleRejectSeller(s.uid)} title="Reject Seller" style={{ color: 'var(--error)', padding: '5px 10px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <X size={12} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ height: '3rem', borderBottom: '2px solid var(--border)' }}></div>

                {/* Seller Management Section - APPROVED */}
                <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                    <div className="admin-tab-header flex justify-between items-center">
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Total Sellers ({approvedSellers.length})</h3>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Search by shop name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', width: '160px', fontSize: '0.8rem' }} />
                            <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '120px', fontSize: '0.8rem' }}>
                                <option value="">All Categories</option>
                                {[...new Set(approvedSellers.map(s => s.category))].sort().map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <input type="date" value={selectedJoinDate} onChange={(e) => setSelectedJoinDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} title="Filter by join date" />
                            <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSearchCategory(''); setSelectedJoinDate(''); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
                            <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Refresh</button>
                        </div>
                    </div>
                    {approvedSellers.filter(s => {
                        const matchesCategory = searchCategory === '' || s.category === searchCategory;
                        const matchesName = searchTerm === '' || s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesDate = dateMatchesFilter(s.joined, selectedJoinDate);
                        return matchesCategory && matchesName && matchesDate;
                    }).length === 0 ? (
                        <div className="glass-card text-center p-8 text-muted">No approved sellers found.</div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflowY: 'scroll', maxHeight: '400px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={thStyle}>Shop Identity</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Contact Info</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Joined</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Verification</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedSellers.filter(s => {
                                        const matchesCategory = searchCategory === '' || s.category === searchCategory;
                                        const matchesName = searchTerm === '' || s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchesDate = dateMatchesFilter(s.joined, selectedJoinDate);
                                        return matchesCategory && matchesName && matchesDate;
                                    }).map(s => (
                                        <tr key={s.uid} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{s.shopName}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.6rem', marginTop: '2px' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '2px 6px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 600 }}>{s.category}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{s.email}</span>
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '4px 8px', background: 'rgba(var(--success-rgb), 0.1)', color: 'var(--success)', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700 }}>APPROVED</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span className="text-muted" style={{ fontSize: '0.65rem' }}>{s.joined}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <button className="btn btn-secondary shadow-sm" onClick={() => setSelectedSeller(s)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px' }}><Box size={11} /> Review</button>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-secondary" 
                                                    onClick={() => setEditingSeller(s)} 
                                                    title="Edit Seller Details" 
                                                    style={{ 
                                                        padding: '3px 8px', 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 700, 
                                                        borderRadius: '5px', 
                                                        gap: '3px',
                                                        background: 'var(--warning)',
                                                        borderColor: 'var(--warning)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Edit size={11} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ height: '3rem', borderBottom: '2px solid var(--border)' }}></div>

                {/* Rejected Applications Section */}
                <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                    <div className="admin-tab-header flex justify-between items-center">
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Rejected Applications ({rejectedSellers.length})</h3>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Search rejected sellers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', width: '160px', fontSize: '0.8rem' }} />
                            <select value={selectedRejectCategory} onChange={(e) => setSelectedRejectCategory(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '120px', fontSize: '0.8rem' }}>
                                <option value="">All Categories</option>
                                {[...new Set(rejectedSellers.map(s => s.category).filter(Boolean))].sort().map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <input type="date" value={selectedRejectDate} onChange={(e) => setSelectedRejectDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} title="Filter by date" />
                            <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedRejectCategory(''); setSelectedRejectDate(''); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
                            <button className="btn" onClick={handleDeleteAllRejectedSellers} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#ef4444', borderColor: '#ef4444', color: 'white', fontWeight: 700 }} title="Permanently delete all rejected sellers">Delete All Rejected</button>
                            <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Refresh</button>
                        </div>
                    </div>
                    {rejectedSellers.filter(s => {
                        const matchesName = searchTerm === '' || s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedRejectCategory === '' || s.category === selectedRejectCategory;
                        const matchesDate = dateMatchesFilter(s.joined, selectedRejectDate);
                        return matchesName && matchesCategory && matchesDate;
                    }).length === 0 ? (
                        <div className="glass-card text-center p-8 text-muted">No rejected sellers.</div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflowY: 'scroll', maxHeight: '400px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={thStyle}>Shop Identity</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Contact Info</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Joined</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Verification</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rejectedSellers.filter(s => {
                                        const matchesName = searchTerm === '' || s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchesCategory = selectedRejectCategory === '' || s.category === selectedRejectCategory;
                                        const matchesDate = dateMatchesFilter(s.joined, selectedRejectDate);
                                        return matchesName && matchesCategory && matchesDate;
                                    }).map(s => (
                                        <tr key={s.uid} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{s.shopName}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.6rem', marginTop: '2px' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '2px 6px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 600 }}>{s.category}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{s.email}</span>
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700 }}>REJECTED</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span className="text-muted" style={{ fontSize: '0.65rem' }}>{s.joined}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <button className="btn btn-secondary shadow-sm" onClick={() => setSelectedSeller(s)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px' }}><Box size={11} /> Review</button>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                                <div className="flex gap-2 justify-end">
                                                    <button className="btn btn-primary" onClick={() => handleAcceptRejectedSeller(s.uid)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px', background: 'var(--success)', borderColor: 'var(--success)' }}><Check size={11} /> Accept</button>
                                                    <button className="btn" onClick={() => handleDeleteSeller(s.uid, s.shopName)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px', background: '#ef4444', borderColor: '#ef4444', color: 'white' }} title="Permanently delete seller and all their data"><X size={11} /> Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ height: '3rem', borderBottom: '2px solid var(--border)' }}></div>

                {/* Blocked Sellers Section */}
                <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                    <div className="admin-tab-header flex justify-between items-center">
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Blocked Sellers ({blockedSellers.length})</h3>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Search blocked sellers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', width: '160px', fontSize: '0.8rem' }} />
                            <select value={selectedBlockCategory} onChange={(e) => setSelectedBlockCategory(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '120px', fontSize: '0.8rem' }}>
                                <option value="">All Categories</option>
                                {[...new Set(blockedSellers.map(s => s.category).filter(Boolean))].sort().map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <input type="date" value={selectedBlockDate} onChange={(e) => setSelectedBlockDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} title="Filter by date" />
                            <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedBlockCategory(''); setSelectedBlockDate(''); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
                            <button className="btn" onClick={handleDeleteAllBlockedSellers} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#ef4444', borderColor: '#ef4444', color: 'white', fontWeight: 700 }} title="Permanently delete all blocked sellers">Delete All Blocked</button>
                            <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Refresh</button>
                        </div>
                    </div>
                    {blockedSellers.filter(s => {
                        const matchesName = searchTerm === '' || s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedBlockCategory === '' || s.category === selectedBlockCategory;
                        const matchesDate = dateMatchesFilter(s.joined, selectedBlockDate);
                        return matchesName && matchesCategory && matchesDate;
                    }).length === 0 ? (
                        <div className="glass-card text-center p-8 text-muted">No blocked sellers.</div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflowY: 'scroll', maxHeight: '400px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={thStyle}>Shop Identity</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Contact Info</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Joined</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Verification</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blockedSellers.filter(s => {
                                        const matchesName = searchTerm === '' || s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchesCategory = selectedBlockCategory === '' || s.category === selectedBlockCategory;
                                        const matchesDate = dateMatchesFilter(s.joined, selectedBlockDate);
                                        return matchesName && matchesCategory && matchesDate;
                                    }).map(s => (
                                        <tr key={s.uid} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{s.shopName}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.6rem', marginTop: '2px' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '2px 6px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 600 }}>{s.category}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{s.email}</span>
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '4px 8px', background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700 }}>BLOCKED</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}><span className="text-muted" style={{ fontSize: '0.65rem' }}>{s.joined}</span></td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <button className="btn btn-secondary shadow-sm" onClick={() => setSelectedSeller(s)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px' }}><Box size={11} /> Review</button>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                                <div className="flex gap-2 justify-end">
                                                    <button className="btn btn-primary" onClick={() => handleUnblockSeller(s.uid)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px', background: 'var(--success)', borderColor: 'var(--success)' }}><Check size={11} /> Unblock</button>
                                                    <button className="btn" onClick={() => handleDeleteSeller(s.uid, s.shopName)} style={{ padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px', gap: '3px', background: '#ef4444', borderColor: '#ef4444', color: 'white' }} title="Permanently delete seller and all their data"><X size={11} /> Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div style={{ height: '3rem', borderBottom: '2px solid var(--border)' }}></div>

                {/* Edit Seller Section */}
                <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                    <div className="admin-tab-header flex justify-between items-center">
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Seller ({sellersWithEditRequests.length})</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Search by shop name..." 
                                value={editSearchTerm} 
                                onChange={(e) => setEditSearchTerm(e.target.value)} 
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', width: '160px', fontSize: '0.8rem' }} 
                            />
                            <select 
                                value={editSearchCategory} 
                                onChange={(e) => setEditSearchCategory(e.target.value)} 
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '120px', fontSize: '0.8rem' }}
                            >
                                <option value="">All Categories</option>
                                {[...new Set(sellersWithEditRequests.map(s => s.category || 'Uncategorized'))].sort().map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => { setEditSearchTerm(''); setEditSearchCategory(''); }} 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                            >
                                Clear
                            </button>
                            <button 
                                className="btn" 
                                onClick={handleClearAllEditRequests} 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#ef4444', borderColor: '#ef4444', color: 'white', fontWeight: 700 }} 
                                title="Clear all edit requests"
                            >
                                Clear All
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={fetchSellersWithEditRequests}
                                disabled={editRequestsLoading}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', opacity: editRequestsLoading ? 0.6 : 1 }}
                            >
                                {editRequestsLoading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                    {editRequestsLoading ? (
                        <div className="glass-card text-center p-8 text-muted">Loading edit requests...</div>
                    ) : sellersWithEditRequests.filter(s => {
                        const matchesCategory = editSearchCategory === '' || (s.category || 'Uncategorized') === editSearchCategory;
                        const matchesName = editSearchTerm === '' || 
                            s.shopName.toLowerCase().includes(editSearchTerm.toLowerCase()) || 
                            s.email.toLowerCase().includes(editSearchTerm.toLowerCase());
                        return matchesCategory && matchesName;
                    }).length === 0 ? (
                        <div className="glass-card text-center p-8 text-muted">
                            No sellers with edit requests.
                        </div>
                    ) : (
                        <div className="glass-card" style={{ 
                            padding: 0, 
                            overflowY: 'scroll', 
                            maxHeight: '400px', 
                            border: '1px solid var(--border)' 
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={thStyle}>Shop Identity</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Contact Info</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Joined</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Verification</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sellersWithEditRequests.filter(s => {
                                        const matchesCategory = editSearchCategory === '' || (s.category || 'Uncategorized') === editSearchCategory;
                                        const matchesName = editSearchTerm === '' || 
                                            s.shopName.toLowerCase().includes(editSearchTerm.toLowerCase()) || 
                                            s.email.toLowerCase().includes(editSearchTerm.toLowerCase());
                                        return matchesCategory && matchesName;
                                    }).map(s => (
                                        <tr key={s.requestId || s.uid} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{s.shopName}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.6rem', marginTop: '2px' }}>UID: {s.uid?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <span style={{ 
                                                    padding: '2px 6px', 
                                                    background: 'var(--glass)', 
                                                    border: '1px solid var(--border)', 
                                                    borderRadius: '5px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 600 
                                                }}>
                                                    {s.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{s.email}</span>
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>{s.phone}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '5px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 700,
                                                    background: s.status === 'APPROVED' ? 'rgba(var(--success-rgb), 0.1)' : 
                                                               s.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 
                                                               s.status === 'PENDING' ? 'rgba(255, 152, 0, 0.1)' : 'var(--glass)',
                                                    color: s.status === 'APPROVED' ? 'var(--success)' : 
                                                           s.status === 'REJECTED' ? '#ef4444' : 
                                                           s.status === 'PENDING' ? '#ff9800' : 'var(--text-muted)'
                                                }}>
                                                    {s.status}
                                                    {s.isBlocked && ' 🚫'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                                <span className="text-muted" style={{ fontSize: '0.65rem' }}>{s.joined}</span>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <button 
                                                    className="btn btn-secondary shadow-sm" 
                                                    onClick={() => setSelectedSeller(s)} 
                                                    style={{ 
                                                        padding: '3px 8px', 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 700, 
                                                        borderRadius: '5px', 
                                                        gap: '3px' 
                                                    }}
                                                >
                                                    <Box size={11} /> Review
                                                </button>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    background: 'rgba(255, 152, 0, 0.1)', 
                                                    color: '#ff9800', 
                                                    borderRadius: '5px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => setEditingSeller(s)}
                                                title="Click to edit seller details"
                                                >
                                                    <Edit size={11} /> Edit Pending
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            )} {/* end of !selectedSeller */}
        </>
    );
}
