'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');

const CONSUMER_CACHE_TTL = 120; // 2 minutes in seconds

/**
 * Get user cart.
 */
const getCart = async (req, res) => {
    try {
        const { uid } = req.params;
        const cacheKey = `cart_${uid}`;
        const cached = cache.get(cacheKey);
        if (cached !== null) return res.json({ success: true, cart: cached });

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ success: false, message: "User not found" });
        const cart = userDoc.data().cart || [];
        cache.set(cacheKey, cart, CONSUMER_CACHE_TTL);
        return res.json({ success: true, cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch cart" });
    }
};

/**
 * Update user cart.
 */
const updateCart = async (req, res) => {
    try {
        const { uid } = req.params;
        const { cart, action, item, itemId } = req.body;

        const userRef = db.collection('users').doc(uid);

        if (cart) {
            // Overwrite entire cart
            await userRef.update({ cart });
            cache.invalidate(`cart_${uid}`);
        } else if (action) {
            const userDoc = await userRef.get();
            let currentCart = userDoc.data()?.cart || [];

            if (action === 'add' && item) {
                const existingIdx = currentCart.findIndex(i => i.id === item.id);
                if (existingIdx > -1) {
                    currentCart[existingIdx].quantity += (item.quantity || 1);
                } else {
                    currentCart.push(item);
                }
            } else if (action === 'remove' && itemId) {
                currentCart = currentCart.filter(i => i.id !== itemId);
            } else if (action === 'clear') {
                currentCart = [];
            }

            await userRef.update({ cart: currentCart });
            cache.invalidate(`cart_${uid}`);
        }

        return res.json({ success: true, message: "Cart updated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update cart" });
    }
};

/**
 * Get user addresses.
 */
const getAddresses = async (req, res) => {
    try {
        const { uid } = req.params;
        const cacheKey = `addresses_${uid}`;
        const cached = cache.get(cacheKey);
        if (cached !== null) return res.json({ success: true, addresses: cached });

        const doc = await db.collection('users').doc(uid).get();
        const addresses = doc.data()?.addresses || [];
        cache.set(cacheKey, addresses, CONSUMER_CACHE_TTL);
        return res.json({ success: true, addresses });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
    }
};

/**
 * Save/Update user address.
 */
const saveAddress = async (req, res) => {
    try {
        const { uid } = req.params;
        const { address } = req.body;
        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();
        let addresses = doc.data()?.addresses || [];

        // Ensure address has required fields
        if (!address.firstName || !address.lastName || !address.addressLine || !address.city || !address.state || !address.pincode) {
            return res.status(400).json({ success: false, message: "Missing required address fields" });
        }

        // Set address type (shipping or billing, default to shipping)
        if (!address.type) {
            address.type = 'shipping';
        }

        // If setting as default, remove default flag from other addresses of same type
        if (address.isDefault) {
            addresses = addresses.map(a => {
                if (a.type === address.type) {
                    return { ...a, isDefault: false };
                }
                return a;
            });
        }

        // Check if this is an update (has id) or new address
        if (address.id !== undefined && address.id !== null) {
            // Update existing address
            const existingIdx = addresses.findIndex(a => String(a.id) === String(address.id));
            if (existingIdx > -1) {
                addresses[existingIdx] = { ...address };
            } else {
                // ID not found, add as new
                addresses.push({ ...address, id: Date.now().toString() });
            }
        } else {
            // New address - generate ID
            addresses.push({ ...address, id: Date.now().toString() });
        }

        await userRef.update({ addresses });
        cache.invalidate(`addresses_${uid}`);
        return res.json({ success: true, message: "Address saved", addresses });
    } catch (error) {
        console.error('Error saving address:', error);
        return res.status(500).json({ success: false, message: "Failed to save address" });
    }
};

/**
 * Get user wishlist.
 */
