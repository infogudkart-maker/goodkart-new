import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';
import {
    ShoppingBag, Heart, Settings, LogOut, User, MapPin,
    LayoutDashboard, Star, ArrowLeft, XCircle, Loader, ShoppingCart
} from 'lucide-react';
import { listenToWishlist, removeFromWishlist as removeFromWishlistAPI } from '@/modules/shared/utils/wishlistUtils';
import { listenToCart } from '@/modules/shared/utils/cartUtils';
import ReviewModal from '@/modules/shared/components/common/ReviewModal';
import { fetchWithCache } from '@/modules/shared/utils/firestoreCache';

import ConsumerOverviewTab from '@/modules/consumer/components/Dashboard/ConsumerOverviewTab';
import ConsumerOrdersTab from '@/modules/consumer/components/Dashboard/ConsumerOrdersTab';
import ConsumerCartTab from '@/modules/consumer/components/Dashboard/ConsumerCartTab';
import ConsumerWishlistTab from '@/modules/consumer/components/Dashboard/ConsumerWishlistTab';
import ConsumerAddressTab from '@/modules/consumer/components/Dashboard/ConsumerAddressTab';
import ConsumerReviewsTab from '@/modules/consumer/components/Dashboard/ConsumerReviewsTab';
import ConsumerSettingsTab from '@/modules/consumer/components/Dashboard/ConsumerSettingsTab';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

