import { ShoppingBag, Truck } from 'lucide-react';

export default function SellerOrdersTab({ orders, onTrackOrder }) {
    return (
        <div className="animate-fade-in flex flex-col gap-4" style={{ height: '100%' }}>
            <div className="mb-2 md:mb-4">
                <h3>Customer Orders ({orders.length})</h3>
            </div>

            <div className="glass-card flex-1" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <ShoppingBag size={64} className="text-muted mb-4" />
                        <h3>No Orders Yet</h3>
                        <p className="text-muted">Orders will appear here once customers start buying your products.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block" style={{ overflowX: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--surface)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <tr>
                                        <th style={{ padding: '1.25rem' }}>Order ID</th>
                                        <th>Customer</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Courier Info</th>
                                        <th style={{ padding: '1.25rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1.25rem', fontFamily: 'monospace', fontWeight: 600 }}>#{o.orderId}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                                                        {o.customer.charAt(0)}
                                                    </div>
                                                    {o.customer}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>₹{o.total}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500,
                                                    background: o.status === 'Delivered' ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--warning-rgb), 0.1)',
                                                    color: o.status === 'Delivered' ? 'var(--success)' : 'var(--warning)',
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                                                }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td>
                                                {o.awbNumber ? (
                                                    <div className="flex flex-col">
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{o.courierName}</span>
                                                        <span className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>AWB: {o.awbNumber}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Pending Assignment</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => onTrackOrder(o)}
                                                        className="btn btn-primary btn-sm flex items-center gap-1"
                                                        style={{ padding: '0.4rem 0.75rem' }}
                                                        title="Track Order"
                                                    >
                                                        <Truck size={14} /> Track
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col gap-3 p-3">
                            {orders.map(o => (
                                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--primary)' }}>
                                                {o.customer.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{o.customer}</p>
                                                <p className="text-xs text-gray-400 font-mono">#{o.orderId}</p>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                            background: o.status === 'Delivered' ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--warning-rgb), 0.1)',
                                            color: o.status === 'Delivered' ? 'var(--success)' : 'var(--warning)',
                                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                                        }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }}></span>
                                            {o.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div>
                                            <span className="text-xs text-gray-400">Total</span>
                                            <p className="text-lg font-extrabold text-slate-900">₹{o.total}</p>
                                        </div>
                                        <div className="text-right">
                                            {o.awbNumber ? (
                                                <>
                                                    <p className="text-xs font-semibold text-slate-700">{o.courierName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">AWB: {o.awbNumber}</p>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400">Pending Assignment</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onTrackOrder(o)}
                                        className="btn btn-primary btn-sm flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm"
                                        title="Track Order"
                                    >
                                        <Truck size={14} /> Track Order
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
