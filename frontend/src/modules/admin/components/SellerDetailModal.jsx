import { useState, useEffect } from 'react';
import { X, Check, CreditCard, User, Store, MapPin, ArrowLeft, Calendar } from 'lucide-react';
import BankDetailsModal from '@/modules/admin/components/BankDetailsModal';

const Field = ({ label, value, mono = false, span = false }) => (
    <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.85rem 1.1rem',
        gridColumn: span ? 'span 2' : undefined,
    }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: mono ? 'monospace' : undefined, color: 'var(--text)' }}>{value || '—'}</div>
    </div>
);

const Section = ({ icon, title, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
            {icon}
            <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text)' }}>{title}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {children}
        </div>
    </div>
);

export default function SellerDetailModal({ seller, onClose, onApprove, onReject, onBlock, scrollToTop }) {
    const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [blockDuration, setBlockDuration] = useState('1');
    const [customDays, setCustomDays] = useState('');

    const doScrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (scrollToTop) scrollToTop();
    };

    // Scroll to top when detail view opens
    useEffect(() => { doScrollTop(); }, []);

    // Scroll to top when block page opens
    useEffect(() => { if (blockModalOpen) doScrollTop(); }, [blockModalOpen]);

    if (!seller) return null;

    const handleBlockConfirm = () => {
        const duration = blockDuration === 'custom' ? parseInt(customDays) : blockDuration === 'permanent' ? 'permanent' : parseInt(blockDuration);
        onBlock(seller.uid, duration);
        setBlockModalOpen(false);
    };

    // ── Bank Details page ───────────────────────────────────────────────────
    if (showBankDetailsModal) {
        return <BankDetailsModal seller={seller} onClose={() => { setShowBankDetailsModal(false); doScrollTop(); }} />;
    }

    // ── Block page ──────────────────────────────────────────────────────────
    if (blockModalOpen) {
        return (
            <div className="animate-fade-in" style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setBlockModalOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--error)' }}>Block Seller</h2>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{seller.shopName} · UID: {seller.uid}</span>
                    </div>
                </div>

                {/* Warning card */}
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: '#b91c1c', lineHeight: 1.7 }}>
                    Blocking <strong>{seller.shopName}</strong> will immediately deactivate their account and hide all their products from customers. The seller will be notified via email.
                </div>

                {/* Form card */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '560px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Block Duration</label>
                        <select
                            value={blockDuration}
                            onChange={e => setBlockDuration(e.target.value)}
                            style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', background: 'var(--surface)', color: 'var(--text)' }}
                        >
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="5">5 Days</option>
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                            <option value="custom">Custom Days</option>
                            <option value="permanent">Permanent Block</option>
                        </select>
                    </div>

                    {blockDuration === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Number of Days</label>
                            <input
                                type="number" min="1" placeholder="e.g. 60"
                                value={customDays}
                                onChange={e => setCustomDays(e.target.value)}
                                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', background: 'var(--surface)', color: 'var(--text)' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-secondary" onClick={() => setBlockModalOpen(false)} style={{ flex: 1, padding: '0.85rem', fontWeight: 600, fontSize: '1rem' }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleBlockConfirm} style={{ flex: 1, padding: '0.85rem', fontWeight: 700, fontSize: '1rem', background: 'var(--error)', borderColor: 'var(--error)' }}>
                            Confirm Block
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusColor = seller.status === 'APPROVED' ? { bg: 'rgba(var(--success-rgb),0.12)', color: 'var(--success)' }
        : seller.status === 'REJECTED' ? { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' }
        : seller.status === 'PENDING' ? { bg: 'rgba(255,152,0,0.12)', color: '#f59e0b' }
        : { bg: 'var(--glass)', color: 'var(--text-muted)' };

    return (
        <>
            {/* Full-page inline detail view */}
            <div className="animate-fade-in" style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{seller.shopName}</h2>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>UID: {seller.uid}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, background: statusColor.bg, color: statusColor.color }}>
                            {seller.isBlocked ? 'BLOCKED' : seller.status}
                        </span>
                        <button onClick={() => setShowBankDetailsModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <CreditCard size={15} /> Bank Details
                        </button>
                    </div>
                </div>

                {/* Main content grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '2rem', alignItems: 'start' }}>

                    {/* Left — Aadhaar image */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
                            <CreditCard size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity Document</span>
                        </div>
                        {seller.aadhaarImageUrl ? (
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#111' }}>
                                <img src={seller.aadhaarImageUrl} alt="Aadhaar / Identity Document" style={{ width: '100%', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ borderRadius: '12px', border: '1px dashed var(--border)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No document uploaded
                            </div>
                        )}
                        <p style={{ margin: 0, fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aadhaar / Identity Card Preview</p>
                    </div>

                    {/* Right — Info sections */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                        <Section icon={<User size={16} style={{ color: 'var(--primary)' }} />} title="Personal Identity">
                            <Field label="Full Name" value={seller.extractedName || seller.name} />
                            <Field label="UIDAI / Aadhaar Number" value={seller.aadhaarNumber} mono />
                        </Section>

                        <Section icon={<Store size={16} style={{ color: 'var(--secondary)' }} />} title="Store Profile">
                            <Field label="Shop / Store Name" value={seller.shopName} span />
                            <Field label="Category" value={seller.category} />
                            <Field label="Contact (Phone / Email)" value={seller.email} />
                            {seller.businessType && <Field label="Business Type" value={seller.businessType} />}
                            <Field label="GST Number" value={seller.gstNumber} mono />
                            {seller.panNumber && <Field label="PAN Number" value={seller.panNumber} mono />}
                            {seller.contactEmail && <Field label="Contact Email" value={seller.contactEmail} />}
                        </Section>

                        <Section icon={<MapPin size={16} style={{ color: 'var(--warning)' }} />} title="Address">
                            <div style={{ gridColumn: 'span 2', background: 'hsla(40,90%,60%,0.05)', border: '1px dashed var(--warning)', borderRadius: '10px', padding: '1rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text)' }}>
                                {seller.address || 'Address information not available.'}
                            </div>
                        </Section>

                        <Section icon={<Calendar size={16} style={{ color: 'var(--text-muted)' }} />} title="Application Info">
                            <Field label="Applied / Joined" value={seller.joined} />
                            <Field label="Seller UID" value={seller.uid} mono span />
                        </Section>
                    </div>
                </div>

                {/* Action footer */}
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border)', flexWrap: 'wrap' }}>
                    {seller.status === 'PENDING' && !seller.isBlocked ? (
                        <>
                            <button className="btn btn-primary" style={{ flex: '1 1 200px', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => { onApprove(seller.uid); onClose(); }}>
                                <Check size={18} /> Approve Seller
                            </button>
                            <button className="btn btn-secondary" style={{ flex: '1 1 200px', fontSize: '1rem', fontWeight: 700, color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => { onReject(seller.uid); onClose(); }}>
                                <X size={18} /> Reject Application
                            </button>
                        </>
                    ) : seller.status === 'APPROVED' && !seller.isBlocked ? (
                        <button className="btn btn-secondary" style={{ flex: '1 1 200px', fontSize: '1rem', fontWeight: 700, color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => setBlockModalOpen(true)}>
                            <X size={18} /> Block Seller
                        </button>
                    ) : null}
                    <button className="btn btn-secondary" style={{ flex: '0 0 auto', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }} onClick={onClose}>
                        <ArrowLeft size={18} /> Back to List
                    </button>
                </div>
            </div>

            {showBankDetailsModal && (
                <BankDetailsModal seller={seller} onClose={() => setShowBankDetailsModal(false)} />
            )}        </>
    );
}

