import { useState, useEffect } from 'react';
import { Settings, Save, Loader, Truck, Tag, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import { SELLER_CATEGORIES } from '@/modules/shared/config/categories';
import { PLATFORM_FEE_BREAKDOWN, calculateTotalPlatformFeePercent, validatePlatformFeeBreakdown } from '@/modules/shared/utils/platformFeeUtils';

const DEFAULT_GST = {
    "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12,
    "Electronics": 18, "Home & Living": 18, "Handicrafts": 5,
    "Artworks": 12, "Beauty & Personal Care": 18, "Sports & Fitness": 18,
    "Books & Stationery": 12, "Food & Beverages": 5, "Gifts & Customization": 18,
    "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
    "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
    "Automotive & Accessories": 18, "Travel & Utility": 18,
    "Sustainability & Eco-Friendly": 12, "Others": 18
};

const DEFAULT_PLATFORM_FEE_CAP_RANGES = [
    { id: 'caprange1', label: '₹0 – ₹1,000',       min: 0,     max: 1000,  capAmount: 0 },
    { id: 'caprange2', label: '₹1,001 – ₹10,000',  min: 1001,  max: 10000, capAmount: 0 },
    { id: 'caprange3', label: '₹10,001 – ₹50,000', min: 10001, max: 50000, capAmount: 0 },
    { id: 'caprange4', label: '₹50,001 & above',   min: 50001, max: null,  capAmount: 0 },
];

const iStyle = { 
    padding: '0.55rem 0.85rem', 
    borderRadius: '8px', 
    border: '1px solid var(--border)', 
    fontSize: '0.95rem', 
    background: 'white', 
    color: '#000000', 
    width: '90px', 
    outline: 'none', 
    textAlign: 'center',
    transition: 'all 0.2s',
    fontWeight: 600
};

const SectionButtons = ({ editing, saving, onEdit, onSave, onCancel }) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
        {!editing ? (
            <button className="btn btn-secondary" onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                Edit
            </button>
        ) : (
            <>
                <button className="btn btn-secondary" onClick={onCancel} disabled={saving} style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                    {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </>
        )}
    </div>
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertCircle size={20} />
    };

    const colors = {
        success: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', text: '#15803d' },
        error: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#dc2626' },
        warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#d97706' }
    };

    const style = colors[type] || colors.success;

    return (
        <div className="admin-toast" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: '10px',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ color: style.text }}>{icons[type]}</div>
            <div style={{ flex: 1, color: style.text, fontSize: '0.9rem', fontWeight: 500 }}>{message}</div>
            <button onClick={onClose} style={{
                background: 'none',
                border: 'none',
                color: style.text,
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 0.25rem'
            }}>×</button>
        </div>
    );
};

