import React, { useState, useRef } from 'react';
import { Box, Download, Loader, ChevronUp, ChevronDown, XCircle } from 'lucide-react';

export default function SellerAnalyticsTable({ seller, onDownloadPDF }) {
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [isCustomDownloading, setIsCustomDownloading] = useState(false);
    const tableContainerRef = useRef(null);

    const scrollToTop = () => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const scrollToBottom = () => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTo({ top: tableContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    const handleCustomDateDownload = async () => {
        if (!customDateFrom || !customDateTo) {
            alert('Please select both start and end dates');
            return;
        }

        setIsCustomDownloading(true);
        try {
            await onDownloadPDF(
                `/admin/seller/${seller.uid}/analytics-pdf?fromDate=${customDateFrom}&toDate=${customDateTo}`,
                `analytics_${(seller.shopName || 'seller').replace(/\s+/g, '_')}_${customDateFrom}_to_${customDateTo}.pdf`
            );
        } finally {
            setIsCustomDownloading(false);
        }
    };

    const handleQuickPeriod = (months) => {
        const today = new Date();
        const toDate = today.toISOString().split('T')[0];

        let fromDate;
        if (months === 'all') {
            fromDate = '2020-01-01';
        } else {
            const from = new Date();
            from.setMonth(from.getMonth() - months);
            fromDate = from.toISOString().split('T')[0];
        }

        setCustomDateFrom(fromDate);
        setCustomDateTo(toDate);
    };

    const handleClearDates = () => {
        setCustomDateFrom('');
        setCustomDateTo('');
    };

    return (
        <div id="all-products-section" className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Box size={20} style={{ color: 'var(--primary)' }} />
                    All Products
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={scrollToTop}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
                    >
                        <ChevronUp size={16} />
                        Scroll to Top
                    </button>
                    <button
                        onClick={scrollToBottom}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
                    >
                        <ChevronDown size={16} />
                        Scroll to Bottom
                    </button>
                </div>
            </div>
            <div ref={tableContainerRef} style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead style={{ background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Product</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Date Added</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Price</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Disc. Price</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Stock</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sold</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Revenue</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Margin %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {seller.productMatrix.map((p, idx) => {
                            const discountPercent = p.discountedPrice ? Math.round(((p.price - p.discountedPrice) / p.price) * 100) : 0;
                            return (
                                <tr
                                    key={p.id}
                                    style={{
                                        borderTop: '1px solid var(--border)',
                                        background: idx % 2 === 0 ? 'transparent' : 'var(--surface)'
                                    }}
                                >
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span>
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {p.id}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.date || 'N/A'}</span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 500 }}>
                                        ₹{p.price.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        {p.discountedPrice ? (
                                            <div className="flex flex-col items-center">
                                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{p.discountedPrice.toLocaleString()}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--error)' }}>-{discountPercent}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        <span style={{
                                            fontWeight: 600,
                                            color: p.stock < 5 ? 'var(--error)' : p.stock < 20 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.sold}</span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>
                                            ₹{p.revenue.toLocaleString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        <span style={{
                                            fontWeight: 600,
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            background: discountPercent > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                            color: discountPercent > 0 ? 'var(--success)' : 'var(--text-muted)',
                                            fontSize: '0.85rem'
                                        }}>
                                            {discountPercent > 0 ? `${100 - discountPercent}%` : '100%'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Custom Date Range Download Section */}
            <div style={{ padding: '2rem', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={20} style={{ color: 'var(--primary)' }} />
                    Download Payout PDF
                </h3>

                {/* Quick Period Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                            Quick Period Selection
                        </p>
                        {(customDateFrom || customDateTo) && (
                            <button
                                onClick={handleClearDates}
                                className="btn btn-secondary"
                                style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <XCircle size={14} />
                                Clear Dates
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleQuickPeriod(1)}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            1 Month
                        </button>
                        <button
                            onClick={() => handleQuickPeriod(3)}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            3 Months
                        </button>
                        <button
                            onClick={() => handleQuickPeriod(6)}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            6 Months
                        </button>
                        <button
                            onClick={() => handleQuickPeriod(12)}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            12 Months
                        </button>
                        <button
                            onClick={() => handleQuickPeriod('all')}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                {/* Custom Date Range */}
                <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Or Select Custom Date Range
                    </p>
                    <div className="flex items-end gap-3">
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                From Date
                            </label>
                            <input
                                type="date"
                                value={customDateFrom}
                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                placeholder="dd mm yyyy"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.875rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    background: 'white',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                To Date
                            </label>
                            <input
                                type="date"
                                value={customDateTo}
                                onChange={(e) => setCustomDateTo(e.target.value)}
                                placeholder="dd mm yyyy"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.875rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    background: 'white',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleCustomDateDownload}
                            disabled={isCustomDownloading || !customDateFrom || !customDateTo}
                            className="btn btn-primary"
                            style={{
                                padding: '0.625rem 2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                opacity: (!customDateFrom || !customDateTo) ? 0.5 : 1,
                                cursor: (!customDateFrom || !customDateTo) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isCustomDownloading ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Download Payout PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