export default function ConsumerDashboard() {
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [reviewableOrders, setReviewableOrders] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, totalSpent: 0 });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingAddress, setEditingAddress] = useState(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({ fullName: '', email: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let wishlistUnsubscribe = null;
        let cartUnsubscribe = null;
        let mounted = true;

        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (!mounted) return;
            
            const localUser = JSON.parse(localStorage.getItem('user') || 'null');
            const expectedUid = localUser?.uid;

            // Isolation Guard: Only use Firebase user if it matches our consumer session UID
            const isMatch = currentUser && expectedUid && currentUser.uid === expectedUid;

            if (isMatch) {
                setUser(currentUser);
                const name = localUser.fullName || localUser.name || currentUser.displayName || 'User';
                setUserName(name);
                setUserPhoto(localUser.photoURL || currentUser.photoURL || null);
                setProfileData({
                    fullName: name,
                    email: localUser.email || currentUser.email || '',
                    phone: localUser.phone || localUser.phoneNumber || ''
                });

                try {
                    // Fetch all dashboard data
                    await Promise.all([
                        fetchOrders(currentUser.uid),
                        fetchAddresses(currentUser.uid),
                        fetchReviewableOrders(currentUser.uid)
                    ]);

                    const profileRes = await authFetch(`/consumer/${currentUser.uid}/profile`);

                    if (profileRes && profileRes.ok) {
                        const profileDataJson = await profileRes.json();
                        if (profileDataJson.success) {
                            const p = profileDataJson.profile;
                            const name = p.fullName || 'User';
                            setUserName(name);
                            setUserPhoto(p.photoURL);
                            setProfileData({
                                fullName: p.fullName || '',
                                email: p.email || '',
                                phone: p.phone || ''
                            });
                            
                            // Sync with Navbar and LocalStorage — SAFELY because we matched UIDs
                            localStorage.setItem('userName', name);
                            const currentLocalUser = JSON.parse(localStorage.getItem('user') || '{}');
                            currentLocalUser.fullName = name;
                            currentLocalUser.photoURL = p.photoURL;
                            localStorage.setItem('user', JSON.stringify(currentLocalUser));
                            window.dispatchEvent(new CustomEvent('userDataChanged'));
                        }
                    } else {
                        // Fallback to local user data if profile fetch fails
                        const currentLocalUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const name = currentLocalUser.fullName || currentLocalUser.name || currentUser.displayName || 'User';
                        setUserName(name);
                        setUserPhoto(currentLocalUser.photoURL || currentUser.photoURL || null);
                        setProfileData({
                            fullName: name,
                            email: currentLocalUser.email || currentUser.email || '',
                            phone: currentLocalUser.phone || currentLocalUser.phoneNumber || ''
                        });
                    }
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                }

                wishlistUnsubscribe = listenToWishlist((items) => { if (mounted) setWishlist(items); });
                cartUnsubscribe = listenToCart((items) => { if (mounted) setCart(items); });
                if (mounted) setLoading(false);
            } else if (localUser && localUser.uid) {
                // User is logged in via test mode OR Firebase auth doesn't match this tab's session
                // We use the local session data instead of the active Firebase user
                setUser({ uid: localUser.uid, displayName: localUser.fullName || localUser.name || 'User' });
                const name = localUser.fullName || localUser.name || 'User';
                setUserName(name);
                setUserPhoto(localUser.photoURL || null);
                setProfileData({
                    fullName: name,
                    email: localUser.email || '',
                    phone: localUser.phone || localUser.phoneNumber || ''
                });
                try {
                    await Promise.all([
                        fetchOrders(localUser.uid),
                        fetchAddresses(localUser.uid),
                        fetchReviewableOrders(localUser.uid)
                    ]);
                } catch (err) { console.error('Error loading dashboard data:', err); }
                wishlistUnsubscribe = listenToWishlist((items) => { if (mounted) setWishlist(items); });
                cartUnsubscribe = listenToCart((items) => { if (mounted) setCart(items); });
                if (mounted) setLoading(false);
            } else {
                navigate('/');
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
            if (wishlistUnsubscribe) wishlistUnsubscribe();
            if (cartUnsubscribe) cartUnsubscribe();
        };
    }, [navigate]);

    const fetchOrders = async (userId) => {
        try {
            const response = await authFetch(`/orders/user/${userId}`);
            if (!response.ok) throw new Error('Orders API failed');
            const data = await response.json();
            const ordersData = data.success ? (data.orders || []) : [];
            setOrders(ordersData);
            const total = ordersData.length;
            const pending = ordersData.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
            const delivered = ordersData.filter(o => o.status === 'Delivered').length;
            const totalSpent = ordersData.reduce((sum, o) => sum + (o.total || 0), 0);
            setStats({ total, pending, delivered, totalSpent });
            if (ordersData.length > 0) setSelectedOrder(ordersData[0]);
        } catch (error) { console.error('Error fetching orders:', error); }
    };

    const fetchReviewableOrders = async (userId) => {
        try {
            const response = await authFetch(`/orders/user/${userId}/reviewable-orders`);
            const data = await response.json();
            if (data.success) setReviewableOrders(data.orders || []);
        } catch (error) { console.error('Error fetching reviewable orders:', error); setReviewableOrders([]); }
    };

    const fetchAddresses = async (userId) => {
        try {
            const response = await authFetch(`/consumer/${userId}/addresses`);
            if (!response.ok) throw new Error('Addresses API failed');
            const data = await response.json();
            setAddresses(data.success ? (data.addresses || []) : []);
        } catch (error) { console.error('Error fetching addresses:', error); setAddresses([]); }
    };

    const removeFromWishlist = async (productId) => {
        const result = await removeFromWishlistAPI(productId);
        if (!result.success) alert(result.message || 'Failed to remove from wishlist');
    };

    const saveAddress = async () => {
        try {
            const addressToSave = editingAddress;
            
            // Validate required fields
            if (!addressToSave.firstName || !addressToSave.lastName || !addressToSave.addressLine || 
                !addressToSave.city || !addressToSave.state || !addressToSave.pincode || !addressToSave.phone) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Validate pincode
            if (addressToSave.pincode.length !== 6) {
                alert('Pincode must be 6 digits');
                return;
            }
            
            const response = await authFetch(`/consumer/${user.uid}/address`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressToSave })
            });
            const data = await response.json();
            if (data.success) {
                // Update local state immediately with returned addresses
                if (data.addresses) {
                    setAddresses(data.addresses);
                } else {
                    await fetchAddresses(user.uid);
                }
                setEditingAddress(null);
                // Address saved - list updates automatically, no alert needed
            } else {
                alert(data.message || 'Failed to save address');
            }
        } catch (error) { 
            console.error('Error saving address:', error);
            alert('Failed to save address. Please try again.');
        }
    };

    const setAsDefaultAddress = async (addressIndex) => {
        try {
            const addressToUpdate = { ...addresses[addressIndex], isDefault: true };
            const response = await authFetch(`/consumer/${user.uid}/address`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressToUpdate })
            });
            const data = await response.json();
            if (data.success) {
                // Update local state immediately with returned addresses
                if (data.addresses) {
                    setAddresses(data.addresses);
                } else {
                    await fetchAddresses(user.uid);
                }
                alert('Default address updated successfully');
            } else {
                alert(data.message || 'Failed to set default address');
            }
        } catch (error) { 
            console.error('Error setting default address:', error);
            alert('Failed to set default address. Please try again.');
        }
    };

    const deleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            const response = await authFetch(`/consumer/${user.uid}/address/${addressId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                // Update local state immediately with returned addresses
                if (data.addresses) {
                    setAddresses(data.addresses);
                } else {
                    await fetchAddresses(user.uid);
                }
                alert('Address deleted successfully');
            } else {
                alert(data.message || 'Failed to delete address');
            }
        } catch (error) { 
            console.error('Error deleting address:', error);
            alert('Failed to delete address. Please try again.');
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const response = await authFetch(`/orders/invoice/${orderId}?regenerate=true`);
            if (!response.ok) throw new Error('Failed to download invoice');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (error) { console.error('Error downloading invoice:', error); alert('Could not download invoice. Please try again later.'); }
    };

    useEffect(() => {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        setRecentlyViewed(viewed.slice(0, 5));
        if (orders.length > 0) fetchRecommendedProducts();
    }, [orders]);

    const fetchRecommendedProducts = async () => {
        try {
            const orderCategories = orders.flatMap(order => order.items || []).map(item => item.category).filter(Boolean);
            if (orderCategories.length === 0) return;
            const products = await fetchWithCache(
                `recommended_${user.uid}`,
                async () => {
                    const { collection, query, limit, getDocs } = await import('firebase/firestore');
                    const { db } = await import('@/modules/shared/config/firebase');
                    const productsRef = collection(db, 'products');
                    const q = query(productsRef, limit(20));
                    const snapshot = await getDocs(q);
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => orderCategories.includes(p.category)).slice(0, 5);
                },
                10 * 60 * 1000
            );
            setRecommendedProducts(products);
        } catch (error) { console.error('Error fetching recommended products:', error); }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await authFetch('/auth/upload-image', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success && data.url) {
                await authFetch(`/consumer/${user.uid}/profile`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileData: { photoURL: data.url } })
                });
                setUserPhoto(data.url);
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localUser.photoURL = data.url;
                localStorage.setItem('user', JSON.stringify(localUser));
                alert('Profile picture updated successfully!');
            } else { alert('Upload failed: ' + (data.message || 'Unknown error')); }
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            const reader = new FileReader();
            reader.onloadend = () => { setUserPhoto(reader.result); };
            reader.readAsDataURL(file);
        } finally { setUploadingImage(false); }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSavingProfile(true);
        try {
            const response = await authFetch(`/consumer/${user.uid}/profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileData: { fullName: profileData.fullName, phone: profileData.phone } })
            });
            const data = await response.json();
            if (data.success) {
                setUserName(profileData.fullName);
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localUser.fullName = profileData.fullName;
                localUser.phone = profileData.phone;
                localStorage.setItem('user', JSON.stringify(localUser));
                localStorage.setItem('userName', profileData.fullName);
                window.dispatchEvent(new CustomEvent('userDataChanged'));
                setEditingProfile(false);
                alert('Profile updated successfully!');
            } else { alert('Failed to update profile: ' + (data.message || 'Unknown error')); }
        } catch (error) { console.error('Error updating profile:', error); alert('Failed to update profile. Please try again.'); }
        finally { setSavingProfile(false); }
    };

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const cancellationReasons = [
        'Changed my mind',
        'Found a better price elsewhere',
        'Ordered by mistake',
        'Delivery time is too long',
        'Product no longer needed',
        'Want to change shipping address',
        'Want to modify order items',
        'Other'
    ];

    const handleCancelOrder = async (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        setOrderToCancel(order);
        setShowCancelModal(true);
    };

    const confirmCancelOrder = async () => {
        if (!orderToCancel) return;

        // Validate reason selection
        if (!cancellationReason) {
            alert('Please select a reason for cancellation');
            return;
        }

        if (cancellationReason === 'Other' && !customReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        const finalReason = cancellationReason === 'Other' ? customReason : cancellationReason;

        setCancelling(true);
        try {
            const url = `/orders/${orderToCancel.id}/cancel`;
            const response = await authFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancellationReason: finalReason })
            });
            
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[CANCEL] Failed to parse JSON:', e);
                throw new Error(`Invalid server response: ${text.substring(0, 100)}`);
            }

            if (data.success) {
                // Show refund information
                const refundInfo = data.refundInfo || data.data?.refundInfo;
                if (refundInfo) {
                    alert(
                        `Order cancelled successfully!\n\n` +
                        `${refundInfo.message}\n\n` +
                        (refundInfo.refundAmount > 0 ? 
                            `Refund Amount: ₹${refundInfo.refundAmount}\n` +
                            `Refund Method: ${refundInfo.refundMethod}\n` +
                            `Processing Time: ${refundInfo.processingTime}` 
                            : '')
                    );
                } else {
                    alert('Order cancelled successfully!');
                }
                
                // Reset modal state
                setShowCancelModal(false);
                setOrderToCancel(null);
                setCancellationReason('');
                setCustomReason('');
                
                // Refresh orders
                await fetchOrders(user.uid);
            } else {
                alert(data.message || 'Failed to cancel order');
            }
        } catch (error) {
            console.error('[CANCEL] Error caught:', error);
            alert(`Failed to cancel order. Please try again. (${error.message})`);
        } finally {
            setCancelling(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone. All your data including orders, wishlist, and addresses will be permanently deleted.')) return;
        if (!window.confirm('This is your final warning. Are you absolutely sure you want to delete your account?')) return;
        try {
            const response = await authFetch(`/consumer/${user.uid}/account`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                await auth.signOut();
                localStorage.clear();
                alert('Your account has been deleted successfully.');
                navigate('/');
            } else { alert('Failed to delete account: ' + (data.message || 'Unknown error')); }
        } catch (error) { console.error('Error deleting account:', error); alert('Failed to delete account. Please contact support.'); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            {/* Main Content */}
            <div className="max-w-full mx-auto px-3 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ alignItems: 'start' }}>
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto" style={{ position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)' }}>
                            {/* User Profile */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-50 border-b border-gray-200">
                                <div className="flex flex-col items-center text-center">
                                    {userPhoto ? (
                                        <div className="w-16 h-16 rounded-full mb-2 overflow-hidden border-2 border-primary">
                                            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
                                            {(userName || user.email || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-600 mb-1">Hello,</p>
                                    <p className="font-semibold text-gray-900 text-sm">{userName || 'User'}</p>
                                    {(() => {
                                        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                                        const firebaseUser = JSON.parse(localStorage.getItem('firebaseUser') || '{}');
                                        const dob = localUser.dateOfBirth || firebaseUser.dateOfBirth;
                                        const age = calculateAge(dob);
                                        return age ? <p className="text-xs text-gray-500 mt-1">Age: {age}</p> : null;
                                    })()}
                                    <div className="flex items-center gap-1 mt-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="p-2">
                                {[
                                    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, badge: null },
                                    { key: 'orders', label: 'My Orders', icon: <ShoppingBag size={18} />, badge: orders.length },
                                    { key: 'cart', label: 'Cart', icon: <ShoppingCart size={18} />, badge: cart.length },
                                    { key: 'wishlist', label: 'Wishlist', icon: <Heart size={18} />, badge: wishlist.length },
                                    { key: 'address', label: 'Address Book', icon: <MapPin size={18} />, badge: null },
                                    { key: 'reviews', label: 'My Reviews', icon: <Star size={18} />, badge: reviewableOrders.length > 0 ? reviewableOrders.length : null, badgeColor: 'bg-orange-100 text-orange-700' },
                                    { key: 'settings', label: 'Account Settings', icon: <Settings size={18} />, badge: null },
                                ].map(item => (
                                    <button key={item.key} onClick={() => setActiveTab(item.key)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === item.key ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'
                                        }`}>
                                        <div className="flex items-center gap-3">{item.icon}<span>{item.label}</span></div>
                                        {item.badge != null && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-600'}`}>{item.badge}</span>
                                        )}
                                    </button>
                                ))}

                                <div className="border-t border-gray-200 my-2"></div>
                                <button onClick={async () => {
                                    try { await auth.signOut(); } catch (e) { console.error(e); }
                                    localStorage.removeItem('user');
                                    localStorage.removeItem('userName');
                                    localStorage.removeItem('dob');
                                    window.dispatchEvent(new CustomEvent('userDataChanged'));
                                    navigate('/');
                                }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                    <LogOut size={18} /><span>Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-4">
                        {activeTab === 'dashboard' && (
                            <ConsumerOverviewTab
                                stats={stats} orders={orders}
                                selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                                recentlyViewed={recentlyViewed} recommendedProducts={recommendedProducts}
                                onSwitchTab={setActiveTab}
                                onCancelOrder={handleCancelOrder}
                            />
                        )}
                        {activeTab === 'orders' && (
                            <ConsumerOrdersTab
                                orders={orders}
                                onSelectOrder={(order) => { setSelectedOrder(order); setActiveTab('dashboard'); }}
                                onCancelOrder={handleCancelOrder}
                            />
                        )}
                        {activeTab === 'cart' && (
                            <ConsumerCartTab 
                                cart={cart}
                                onCartUpdate={() => window.dispatchEvent(new Event('cartUpdate'))}
                            />
                        )}
                        {activeTab === 'wishlist' && (
                            <ConsumerWishlistTab 
                                wishlist={wishlist} 
                                onRemoveFromWishlist={removeFromWishlist}
                            />
                        )}
                        {activeTab === 'address' && (
                            <ConsumerAddressTab
                                addresses={addresses} editingAddress={editingAddress}
                                setEditingAddress={setEditingAddress} onSaveAddress={saveAddress}
                                onDeleteAddress={deleteAddress} onSetDefault={setAsDefaultAddress}
                            />
                        )}
                        {activeTab === 'reviews' && (
                            <ConsumerReviewsTab
                                reviewableOrders={reviewableOrders}
                                onWriteReview={(item) => {
                                    setSelectedReviewProduct({ productId: item.productId, productName: item.productName, orderId: item.orderId });
                                    setShowReviewModal(true);
                                }}
                            />
                        )}
                        {activeTab === 'settings' && (
                            <ConsumerSettingsTab
                                user={user} userName={userName}
                                profileData={profileData} setProfileData={setProfileData}
                                editingProfile={editingProfile} setEditingProfile={setEditingProfile}
                                savingProfile={savingProfile} onSaveProfile={handleSaveProfile}
                                uploadingImage={uploadingImage} onProfilePictureUpload={handleProfilePictureUpload}
                                onDeleteAccount={handleDeleteAccount}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedReviewProduct && (
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedReviewProduct(null);
                        if (user) fetchReviewableOrders(user.uid);
                    }}
                    productId={selectedReviewProduct.productId}
                    productName={selectedReviewProduct.productName}
                    orderId={selectedReviewProduct.orderId}
                />
            )}

            {/* Cancel Order Modal */}
            {showCancelModal && orderToCancel && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => !cancelling && setShowCancelModal(false)}
                >
                    <div
                        className="glass-card"
                        style={{
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '2rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <XCircle size={24} style={{ color: '#ef4444' }} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Cancel Order</h3>
                                <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                                    Order #{orderToCancel.orderId || orderToCancel.id}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                Please select a reason for cancellation:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {cancellationReasons.map((reason) => (
                                    <label
                                        key={reason}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: cancellationReason === reason ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface)',
                                            border: `2px solid ${cancellationReason === reason ? '#3b82f6' : 'var(--border)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="cancellationReason"
                                            value={reason}
                                            checked={cancellationReason === reason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>{reason}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {cancellationReason === 'Other' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                    Please specify your reason:
                                </label>
                                <textarea
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Enter your reason for cancellation..."
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '0.75rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        background: 'var(--surface)',
                                        color: 'var(--text)',
                                        fontSize: '0.9rem',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444', lineHeight: '1.5' }}>
                                <strong>Note:</strong> Once cancelled, this action cannot be undone. 
                                {orderToCancel.paymentMethod !== 'COD' && ' Refund will be processed within 5-7 business days.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setOrderToCancel(null);
                                    setCancellationReason('');
                                    setCustomReason('');
                                }}
                                disabled={cancelling}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                disabled={cancelling || !cancellationReason}
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: '#ef4444',
                                    color: 'white',
                                    opacity: cancelling || !cancellationReason ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {cancelling ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel Order'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