export default function PlatformSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [catSearch, setCatSearch] = useState('');
    const [categoryGstRates, setCategoryGstRates] = useState(DEFAULT_GST);
    const [customCategories, setCustomCategories] = useState([]);
    const [platformFeeBreakdown, setPlatformFeeBreakdown] = useState(PLATFORM_FEE_BREAKDOWN);
    const [platformFeeBreakdownSeller, setPlatformFeeBreakdownSeller] = useState(PLATFORM_FEE_BREAKDOWN);
    const [editingUserPF, setEditingUserPF] = useState(false);
    const [editingSellerPF, setEditingSellerPF] = useState(false);
    const [editingGST, setEditingGST] = useState(false);

    const [savingUserPF, setSavingUserPF] = useState(false);
    const [savingSellerPF, setSavingSellerPF] = useState(false);
    const [savingGST, setSavingGST] = useState(false);
    const [origPF, setOrigPF] = useState(PLATFORM_FEE_BREAKDOWN);
    const [origPFSeller, setOrigPFSeller] = useState(PLATFORM_FEE_BREAKDOWN);
    const [origGST, setOrigGST] = useState(DEFAULT_GST);

    // Platform fee cap ranges
    const [platformFeeCapRanges, setPlatformFeeCapRanges] = useState(DEFAULT_PLATFORM_FEE_CAP_RANGES);
    const [origPlatformFeeCapRanges, setOrigPlatformFeeCapRanges] = useState(DEFAULT_PLATFORM_FEE_CAP_RANGES);
    const [editingCapRanges, setEditingCapRanges] = useState(false);
    const [savingCapRanges, setSavingCapRanges] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/admin/config/public');
            const data = await res.json();
            if (data.success && data.config) {
                if (data.config.categoryGstRates) {
                    const gst = { ...DEFAULT_GST, ...data.config.categoryGstRates };
                    setCategoryGstRates(gst); setOrigGST(gst);
                    setCustomCategories(Object.keys(data.config.categoryGstRates).filter(k => !SELLER_CATEGORIES.includes(k)));
                }
                // User platform fee breakdown
                if (data.config.platformFeeBreakdown) {
                    const bd = {};
                    Object.entries(data.config.platformFeeBreakdown).forEach(([key, percent]) => {
                        const def = PLATFORM_FEE_BREAKDOWN[key];
                        bd[key] = { label: def?.label || key, description: def?.description || '', percent };
                    });
                    setPlatformFeeBreakdown(bd); setOrigPF(bd);
                } else {
                    setPlatformFeeBreakdown(PLATFORM_FEE_BREAKDOWN); setOrigPF(PLATFORM_FEE_BREAKDOWN);
                }
                // Seller platform fee breakdown
                if (data.config.platformFeeBreakdownSeller) {
                    const bdSeller = {};
                    Object.entries(data.config.platformFeeBreakdownSeller).forEach(([key, percent]) => {
                        const def = PLATFORM_FEE_BREAKDOWN[key];
                        bdSeller[key] = { label: def?.label || key, description: def?.description || '', percent };
                    });
                    setPlatformFeeBreakdownSeller(bdSeller); setOrigPFSeller(bdSeller);
                } else {
                    setPlatformFeeBreakdownSeller(PLATFORM_FEE_BREAKDOWN); setOrigPFSeller(PLATFORM_FEE_BREAKDOWN);
                }
                // Load platform fee cap ranges
                if (data.config.platformFeeCapRanges) {
                    setPlatformFeeCapRanges(data.config.platformFeeCapRanges);
                    setOrigPlatformFeeCapRanges(data.config.platformFeeCapRanges);
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const saveToBackend = async (payload) => {
        const res = await authFetch('/admin/profile', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        return res.json();
    };

    const handleSaveUserPF = async () => {
        const v = validatePlatformFeeBreakdown(platformFeeBreakdown);
        if (!v.valid) { showToast(v.error, 'error'); return; }
        setSavingUserPF(true);
        try {
            const bd = {};
            Object.entries(platformFeeBreakdown).forEach(([k, val]) => { bd[k] = val.percent; });
            const data = await saveToBackend({ platformFeeBreakdown: bd });
            if (data.success) { 
                showToast('User Platform Fee saved successfully!', 'success');
                setOrigPF(platformFeeBreakdown);
                setEditingUserPF(false);
            }
            else showToast(data.message || 'Failed to save', 'error');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingUserPF(false); }
    };

    const handleSaveSellerPF = async () => {
        const v = validatePlatformFeeBreakdown(platformFeeBreakdownSeller);
        if (!v.valid) { showToast(v.error, 'error'); return; }
        setSavingSellerPF(true);
        try {
            const bd = {};
            Object.entries(platformFeeBreakdownSeller).forEach(([k, val]) => { bd[k] = val.percent; });
            const data = await saveToBackend({ platformFeeBreakdownSeller: bd });
            if (data.success) { 
                showToast('Seller Platform Fee saved successfully!', 'success');
                setOrigPFSeller(platformFeeBreakdownSeller);
                setEditingSellerPF(false);
            }
            else showToast(data.message || 'Failed to save', 'error');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingSellerPF(false); }
    };

    const handleSaveGST = async () => {
        setSavingGST(true);
        try {
            const data = await saveToBackend({ categoryGstRates });
            if (data.success) { 
                showToast('GST Rates saved successfully!', 'success');
                setOrigGST(categoryGstRates); 
                setEditingGST(false);
            }
            else showToast(data.message || 'Failed to save', 'error');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingGST(false); }
    };

    const handleSaveCapRanges = async () => {
        // Validation
        for (let i = 0; i < platformFeeCapRanges.length; i++) {
            const range = platformFeeCapRanges[i];
            
            if (range.capAmount < 0) {
                showToast('Cap amount cannot be negative', 'error'); 
                return;
            }
            
            if (range.max !== null && range.min >= range.max) {
                showToast(`Invalid range: ${range.label} - Min must be less than Max`, 'error'); 
                return;
            }
            
            for (let j = i + 1; j < platformFeeCapRanges.length; j++) {
                const other = platformFeeCapRanges[j];
                const overlap = (range.min <= (other.max || Infinity) && (range.max || Infinity) >= other.min);
                if (overlap) {
                    showToast(`Overlapping ranges: ${range.label} and ${other.label}`, 'error'); 
                    return;
                }
            }
        }
        
        setSavingCapRanges(true);
        try {
            const data = await saveToBackend({ platformFeeCapRanges });
            if (data.success) { 
                showToast('Platform Fee Cap Limits saved successfully!', 'success');
                setOrigPlatformFeeCapRanges(platformFeeCapRanges); 
                setEditingCapRanges(false);
            }
            else showToast(data.message || 'Failed to save', 'error');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingCapRanges(false); }
    };

    const addCapRange = () => {
        if (platformFeeCapRanges.length >= 6) {
            showToast('Maximum 6 ranges allowed', 'warning');
            return;
        }
        const newId = `caprange${Date.now()}`;
        const lastRange = platformFeeCapRanges[platformFeeCapRanges.length - 1];
        const newMin = lastRange.max ? lastRange.max + 1 : 100001;
        setPlatformFeeCapRanges([...platformFeeCapRanges, {
            id: newId,
            label: `₹${newMin.toLocaleString()} & above`,
            min: newMin,
            max: null,
            capAmount: 0
        }]);
    };

    const deleteCapRange = (id) => {
        if (platformFeeCapRanges.length <= 1) {
            showToast('At least one range is required', 'warning');
            return;
        }
        setPlatformFeeCapRanges(platformFeeCapRanges.filter(r => r.id !== id));
    };

    const allCategories = [...SELLER_CATEGORIES, ...customCategories.filter(c => !SELLER_CATEGORIES.includes(c))];
    const displayCategories = allCategories.filter(c => !catSearch || c.toLowerCase().includes(catSearch.toLowerCase()));

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
            <Loader className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        </div>
    );


    return (
        <>
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                /* Hide number input spinners */
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                    appearance: textfield;
                }
            `}</style>

            <div className="animate-fade-in flex flex-col gap-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={24} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Platform Settings</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure platform charges and category GST rates</p>
                    </div>
                </div>
            </div>

            {/* Platform Fee Cap Limits */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Fee Cap Limits</span>
                    </div>
                    <SectionButtons editing={editingCapRanges} saving={savingCapRanges}
                        onEdit={() => setEditingCapRanges(true)} onSave={handleSaveCapRanges}
                        onCancel={() => { setPlatformFeeCapRanges(origPlatformFeeCapRanges); setEditingCapRanges(false); }} />
                </div>

                <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(99,102,241,0.05)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#1D5FD4', lineHeight: 1.6 }}>
                        Set a maximum platform fee per product price range. If the calculated percentage fee exceeds this cap, the cap amount is charged instead. Set to 0 for no cap.
                    </p>
                </div>

                {!editingCapRanges ? (
                    // NON-EDITING STATE - Card Style with Min/Max boxes in center
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {platformFeeCapRanges.map((range, idx) => (
                            <div key={range.id} style={{ 
                                display: 'grid',
                                gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                                gap: '1rem',
                                alignItems: 'center',
                                padding: '1rem 1.5rem', 
                                background: 'var(--background)', 
                                borderRadius: '10px', 
                                border: '1px solid var(--border)',
                                transition: 'all 0.2s'
                            }}>
                                {/* Label */}
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
                                        {range.label}
                                    </div>
                                </div>
                                
                                {/* Min Box */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase' }}>Min</div>
                                    <div style={{ 
                                        padding: '0.6rem 0.8rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--border)', 
                                        fontSize: '1rem', 
                                        fontWeight: 600,
                                        background: 'var(--surface)', 
                                        color: 'var(--text)'
                                    }}>
                                        ₹{range.min.toLocaleString()}
                                    </div>
                                </div>
                                
                                {/* Max Box */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase' }}>Max</div>
                                    <div style={{ 
                                        padding: '0.6rem 0.8rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--border)', 
                                        fontSize: '1rem', 
                                        fontWeight: 600,
                                        background: 'var(--surface)', 
                                        color: 'var(--text)'
                                    }}>
                                        {range.max ? `₹${range.max.toLocaleString()}` : '& above'}
                                    </div>
                                </div>
                                
                                {/* Cap Amount Box */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase' }}>Cap Amount</div>
                                    <div style={{ 
                                        padding: '0.6rem 0.8rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--border)', 
                                        fontSize: '1rem', 
                                        fontWeight: 600,
                                        background: 'var(--surface)', 
                                        color: 'var(--text)'
                                    }}>
                                        ₹{range.capAmount}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // EDITING STATE - Table Style
                    <>
                        {/* Cap Ranges Table Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--surface)', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price Range Label</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Min (₹)</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Max (₹)</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Cap Amount (₹)</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Action</div>
                        </div>

                        {/* Cap Ranges Table Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {platformFeeCapRanges.map((range, idx) => (
                                <div key={range.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '10px', background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                                    {/* Label */}
                                    <input
                                        type="text"
                                        value={range.label}
                                        onChange={e => {
                                            setPlatformFeeCapRanges(prev => prev.map((r, i) => i === idx ? { ...r, label: e.target.value } : r));
                                        }}
                                        style={{ 
                                            padding: '0.55rem 0.85rem',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            width: '100%', 
                                            textAlign: 'left', 
                                            cursor: 'text',
                                            border: '2px solid var(--primary)',
                                            fontWeight: 600,
                                            background: 'white',
                                            color: '#000000',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    />
                                    
                                    {/* Min */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>₹</span>
                                        <input
                                            type="number"
                                            value={range.min}
                                            onChange={e => {
                                                const v = parseFloat(e.target.value);
                                                if (!isNaN(v) && v >= 0) {
                                                    setPlatformFeeCapRanges(prev => prev.map((r, i) => i === idx ? { ...r, min: v } : r));
                                                }
                                            }}
                                            min="0" step="1"
                                            style={{ 
                                                padding: '0.55rem 0.85rem',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem',
                                                width: '90px', 
                                                textAlign: 'center', 
                                                cursor: 'text',
                                                border: '2px solid var(--primary)',
                                                fontWeight: 600,
                                                background: 'white',
                                                color: '#000000',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Max */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>₹</span>
                                        <input
                                            type="number"
                                            value={range.max ?? ''}
                                            placeholder="& above"
                                            onChange={e => {
                                                if (e.target.value === '') {
                                                    setPlatformFeeCapRanges(prev => prev.map((r, i) => i === idx ? { ...r, max: null } : r));
                                                } else {
                                                    const v = parseFloat(e.target.value);
                                                    if (!isNaN(v) && v >= 0) {
                                                        setPlatformFeeCapRanges(prev => prev.map((r, i) => i === idx ? { ...r, max: v } : r));
                                                    }
                                                }
                                            }}
                                            min="0" step="1"
                                            style={{ 
                                                padding: '0.55rem 0.85rem',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem',
                                                width: '90px', 
                                                textAlign: 'center', 
                                                cursor: 'text',
                                                border: '2px solid var(--primary)',
                                                fontWeight: 600,
                                                background: 'white',
                                                color: '#000000',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Cap Amount */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>₹</span>
                                        <input
                                            type="number"
                                            value={range.capAmount}
                                            placeholder="No cap"
                                            onChange={e => {
                                                const v = parseFloat(e.target.value);
                                                if (!isNaN(v) && v >= 0) {
                                                    setPlatformFeeCapRanges(prev => prev.map((r, i) => i === idx ? { ...r, capAmount: v } : r));
                                                } else if (e.target.value === '') {
                                                    setPlatformFeeCapRanges(prev => prev.map((r, i) => i === idx ? { ...r, capAmount: 0 } : r));
                                                }
                                            }}
                                            min="0" step="1"
                                            style={{ 
                                                padding: '0.55rem 0.85rem',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem',
                                                width: '90px', 
                                                textAlign: 'center', 
                                                cursor: 'text',
                                                border: '2px solid var(--primary)',
                                                fontWeight: 600,
                                                background: 'white',
                                                color: '#000000',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Delete Button */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => deleteCapRange(range.id)}
                                            disabled={platformFeeCapRanges.length <= 1}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: platformFeeCapRanges.length > 1 ? '#dc2626' : 'var(--border)',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: platformFeeCapRanges.length > 1 ? 'pointer' : 'not-allowed',
                                                opacity: platformFeeCapRanges.length > 1 ? 1 : 0.5
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Range Button */}
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                onClick={addCapRange}
                                disabled={platformFeeCapRanges.length >= 6}
                                title={platformFeeCapRanges.length >= 6 ? 'Maximum 6 ranges allowed' : 'Add a new cap range'}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--primary)',
                                    background: platformFeeCapRanges.length < 6 ? 'var(--primary)' : 'var(--surface)',
                                    color: platformFeeCapRanges.length < 6 ? 'white' : 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: platformFeeCapRanges.length < 6 ? 'pointer' : 'not-allowed',
                                    opacity: platformFeeCapRanges.length < 6 ? 1 : 0.5,
                                    transition: 'all 0.2s'
                                }}
                            >
                                + Add Range
                            </button>
                            {platformFeeCapRanges.length >= 6 && (
                                <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, alignSelf: 'center' }}>
                                    Maximum 6 ranges allowed
                                </span>
                            )}
                        </div>
                    </>
                )}

                <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6 }}>
                        <strong>How it works:</strong> When a product's calculated platform fee exceeds the cap for its price range, the cap amount is used instead. The cap is split proportionally across all fee components. Users see the normal breakdown without any cap indicator.
                    </p>
                </div>
            </div>

            {/* Platform Fee Breakdown - NEW COMPACT UI */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Fee Breakdown</span>
                    </div>
                </div>

                {/* Side by Side: User (Left) and Seller (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    
                    {/* USER FEES - LEFT SIDE */}
                    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '2px solid var(--border)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>User Fees</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
                                    {calculateTotalPlatformFeePercent(platformFeeBreakdown).toFixed(2)}%
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Applied to consumers at checkout
                                </div>
                            </div>
                            <SectionButtons editing={editingUserPF} saving={savingUserPF}
                                onEdit={() => setEditingUserPF(true)} onSave={handleSaveUserPF}
                                onCancel={() => { setPlatformFeeBreakdown(origPF); setEditingUserPF(false); }} />
                        </div>

                        {/* User Fee Components */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries(platformFeeBreakdown).map(([key, value]) => (
                                <div key={key} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '1rem', 
                                    background: editingUserPF ? 'rgba(99,102,241,0.05)' : 'var(--background)', 
                                    borderRadius: '10px', 
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                                            {value.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                            {value.description}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                                        <input 
                                            type="number" 
                                            value={value.percent} 
                                            disabled={!editingUserPF}
                                            onChange={e => { 
                                                const v = parseFloat(e.target.value); 
                                                if (!isNaN(v) && v >= 0 && v <= 10) {
                                                    setPlatformFeeBreakdown(p => ({ ...p, [key]: { ...p[key], percent: v } }));
                                                }
                                            }}
                                            min="0" max="10" step="0.1" 
                                            style={{ 
                                                padding: '0.6rem 0.8rem', 
                                                borderRadius: '8px', 
                                                border: editingUserPF ? '2px solid var(--primary)' : '1px solid var(--border)', 
                                                fontSize: '1rem', 
                                                fontWeight: 600,
                                                background: 'var(--surface)', 
                                                color: 'var(--text)', 
                                                width: '80px', 
                                                outline: 'none', 
                                                textAlign: 'center',
                                                cursor: editingUserPF ? 'text' : 'not-allowed',
                                                transition: 'all 0.2s'
                                            }} 
                                        />
                                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SELLER FEES - RIGHT SIDE */}
                    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '2px solid var(--border)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seller Fees</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
                                    {calculateTotalPlatformFeePercent(platformFeeBreakdownSeller).toFixed(2)}%
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Deducted from seller payouts
                                </div>
                            </div>
                            <SectionButtons editing={editingSellerPF} saving={savingSellerPF}
                                onEdit={() => setEditingSellerPF(true)} onSave={handleSaveSellerPF}
                                onCancel={() => { setPlatformFeeBreakdownSeller(origPFSeller); setEditingSellerPF(false); }} />
                        </div>

                        {/* Seller Fee Components */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries(platformFeeBreakdownSeller).map(([key, value]) => (
                                <div key={key} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '1rem', 
                                    background: editingSellerPF ? 'rgba(99,102,241,0.05)' : 'var(--background)', 
                                    borderRadius: '10px', 
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                                            {value.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                            {value.description}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                                        <input 
                                            type="number" 
                                            value={value.percent} 
                                            disabled={!editingSellerPF}
                                            onChange={e => { 
                                                const v = parseFloat(e.target.value); 
                                                if (!isNaN(v) && v >= 0 && v <= 10) {
                                                    setPlatformFeeBreakdownSeller(p => ({ ...p, [key]: { ...p[key], percent: v } }));
                                                }
                                            }}
                                            min="0" max="10" step="0.1" 
                                            style={{ 
                                                padding: '0.6rem 0.8rem', 
                                                borderRadius: '8px', 
                                                border: editingSellerPF ? '2px solid var(--primary)' : '1px solid var(--border)', 
                                                fontSize: '1rem', 
                                                fontWeight: 600,
                                                background: 'var(--surface)', 
                                                color: 'var(--text)', 
                                                width: '80px', 
                                                outline: 'none', 
                                                textAlign: 'center',
                                                cursor: editingSellerPF ? 'text' : 'not-allowed',
                                                transition: 'all 0.2s'
                                            }} 
                                        />
                                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6, fontWeight: 500 }}>
                        Each component max 10%, total max 20%. User fees charged at checkout, seller fees deducted from payouts.
                    </p>
                </div>
            </div>

            {/* Category GST Rates */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={16} style={{ color: 'var(--secondary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category GST Rates</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>applied to all products per category</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Search category..." value={catSearch} onChange={e => setCatSearch(e.target.value)}
                            style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text)', width: '180px', outline: 'none' }} />
                        <button className="btn btn-secondary" onClick={() => setCatSearch('')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Clear</button>
                        <SectionButtons editing={editingGST} saving={savingGST}
                            onEdit={() => setEditingGST(true)} onSave={handleSaveGST}
                            onCancel={() => { setCategoryGstRates(origGST); setEditingGST(false); }} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto', padding: '0.25rem' }}>
                    {displayCategories.map(cat => {
                        const isCustom = !SELLER_CATEGORIES.includes(cat);
                        return (
                            <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '10px', background: editingGST ? 'rgba(99,102,241,0.05)' : 'var(--surface)', border: '1px solid ' + (isCustom ? 'var(--primary)' : 'var(--border)'), transition: 'all 0.2s' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)', flex: 1, marginRight: '0.5rem' }}>
                                    {cat}
                                    {isCustom && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '6px', fontWeight: 700 }}>CUSTOM</span>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input type="number" value={categoryGstRates[cat] ?? 18} disabled={!editingGST}
                                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setCategoryGstRates(p => ({ ...p, [cat]: v })); }}
                                        min="0" max="100" step="0.5" style={{ 
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '8px',
                                            border: editingGST ? '2px solid var(--primary)' : '1px solid #d1d5db',
                                            fontSize: '0.95rem',
                                            background: 'white',
                                            color: '#000000',
                                            width: '70px',
                                            outline: 'none',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            cursor: editingGST ? 'text' : 'not-allowed',
                                            transition: 'all 0.2s'
                                        }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                                    {isCustom && editingGST && (
                                        <button onClick={() => { setCategoryGstRates(p => { const n = { ...p }; delete n[cat]; return n; }); setCustomCategories(p => p.filter(c => c !== cat)); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, padding: '0 4px' }}>x</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How It Works */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid rgba(245,158,11,0.25)' }}>
                    <Truck size={16} style={{ color: '#d97706' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400e' }}>How It Works</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {[
                        'Click Edit to modify a section, then Save to persist changes to the database',
                        'Platform fee and shipping changes apply immediately in consumer checkout order summary',
                        'GST rate changes apply to sellers without a GST number and in consumer checkout'
                    ].map((note, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <span style={{ color: '#d97706', fontWeight: 700, fontSize: '1rem', lineHeight: 1, marginTop: '1px' }}>•</span>
                            <span style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6 }}>{note}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shipping Analytics & Handling */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                    <Truck size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Analytics & Handling</span>
                </div>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Calculation Method */}
                    <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                            Shipping Calculation Method
                        </h4>
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Shipping charges are calculated using Shiprocket-based estimation logic with the following factors:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            <div style={{ padding: '0.6rem', background: 'rgba(59,124,241,0.05)', borderRadius: '8px', border: '1px solid rgba(59,124,241,0.2)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>BASE RATE</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>₹40</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Fixed base charge</div>
                            </div>
                            <div style={{ padding: '0.6rem', background: 'rgba(59,124,241,0.05)', borderRadius: '8px', border: '1px solid rgba(59,124,241,0.2)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>WEIGHT</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>₹20/kg</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Per kilogram</div>
                            </div>
                            <div style={{ padding: '0.6rem', background: 'rgba(59,124,241,0.05)', borderRadius: '8px', border: '1px solid rgba(59,124,241,0.2)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ITEM</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>₹10/item</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Additional items</div>
                            </div>
                            <div style={{ padding: '0.6rem', background: 'rgba(59,124,241,0.05)', borderRadius: '8px', border: '1px solid rgba(59,124,241,0.2)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ZONE</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>1.0x / 1.2x</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Metro/Non-Metro</div>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Formula & Metro Zones - Combined */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                Calculation Formula
                            </h4>
                            <div style={{ padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', fontFamily: 'monospace', fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.6 }}>
                                <div>Total = (Base + Weight + Item) × Zone</div>
                                <div style={{ marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Example: (₹40 + ₹20 + ₹10) × 1.2 = ₹84</div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                Metro Zone Pincodes (1.0x)
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {['110 (Delhi)', '400 (Mumbai)', '560 (Bangalore)', '600 (Chennai)', '700 (Kolkata)', '800 (Hyderabad)'].map(zone => (
                                    <span key={zone} style={{ padding: '0.3rem 0.6rem', background: 'rgba(34,197,94,0.1)', color: '#15803d', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid rgba(34,197,94,0.3)' }}>
                                        {zone}
                                    </span>
                                ))}
                            </div>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Others: Non-Metro (1.2x)
                            </p>
                        </div>
                    </div>

                    {/* Delivery Estimates */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.05)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>METRO ZONES</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#15803d' }}>2-4 days</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Faster delivery to major cities</div>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>NON-METRO ZONES</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#d97706' }}>3-6 days</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Standard delivery to other areas</div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div style={{ padding: '0.85rem', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                            Important Notes
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.6 }}>
                            <li>Real-time calculation at checkout based on delivery pincode</li>
                            <li>No admin configuration required - uses Shiprocket estimation automatically</li>
                            <li>Default weight: 0.5kg per item (overridable with actual product weight)</li>
                            <li>Final charges rounded to nearest ₹5 for cleaner pricing</li>
                        </ul>
                    </div>
                </div>
            </div>

            </div>
        </>
    );
}
