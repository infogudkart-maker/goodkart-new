import { useState, useEffect } from 'react';
import { X, Save, User, Building, CreditCard, FileText, MapPin } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function SellerEditModal({ seller, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('request');

    const [formData, setFormData] = useState({
        personalInfo: {
            name: '', email: '', phone: '',
            address: '', city: '', state: '', pincode: '',
            aadhaarNumber: '', extractedName: '',
            emailId: '', phoneNumber: ''
        },
        businessInfo: {
            shopName: '', supplierName: '', businessType: '',
            gstNumber: '', panNumber: '',
            category: '', productCategory: '', contactEmail: ''
        },
        pickupInfo: {
            pickupAddress: '', pickupCity: '', pickupState: '', pickupPincode: ''
        },
        bankDetails: {
            accountNumber: '', ifscCode: '', bankName: '',
            accountHolderName: '', bankAccountName: '', upiId: ''
        },
        adminNotes: ''
    });

    useEffect(() => {
        if (seller) fetchSellerDetails();
    }, [seller]);

    const fetchSellerDetails = async () => {
        setLoading(true);
        try {
            const response = await authFetch(`/admin/seller/${seller.uid}/edit`);
            const data = await response.json();
            if (data.success) {
                setFormData({
                    personalInfo: data.seller.personalInfo || {},
                    businessInfo: data.seller.businessInfo || {},
                    pickupInfo: data.seller.pickupInfo || {},
                    bankDetails: data.seller.bankDetails || {},
                    adminNotes: data.seller.adminNotes || ''
                });
            } else {
                alert('Failed to fetch seller details: ' + data.message);
            }
        } catch (error) {
            console.error('Error fetching seller details:', error);
            alert('Error fetching seller details');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await authFetch(`/admin/seller/${seller.uid}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                if (seller.requestId) {
                    await authFetch(`/admin/correction-request/${seller.requestId}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminNote: formData.adminNotes })
                    });
                }
                alert('✅ Seller details updated successfully!');
                onSave();
                onClose();
            } else {
                alert('❌ Failed to update seller: ' + data.message);
            }
        } catch (error) {
            console.error('Error updating seller:', error);
            alert('Error updating seller details');
        } finally {
            setSaving(false);
        }
    };

    if (!seller) return null;

    const inputStyle = {
        width: '100%', padding: '0.75rem',
        border: '2px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem',
        boxSizing: 'border-box'
    };
    const readOnlyStyle = { ...inputStyle, background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' };
    const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' };
    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' };

    const tabs = [
        { id: 'request', label: 'Edit Request', icon: FileText },
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'business', label: 'Business Info', icon: Building },
        { id: 'pickup', label: 'Pickup Address', icon: MapPin },
        { id: 'bank', label: 'Bank Details', icon: CreditCard },
        { id: 'notes', label: 'Admin Notes', icon: FileText }
    ];

    return (
        <div className="animate-fade-in" style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{
                borderRadius: '12px', padding: '1.5rem 2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px',
                        padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center',
                        gap: '6px', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: '0.9rem'
                    }}>
                        ← Back
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Edit Seller Details</h2>
                        <p style={{ margin: '0.4rem 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
                            {seller.shopName || seller.name} • {seller.email}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--surface-card, white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', border: '4px solid var(--border)',
                            borderTopColor: 'var(--primary)', borderRadius: '50%',
                            margin: '0 auto 1rem', animation: 'spin 1s linear infinite'
                        }}></div>
                        <p>Loading seller details...</p>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', overflowX: 'auto' }}>
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                        flex: '0 0 auto', padding: '0.85rem 1rem', border: 'none',
                                        background: activeTab === tab.id ? 'white' : 'transparent',
                                        borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem',
                                        fontWeight: activeTab === tab.id ? 600 : 400,
                                        color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <Icon size={15} />{tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.75rem 2rem', maxHeight: '58vh', overflowY: 'auto' }}>

                            {/* ── Edit Request Tab ── */}
                            {activeTab === 'request' && (
                                <div>
                                    <div style={{
                                        background: '#fef3c7', border: '1px solid #fde68a',
                                        borderRadius: '12px', padding: '1rem 1.25rem',
                                        marginBottom: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start'
                                    }}>
                                        <FileText size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>Seller's Edit Request</p>
                                            <p style={{ margin: '0.25rem 0 0', color: '#78350f', fontSize: '0.8rem' }}>
                                                Requested on {seller.requestDate || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                        borderRadius: '12px', padding: '1.25rem', fontSize: '0.95rem',
                                        lineHeight: '1.7', color: '#1e293b', whiteSpace: 'pre-wrap', minHeight: '120px'
                                    }}>
                                        {seller.message || 'No message provided.'}
                                    </div>
                                    <p style={{ marginTop: '1.25rem', color: '#64748b', fontSize: '0.85rem' }}>
                                        Review the request above, then switch to the other tabs to make the changes and click <strong>Save Changes</strong>.
                                    </p>
                                </div>
                            )}

                            {/* ── Personal Info Tab ── */}
                            {activeTab === 'personal' && (
                                <div style={gridStyle}>
                                    <div>
                                        <label style={labelStyle}>Full Name</label>
                                        <input type="text" style={inputStyle} value={formData.personalInfo.name || ''}
                                            onChange={e => handleInputChange('personalInfo', 'name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Extracted Name (Aadhaar)</label>
                                        <input type="text" style={inputStyle} value={formData.personalInfo.extractedName || ''}
                                            onChange={e => handleInputChange('personalInfo', 'extractedName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Aadhaar Number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(read-only)</span></label>
                                        <input type="text" style={readOnlyStyle} readOnly value={formData.personalInfo.aadhaarNumber || ''} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Phone Number</label>
                                        <input type="tel" style={inputStyle} value={formData.personalInfo.phoneNumber || formData.personalInfo.phone || ''}
                                            onChange={e => { handleInputChange('personalInfo', 'phoneNumber', e.target.value); handleInputChange('personalInfo', 'phone', e.target.value); }} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Email ID</label>
                                        <input type="email" style={inputStyle} value={formData.personalInfo.emailId || formData.personalInfo.email || ''}
                                            onChange={e => { handleInputChange('personalInfo', 'emailId', e.target.value); handleInputChange('personalInfo', 'email', e.target.value); }} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input type="text" style={inputStyle} value={formData.personalInfo.city || ''}
                                            onChange={e => handleInputChange('personalInfo', 'city', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State</label>
                                        <input type="text" style={inputStyle} value={formData.personalInfo.state || ''}
                                            onChange={e => handleInputChange('personalInfo', 'state', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Pincode</label>
                                        <input type="text" style={inputStyle} value={formData.personalInfo.pincode || ''}
                                            onChange={e => handleInputChange('personalInfo', 'pincode', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Address</label>
                                        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                                            value={formData.personalInfo.address || ''}
                                            onChange={e => handleInputChange('personalInfo', 'address', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* ── Business Info Tab ── */}
                            {activeTab === 'business' && (
                                <div style={gridStyle}>
                                    <div>
                                        <label style={labelStyle}>Shop Name</label>
                                        <input type="text" style={inputStyle} value={formData.businessInfo.shopName || ''}
                                            onChange={e => handleInputChange('businessInfo', 'shopName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Supplier Name</label>
                                        <input type="text" style={inputStyle} value={formData.businessInfo.supplierName || ''}
                                            onChange={e => handleInputChange('businessInfo', 'supplierName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Business Type</label>
                                        <input type="text" style={inputStyle} value={formData.businessInfo.businessType || ''}
                                            onChange={e => handleInputChange('businessInfo', 'businessType', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Product Category</label>
                                        <input type="text" style={inputStyle} value={formData.businessInfo.productCategory || formData.businessInfo.category || ''}
                                            onChange={e => { handleInputChange('businessInfo', 'productCategory', e.target.value); handleInputChange('businessInfo', 'category', e.target.value); }} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Contact Email</label>
                                        <input type="email" style={inputStyle} value={formData.businessInfo.contactEmail || ''}
                                            onChange={e => handleInputChange('businessInfo', 'contactEmail', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>GST Number</label>
                                        <input type="text" style={inputStyle} value={formData.businessInfo.gstNumber || ''}
                                            onChange={e => handleInputChange('businessInfo', 'gstNumber', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>PAN Number</label>
                                        <input type="text" style={inputStyle} value={formData.businessInfo.panNumber || ''}
                                            onChange={e => handleInputChange('businessInfo', 'panNumber', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* ── Pickup Address Tab ── */}
                            {activeTab === 'pickup' && (
                                <div style={gridStyle}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Pickup Address</label>
                                        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                                            value={formData.pickupInfo.pickupAddress || ''}
                                            onChange={e => handleInputChange('pickupInfo', 'pickupAddress', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Pickup City</label>
                                        <input type="text" style={inputStyle} value={formData.pickupInfo.pickupCity || ''}
                                            onChange={e => handleInputChange('pickupInfo', 'pickupCity', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Pickup State</label>
                                        <input type="text" style={inputStyle} value={formData.pickupInfo.pickupState || ''}
                                            onChange={e => handleInputChange('pickupInfo', 'pickupState', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Pickup Pincode</label>
                                        <input type="text" style={inputStyle} value={formData.pickupInfo.pickupPincode || ''}
                                            onChange={e => handleInputChange('pickupInfo', 'pickupPincode', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* ── Bank Details Tab ── */}
                            {activeTab === 'bank' && (
                                <div style={gridStyle}>
                                    <div>
                                        <label style={labelStyle}>Account Holder Name</label>
                                        <input type="text" style={inputStyle} value={formData.bankDetails.accountHolderName || formData.bankDetails.bankAccountName || ''}
                                            onChange={e => { handleInputChange('bankDetails', 'accountHolderName', e.target.value); handleInputChange('bankDetails', 'bankAccountName', e.target.value); }} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Account Number</label>
                                        <input type="text" style={inputStyle} value={formData.bankDetails.accountNumber || ''}
                                            onChange={e => handleInputChange('bankDetails', 'accountNumber', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>IFSC Code</label>
                                        <input type="text" style={inputStyle} value={formData.bankDetails.ifscCode || ''}
                                            onChange={e => handleInputChange('bankDetails', 'ifscCode', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Bank Name</label>
                                        <input type="text" style={inputStyle} value={formData.bankDetails.bankName || ''}
                                            onChange={e => handleInputChange('bankDetails', 'bankName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>UPI ID</label>
                                        <input type="text" style={inputStyle} value={formData.bankDetails.upiId || ''}
                                            onChange={e => handleInputChange('bankDetails', 'upiId', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* ── Admin Notes Tab ── */}
                            {activeTab === 'notes' && (
                                <div>
                                    <label style={labelStyle}>Admin Notes</label>
                                    <textarea
                                        value={formData.adminNotes}
                                        onChange={e => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        rows={8}
                                        placeholder="Add any notes about this seller or the changes made..."
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1.25rem 2rem', borderTop: '1px solid var(--border)',
                            display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--surface)'
                        }}>
                            <button onClick={onClose} style={{
                                padding: '0.75rem 1.5rem', border: '2px solid var(--border)',
                                borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '1rem'
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{
                                padding: '0.75rem 1.5rem', border: '2px solid var(--primary)',
                                borderRadius: '8px', background: 'var(--primary)', color: 'white',
                                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1
                            }}>
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

