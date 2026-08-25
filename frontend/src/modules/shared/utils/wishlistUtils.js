import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from './api';

// Helper to get current user UID (supports Firebase and Test Login)
// Helper to get current user UID (syncs with Navbar state and prevents ghost sessions)
const getUID = () => {
    const localUserStr = localStorage.getItem('user');
    if (!localUserStr) {
        if (auth.currentUser) {
            auth.signOut().catch(console.error);
        }
        return null;
    }

    try {
        const localUser = JSON.parse(localUserStr);
        return auth.currentUser?.uid || localUser.uid;
    } catch (e) {
        return null;
    }
};

// Get wishlist items (one-time fetch)
export const getWishlist = async () => {
    try {
        const uid = getUID();
        if (!uid) {
            return { success: true, items: [] };
        }

        const response = await authFetch(`/consumer/${uid}/wishlist`);
        const data = await response.json();

        if (data.success) {
            return { success: true, items: data.items || [] };
        }
        return { success: false, items: [] };
    } catch (error) {
        console.error('getWishlist error:', error);
        return { success: false, items: [] };
    }
};

// Add to wishlist
export const addToWishlist = async (product) => {
    try {
        const uid = getUID();
        
        let localUser = null;
        try { localUser = JSON.parse(localStorage.getItem('user')); } catch(e){}

        if (localUser && (localUser.role === 'SELLER' || localUser.role === 'ADMIN')) {
            alert("Sellers and Admins cannot use the wishlist. Please create a user account to shop.");
            return { success: false, message: "Sellers cannot purchase products.", triggerLogin: true };
        }

        const productToAdd = {
            id: product.id,
            name: product.name,
            // Store complete pricing structure for PriceDisplay
            price: Number(product.price),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
            oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
            pricingType: product.pricingType || 'uniform',
            sizePrices: product.sizePrices || null,
            gstPercent: product.gstPercent || 18,
            image: product.image || product.imageUrl || (product.images && product.images[0]),
            category: product.category || 'Uncategorized',
            description: product.description || '',
            rating: product.rating || 4.5,
            reviews: product.reviews || 0,
            discount: product.discount || null,
            addedAt: Date.now()
        };

        if (!uid) {
            window.dispatchEvent(new Event('openLoginModal'));
            return { success: false, message: 'Login required', triggerLogin: true };
        } else {
            // Logged in: Backend API
            const response = await authFetch(`/consumer/${uid}/wishlist/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: productToAdd })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to add to backend');
        }

        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
        // Trigger notification with product name
        window.dispatchEvent(new CustomEvent('wishlistItemAdded', { 
            detail: { productName: product.name || product.title || 'Product' }
        }));
        return { success: true, message: 'Added to wishlist' };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return { success: false, message: error.message || 'Failed to add' };
    }
};

// Remove from wishlist
export const removeFromWishlist = async (productId) => {
    try {
        const uid = getUID();
        if (!uid) {
            return { success: false };
        } else {
            // Logged in: Backend API
            const response = await authFetch(`/consumer/${uid}/wishlist/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to remove from backend');
        }

        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
        return { success: true, message: 'Removed' };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return { success: false, message: error.message || 'Failed to remove' };
    }
};

// Check if item is in wishlist
export const isInWishlist = async (productId) => {
    try {
        const result = await getWishlist();
        if (result.success) {
            return result.items.some(item => item.id === productId);
        }
        return false;
    } catch (error) {
        console.error('Error checking wishlist:', error);
        return false;
    }
};

// Listen to wishlist changes
export const listenToWishlist = (callback) => {
    const handleUpdate = async () => {
        const result = await getWishlist();
        if (result.success) {
            callback(result.items);
        } else {
            callback([]);
        }
    };

    // Initial load
    handleUpdate();

    // Listen for explicit updates only (no auth.onAuthStateChanged — that fires on every page load
    // and causes a fresh Firestore/API read even when the wishlist hasn't changed)
    window.addEventListener('wishlistUpdated', handleUpdate);
    window.addEventListener('userDataChanged', handleUpdate);

    return () => {
        window.removeEventListener('wishlistUpdated', handleUpdate);
        window.removeEventListener('userDataChanged', handleUpdate);
    };
};