const getWishlist = async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.collection("users").doc(uid).collection("wishlist").get();
        
        if (snapshot.empty) {
            return res.status(200).json({ success: true, items: [] });
        }

        const items = [];
        const productIds = snapshot.docs.map(doc => doc.id);
        
        // Batch fetch all products in chunks of 10 (Firestore limit for 'in' queries)
        const chunkSize = 10;
        const productDataMap = new Map();
        
        for (let i = 0; i < productIds.length; i += chunkSize) {
            const chunk = productIds.slice(i, i + chunkSize);
            const productsSnapshot = await db.collection("products")
                .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
                .get();
            
            productsSnapshot.docs.forEach(doc => {
                productDataMap.set(doc.id, doc.data());
            });
        }
        
        // Merge wishlist items with fresh product data
        for (const doc of snapshot.docs) {
            const wishlistItem = doc.data();
            const productData = productDataMap.get(doc.id);
            
            if (productData) {
                // Skip admin-removed products
                if (productData.adminRemoved) continue;
                
                // Merge with fresh product data
                items.push({
                    id: doc.id,
                    ...wishlistItem,
                    // Update with fresh pricing data
                    price: productData.price || wishlistItem.price,
                    discountPrice: productData.discountPrice !== undefined ? productData.discountPrice : wishlistItem.discountPrice,
                    oldPrice: productData.oldPrice || wishlistItem.oldPrice,
                    pricingType: productData.pricingType || wishlistItem.pricingType || 'uniform',
                    sizePrices: productData.sizePrices || wishlistItem.sizePrices,
                    gstPercent: productData.gstPercent || wishlistItem.gstPercent || 18,
                    rating: productData.rating !== undefined ? productData.rating : 0,
                    reviewCount: productData.reviewCount || 0,
                    stock: productData.stock,
                    status: productData.status,
                    discount: productData.discount || wishlistItem.discount
                });
            } else {
                // Product no longer exists, keep wishlist item as is
                items.push({ id: doc.id, ...wishlistItem });
            }
        }
        
        return res.status(200).json({ success: true, items });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch wishlist", items: [] });
    }
};

/**
 * Add to user wishlist.
 */
const addToWishlist = async (req, res) => {
    try {
        const { uid } = req.params;
        const { product } = req.body;

        if (!product || !product.id) {
            return res.status(400).json({ success: false, message: "Invalid product data" });
        }

        await db.collection("users").doc(uid).collection("wishlist").doc(product.id).set(product);
        return res.status(200).json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to add to wishlist" });
    }
};

/**
 * Remove from user wishlist.
 */
const removeFromWishlist = async (req, res) => {
    try {
        const { uid, productId } = req.params;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        await db.collection("users").doc(uid).collection("wishlist").doc(productId).delete();
        return res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to remove from wishlist" });
    }
};

/**
 * Delete user address.
 */
const deleteAddress = async (req, res) => {
    try {
        const { uid, addressId } = req.params;
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        let addresses = doc.data()?.addresses || [];

        // Filter out the address by id (string or number comparison)
        addresses = addresses.filter(a => {
            // Compare both as strings and numbers to handle different ID formats
            return String(a.id) !== String(addressId) && a.id !== Number(addressId) && a.id !== addressId;
        });
        
        await userRef.update({ addresses });
        cache.invalidate(`addresses_${uid}`);
        return res.json({ success: true, message: "Address deleted", addresses });
    } catch (error) {
        console.error('Error deleting address:', error);
        return res.status(500).json({ success: false, message: "Failed to delete address" });
    }
};

/**
 * Get user profile.
 */
const getProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ success: false, message: "User not found" });
        
        const userData = userDoc.data();
        return res.json({ 
            success: true, 
            profile: {
                uid: userData.uid,
                fullName: userData.fullName || userData.displayName || userData.name || userData.extractedName || "User",
                email: userData.email || "",
                phone: userData.phone || userData.phoneNumber || "",
                photoURL: userData.photoURL || userData.profilePhoto || null,
                role: userData.role,
                dateOfBirth: userData.dateOfBirth || null
            }
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};

/**
 * Update user profile.
 */
const updateProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const { profileData } = req.body;
        
        if (!profileData) return res.status(400).json({ success: false, message: "Profile data is required" });

        const updateData = {};
        if (profileData.fullName !== undefined) updateData.fullName = profileData.fullName;
        if (profileData.displayName !== undefined) updateData.fullName = profileData.displayName; // Fallback
        if (profileData.phone !== undefined) updateData.phone = profileData.phone;
        if (profileData.photoURL !== undefined) updateData.photoURL = profileData.photoURL;

        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(uid).update(updateData);
        }

        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

/**
 * Delete consumer account data.
 */
const deleteAccount = async (req, res) => {
    try {
        const { uid } = req.params;
        
        // Delete user's Firestore data
        await db.collection('users').doc(uid).delete();
        
        // Also clear any cached carts/addresses
        cache.invalidate(`cart_${uid}`);
        cache.invalidate(`addresses_${uid}`);

        return res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ success: false, message: "Failed to delete account" });
    }
};

module.exports = {
    getCart,
    updateCart,
    getAddresses,
    saveAddress,
    deleteAddress,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getProfile,
    updateProfile,
    deleteAccount
};
