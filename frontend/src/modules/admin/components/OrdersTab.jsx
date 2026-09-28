import { useState } from 'react';

export default function OrdersTab({ orders, fetchAllData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    if (!Array.isArray(orders)) {
        return (
            <div className="animate-fade-in flex flex-col gap-4">
                <div className="glass-card text-center p-8 text-muted">Error loading orders. Please refresh the page.</div>
            </div>
        );
    }

    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return new Date(0);
        const parts = dateString.split('/');
        if (parts.length !== 3) return new Date(0);
        const [day, month, year] = parts;
        return new Date(year, month - 1, day);
    };

    const sortedOrders = [...orders].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const filteredOrdersList = sortedOrders.filter(o => {
        if (!o) return false;
        const matchesSearch = searchTerm === '' ||
            (o.orderId && o.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.customer && o.customer.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDate = selectedDate === '' || o.date === (() => {
            try {
                const date = new Date(selectedDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            } catch (e) { return ''; }
        })();
        return matchesSearch && matchesDate;
    });

    const getStatusStyle = (status) => {
        const styles = {
            'Delivered': { bg: 'rgba(var(--success-rgb), 0.1)', color: 'var(--success)' },
            'Cancelled': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
            'Processing': { bg: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' },
            'Shipped': { bg: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)' },
        };
        return styles[status] || { bg: 'rgba(var(--warning-rgb), 0.1)', color: 'var(--warning)' };
    };

    return (
        <div className="animate-fade-in flex flex-col gap-4">
            <div className="admin-tab-header flex justify-between items-center">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Global Orders ({filteredOrdersList.length})</h3>
                <div className="flex gap-2">
                    <input type="text" placeholder="Search by Order ID or Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', width: '200px', fontSize: '0.8rem' }} />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }} title="Filter by date" />
                    {(searchTerm || selectedDate) && (
                        <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedDate(''); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
                    )}
                    <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedDate(''); fetchAllData(); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Refresh</button>
                </div>
            </div>
            <div id="orders-table-container" className="glass-card" style={{ padding: 0, overflowY: 'auto', maxHeight: '600px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            {['Order ID', 'Customer', 'Product Total', 'Shipping', 'Total', 'Status', 'Date'].map(h => (
                                <th key={h} style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrdersList.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{searchTerm || selectedDate ? 'No orders found matching your search criteria.' : 'No orders yet.'}</td></tr>
                        ) : (
                            filteredOrdersList.map(o => {
                                if (!o) return null;
                                const normalizedStatus = o.status === 'Placed' ? 'Order Placed' : (o.status || 'Processing');
                                const statusStyle = getStatusStyle(normalizedStatus);
                                
                                // Calculate product total (order total - shipping)
                                const actualShipping = o.actualShippingCharge || o.courierRate || 0;
                                const estimatedShipping = o.estimatedShippingCharge || 0;
                                const displayShipping = actualShipping || estimatedShipping;
                                const productTotal = (o.total || 0) - displayShipping;
                                
                                return (
                                    <tr key={o.id || Math.random()} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '0.5rem 0.75rem' }}><strong style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{o.orderId || 'N/A'}</strong></td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{o.customer || 'Guest Customer'}</span></td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ fontWeight: 600, fontSize: '0.75rem' }}>₹{productTotal.toLocaleString()}</span></td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>
                                            {actualShipping > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)' }}>₹{actualShipping.toLocaleString()}</span>
                                                    {estimatedShipping > 0 && estimatedShipping !== actualShipping && (
                                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Est: ₹{estimatedShipping}</span>
                                                    )}
                                                </div>
                                            ) : estimatedShipping > 0 ? (
                                                <span style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--warning)' }}>₹{estimatedShipping} (Est)</span>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ fontWeight: 700, fontSize: '0.75rem' }}>₹{(o.total || 0).toLocaleString()}</span></td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700 }}>{normalizedStatus}</span></td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ fontSize: '0.7rem' }}>{o.date || 'N/A'}</span></td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

