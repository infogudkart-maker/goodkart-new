import { useState, useEffect } from 'react';
import { User, Store, MapPin, CreditCard, Package, CheckCircle, AlertCircle, ImageIcon, Edit3, Send, Loader, X } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function SellerProfileTab({ profile, sellerUid }) {
    const [personalTab, setPersonalTab] = useState('personal');
    const [showEditModal, setShowEditModal] = useState(false);
    const [correctionMessage, setCorrectionMessage] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [requestError, setRequestError] = useState('');
    const [adminNotification, setAdminNotification] = useState(null);

    useEffect(() => {
        // Check for unseen admin update notification
        // Only show if it's recent (within last 7 days) and not seen
        if (profile?.adminUpdateNotification?.seen === false) {
            const notificationDate = new Date(profile.adminUpdateNotification.updatedAt);
            const now = new Date();
            const daysDiff = (now - notificationDate) / (1000 * 60 * 60 * 24);
            
            // Only show if notification is less than 7 days old
            if (daysDiff <= 7) {
                setAdminNotification(profile.adminUpdateNotification);
            } else {
                // Auto-dismiss old notifications
                if (sellerUid) {
                    authFetch(`/seller/${sellerUid}/notification-seen`, { method: 'PUT' }).catch(console.error);
                }
            }
        }
    }, [profile, sellerUid]);

    const dismissNotification = async () => {
        setAdminNotification(null);
        try {
            if (sellerUid) {
                await authFetch(`/seller/${sellerUid}/notification-seen`, { method: 'PUT' });
            }
        } catch (e) {
            console.error('Failed to mark notification seen:', e);
        }
    };

    const handleSendCorrectionRequest = async () => {
        if (!correctionMessage.trim()) {
            setRequestError('Please describe the changes you need.');
            return;
        }
        
        if (!sellerUid) {
            setRequestError('Unable to identify your account. Please log out and log in again.');
            return;
        }
        
        setSendingRequest(true);
        setRequestError('');
        try {
            
            const response = await authFetch('/seller/correction-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerUid: sellerUid,
                    sellerName: profile.fullName || profile.name || 'Unknown Seller',
                    shopName: profile.shopName || profile.supplierName || 'Unknown Shop',
                    message: correctionMessage.trim()
                })
            });
            const data = await response.json();
            if (data.success) {
                setRequestSent(true);
                setCorrectionMessage('');
                setTimeout(() => {
                    setShowEditModal(false);
                    setRequestSent(false);
                }, 3000);
            } else {
                setRequestError(data.message || 'Failed to send request. Please try again.');
            }
        } catch (err) {
            console.error('Correction request error:', err);
            setRequestError('Server connection failed. Please try again later.');
        } finally {
            setSendingRequest(false);
        }
    };

    return (
        <div className="animate-fade-in flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-2">
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Personal & Business Details</h2>
                    <p className="text-sm text-gray-500">Manage your verified account information</p>
                </div>
                <button
                    onClick={() => setShowEditModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '0.75rem 1.5rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3B7CF1, #0D0070)',
                        color: 'white', fontWeight: 600, fontSize: '0.9rem',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(123, 77, 219, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 16px rgba(123, 77, 219, 0.4)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(123, 77, 219, 0.3)'; }}
                >
                    <Edit3 size={16} /> Request Edit
                </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-1.5 md:gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {[
                    { id: 'personal', label: 'Personal', icon: <User size={16} /> },
                    { id: 'business', label: 'Business', icon: <Store size={16} /> },
                    { id: 'pickup', label: 'Pickup', icon: <MapPin size={16} /> },
                    { id: 'bank', label: 'Bank', icon: <CreditCard size={16} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setPersonalTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '0.6rem 0.9rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600,
                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                            background: personalTab === t.id ? 'var(--primary)10' : 'transparent',
                            color: personalTab === t.id ? 'var(--primary)' : '#64748b',
                            border: 'none', cursor: 'pointer'
                        }}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl p-4 md:p-10 border border-gray-100 min-h-[300px] md:min-h-[400px]">
                {personalTab === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Identity Details</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {[
                                { label: 'Full Name', value: profile.fullName || profile.name || 'N/A' },
                                    { label: 'Aadhaar Number', value: profile.aadhaarNumber ? `XXXX XXXX ${profile.aadhaarNumber.slice(-4)}` : 'N/A' },
                                    { label: 'Phone Number', value: profile.phoneNumber || 'N/A' },
                                    { label: 'Age', value: profile.age || 'N/A' },
                                    { label: 'Email', value: profile.emailId || 'N/A' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-lg font-semibold text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {profile.aadhaarImageUrl && (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Document Proof</h3>
                                <div className="rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 bg-gray-50 p-2">
                                    <img src={profile.aadhaarImageUrl} alt="Aadhaar" className="w-full h-auto rounded-xl shadow-sm" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                                </div>
                                <p className="text-xs text-gray-400 italic flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Verified via Gemini Vision AI</p>
                            </div>
                        )}
                    </div>
                )}

                {personalTab === 'business' && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[
                                { label: 'Supplier/Shop Name', value: profile.supplierName || profile.shopName, icon: <Store className="text-[#3B7CF1]" /> },
                                { label: 'Business Type', value: profile.businessType || 'N/A', icon: <User className="text-[#3B7CF1]" /> },
                                { label: 'Product Category', value: profile.productCategory || profile.shopCategory || 'N/A', icon: <Package className="text-orange-500" /> },
                                { label: 'Contact Email', value: profile.contactEmail || profile.emailId || 'N/A', icon: <ImageIcon className="text-pink-500" /> },
                                { label: 'GST Number', value: profile.gstNumber || 'Exempted (EID)', icon: <CheckCircle className="text-green-500" /> },
                                { label: 'PAN Number', value: profile.panNumber || 'N/A', icon: <CreditCard className="text-[#3B7CF1]" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:shadow-md">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-gray-100">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-lg font-bold text-gray-800 break-words">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {personalTab === 'pickup' && (
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-2xl font-bold text-gray-900">Shipment Pickup Address</h3>
                                <p className="text-gray-500 text-xs md:text-sm">This address will be used for courier pickups</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl md:rounded-[2rem] p-5 md:p-10 border border-gray-100 space-y-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest underline decoration-orange-200 decoration-2 underline-offset-4">Primary Pickup Location</span>
                                <p className="text-xl font-medium text-gray-800 leading-relaxed italic">
                                    "{profile.pickupAddress || profile.shopAddress || 'Address not provided'}"
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-6 border-t border-gray-200">
                                {[
                                    { label: 'City', value: profile.pickupCity || profile.city || 'N/A' },
                                    { label: 'State', value: profile.pickupState || profile.state || 'N/A' },
                                    { label: 'Pincode', value: profile.pickupPincode || profile.pincode || 'N/A' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                                        <span className="text-lg font-bold text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {personalTab === 'bank' && (
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-inner">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-2xl font-bold text-gray-900">Financial Settlements</h3>
                                <p className="text-gray-500 text-xs md:text-sm">Bank account for payouts and tax compliance</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Account Holder Name', value: profile.bankAccountName || 'N/A' },
                                { label: 'Account Number', value: profile.accountNumber ? `XXXXXXXX${profile.accountNumber.slice(-4)}` : 'N/A' },
                                { label: 'IFSC Code', value: profile.ifscCode || 'N/A' },
                                { label: 'UPI ID', value: profile.upiId || 'N/A' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-5 md:p-8 rounded-xl md:rounded-[1.5rem] bg-white border border-gray-100 shadow-sm flex flex-col gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-xl font-bold text-blue-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-xl md:rounded-2xl bg-blue-50 border border-blue-100 flex items-start md:items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-700 shadow-sm shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <p className="text-sm text-blue-900 font-medium">To change your primary bank account, please use the "Request Edit" button above to submit a correction request to admin.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Correction Request Modal */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}
                    onClick={() => { if (!sendingRequest) { setShowEditModal(false); setRequestSent(false); setRequestError(''); } }}
                >
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '560px', width: '90%', position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        animation: 'fadeInUp 0.3s ease-out'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { if (!sendingRequest) { setShowEditModal(false); setRequestSent(false); setRequestError(''); } }}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer'
                            }}
                        >
                            <X size={18} color="#64748b" />
                        </button>

                        {requestSent ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: '#ecfdf5', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 1.5rem'
                                }}>
                                    <CheckCircle size={32} color="#10b981" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                    Request Sent Successfully!
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                                    Your correction request has been sent to the admin team. They will review and update your details shortly.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #3B7CF1, #0D0070)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Edit3 size={20} color="white" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                                                Request Data Correction
                                            </h3>
                                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                                                Admin will review and update your details
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: '#fef3c7', border: '1px solid #fde68a',
                                    borderRadius: '12px', padding: '0.75rem 1rem',
                                    marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <AlertCircle size={16} color="#d97706" />
                                    <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0, fontWeight: 500 }}>
                                        You cannot edit your details directly. Please describe the changes needed below, and admin will update them after verification.
                                    </p>
                                </div>

                                {requestError && (
                                    <div style={{
                                        background: '#fef2f2', border: '1px solid #fecaca',
                                        borderRadius: '12px', padding: '0.75rem 1rem',
                                        marginBottom: '1rem', color: '#b91c1c', fontSize: '0.85rem'
                                    }}>
                                        {requestError}
                                    </div>
                                )}

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block', fontSize: '0.85rem', fontWeight: 600,
                                        color: '#374151', marginBottom: '0.5rem'
                                    }}>
                                        Describe the changes you need *
                                    </label>
                                    <textarea
                                        value={correctionMessage}
                                        onChange={(e) => setCorrectionMessage(e.target.value)}
                                        placeholder="e.g. Please update my phone number from 9876543210 to 9876543211. Also update my shop name from 'Old Name' to 'New Name'..."
                                        rows={5}
                                        style={{
                                            width: '100%', padding: '0.875rem 1rem',
                                            border: '1.5px solid #e2e8f0', borderRadius: '12px',
                                            fontSize: '0.9rem', resize: 'vertical',
                                            outline: 'none', transition: 'border-color 0.2s',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3B7CF1'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        Be specific about what fields need to change and their new values
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { setShowEditModal(false); setRequestError(''); }}
                                        disabled={sendingRequest}
                                        style={{
                                            padding: '0.75rem 1.5rem', borderRadius: '12px',
                                            border: '1px solid #e2e8f0', background: 'white',
                                            color: '#64748b', fontWeight: 600, cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendCorrectionRequest}
                                        disabled={sendingRequest || !correctionMessage.trim()}
                                        style={{
                                            padding: '0.75rem 1.5rem', borderRadius: '12px',
                                            border: 'none', background: sendingRequest ? '#94a3b8' : 'linear-gradient(135deg, #3B7CF1, #0D0070)',
                                            color: 'white', fontWeight: 600, cursor: sendingRequest ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px',
                                            opacity: !correctionMessage.trim() ? 0.5 : 1,
                                            boxShadow: '0 4px 12px rgba(123, 77, 219, 0.3)'
                                        }}
                                    >
                                        {sendingRequest ? (
                                            <><Loader size={16} className="animate-spin" /> Sending...</>
                                        ) : (
                                            <><Send size={16} /> Send to Admin</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Update Notification Popup */}
            {adminNotification && (
                <div className="admin-toast" style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    background: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxWidth: '380px',
                    border: '1.5px solid #e0f2fe', animation: 'fadeInUp 0.3s ease-out',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: '#ecfdf5', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0
                    }}>
                        <CheckCircle size={22} color="#10b981" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                            Profile Updated by Admin
                        </p>
                        <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                            {adminNotification.message || 'Admin has updated your profile details.'}
                        </p>
                        <button
                            onClick={dismissNotification}
                            style={{
                                marginTop: '0.75rem', padding: '0.4rem 1rem',
                                background: 'linear-gradient(135deg, #3B7CF1, #0D0070)',
                                color: 'white', border: 'none', borderRadius: '8px',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Got it
                        </button>
                    </div>
                    <button onClick={dismissNotification} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px'
                    }}>
                        <X size={16} color="#94a3b8" />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}






