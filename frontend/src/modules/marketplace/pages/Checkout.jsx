import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ShoppingBag,
    Trash2,
    ShoppingCart,
    Shield,
    Package,
    TrendingUp,
    Plus,
    Minus,
    Tag,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { listenToCart, removeFromCart, updateCartItemQuantity } from '@/modules/shared/utils/cartUtils';
import { getProductPricingWithGST } from '@/modules/shared/utils/priceUtils';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';
import { validateGST, cleanGST, getGSTError } from '@/modules/shared/utils/gstValidation';
import { calculateOrderTotalsWithGSTInclusive } from '@/modules/shared/utils/platformFeeUtils';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import ConfirmationAnimation from '@/modules/shared/components/common/ConfirmationAnimation';
import AddressStep from '../components/Checkout/AddressStep';
import PaymentStep from '../components/Checkout/PaymentStep';
import CheckoutOrderSummary from '../components/Checkout/CheckoutOrderSummary';
import CheckoutSuccess from '../components/Checkout/CheckoutSuccess';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [cartItems, setCartItems] = useState([]);
    const [checkoutItems, setCheckoutItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set()); // Add item selection state
    const [showAllItems, setShowAllItems] = useState(false); // Add show more state
    const [loading, setLoading] = useState(true);
    const [shippingAddress, setShippingAddress] = useState({
        firstName: '',
        lastName: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        type: 'shipping'
    });
    const [billingAddress, setBillingAddress] = useState({
        firstName: '',
        lastName: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        type: 'billing'
    });
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: ''
    });
    const [upiId, setUpiId] = useState('');
    const [isUpiVerified, setIsUpiVerified] = useState(false);
    const [errors, setErrors] = useState({});
    const [isOrdered, setIsOrdered] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [user, setUser] = useState(null);
    const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
    const [setAsDefault, setSetAsDefault] = useState(false);
    const [fetchingSavedAddress, setFetchingSavedAddress] = useState(false);
    const [razorpayLoading, setRazorpayLoading] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);
    const [sameAsBilling, setSameAsBilling] = useState(true); // Billing address checkbox
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [validationError, setValidationError] = useState(''); // Add inline validation error
    
    // GST Number states
    const [hasGST, setHasGST] = useState(false);
    const [gstNumber, setGstNumber] = useState('');
    const [businessName, setBusinessName] = useState(''); // Add business name state
    const [gstError, setGstError] = useState('');
    
    const [adminConfig, setAdminConfig] = useState({
        platformFeeBreakdown: {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        },
        platformFeeCapRanges: [],
        defaultPlatformFeePercent: 3.5,
        defaultGstPercent: 18,
        defaultShippingHandlingPercent: 0
    });
    
    // Shipping estimation states
    const [shippingFee, setShippingFee] = useState(0);
    const [estimatingShipping, setEstimatingShipping] = useState(false);
    const [shippingEstimated, setShippingEstimated] = useState(false);
    const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');

    // Address selection states
    const [addressMode, setAddressMode] = useState('saved');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
    
    // Billing address states
    const [billingAddressMode, setBillingAddressMode] = useState('saved');
    const [selectedBillingAddressIndex, setSelectedBillingAddressIndex] = useState(null);
    const [saveBillingForFuture, setSaveBillingForFuture] = useState(false);
    const [setBillingAsDefault, setSetBillingAsDefault] = useState(false);
    
    // Computed: Filter saved addresses by type (include addresses without type for backward compatibility)
    const savedBillingAddresses = savedAddresses.filter(addr => !addr.type || addr.type === 'billing' || addr.type === 'both');

    // Fetch admin config for default charges
    useEffect(() => {
        const fetchAdminConfig = async () => {
            try {
                const API_BASE = import.meta.env.PROD
                    ? (import.meta.env.VITE_API_BASE_URL || 'https://sellsathi-refactored.onrender.com')
                    : 'http://localhost:5000';
                const response = await fetch(`${API_BASE}/admin/config/public`);
                const data = await response.json();
                if (data.success && data.config) {
                    setAdminConfig({
                        platformFeeBreakdown: data.config.platformFeeBreakdown || {
                            digitalSecurityFee: 1.2,
                            merchantVerification: 1.0,
                            transitCare: 0.8,
                            platformMaintenance: 0.5,
                            qualityHandling: 0.0
                        },
                        platformFeeCapRanges: data.config.platformFeeCapRanges || [],
                        defaultPlatformFeePercent: data.config.defaultPlatformFeePercent ?? 3.5,
                        defaultGstPercent: data.config.defaultGstPercent ?? 18,
                        defaultShippingHandlingPercent: data.config.defaultShippingHandlingPercent ?? 0
                    });
                }
            } catch (error) {
                console.error('Failed to fetch admin config:', error);
                // Keep default values
            }
        };
        fetchAdminConfig();
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            setUser(u);
            if (u) {
                setFetchingSavedAddress(true);
                try {
                    const res = await authFetch(`/consumer/${u.uid}/addresses`);
                    const data = await res.json();
                    const addresses = data.success ? (data.addresses || []) : [];
                    setSavedAddresses(addresses);

                    // Find default shipping address
                    const defaultShipping = addresses.find(addr => addr.type === 'shipping' && addr.isDefault === true);
                    // Find default billing address
                    const defaultBilling = addresses.find(addr => addr.type === 'billing' && addr.isDefault === true);
                    
                    // Set shipping address - DON'T auto-select, let user choose from dropdown
                    if (addresses.length > 0) {
                        setAddressMode('saved');
                        // Don't auto-select - leave selectedAddressIndex as null
                        // User must select from dropdown
                    } else {
                        setAddressMode('new');
                    }
                    
                    // Set billing address
                    if (defaultBilling) {
                        setBillingAddress(defaultBilling);
                    } else if (sameAsBilling && defaultShipping) {
                        // If same as billing is checked, copy shipping to billing
                        setBillingAddress({ ...defaultShipping, type: 'billing' });
                    }
                } catch (error) {
                    console.error("Error fetching addresses:", error);
                    setAddressMode('new');
                } finally {
                    setFetchingSavedAddress(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const { buyNowProduct, selectedItemIds } = location.state || {};
        
        // If Buy Now product is provided, use it directly without cart
        if (buyNowProduct) {
            const { finalPrice, strikethroughPrice, gstPercent, basePrice } = getProductPricingWithGST(buyNowProduct, buyNowProduct.selections || {});
            
            const buyNowCartItem = {
                id: `buynow_${buyNowProduct.id}_${Date.now()}`,
                productId: buyNowProduct.id,
                sellerId: buyNowProduct.sellerId || null,
                name: buyNowProduct.name || buyNowProduct.title,
                // Store BOTH base price and product pricing fields for consistency
                price: buyNowProduct.price, // Original product price field (for PriceDisplay)
                discountPrice: buyNowProduct.discountPrice, // Original discount price (for PriceDisplay)
                oldPrice: buyNowProduct.oldPrice, // Original old price (for PriceDisplay)
                pricingType: buyNowProduct.pricingType, // Pricing type (uniform/varied)
                sizePrices: buyNowProduct.sizePrices, // Size-specific prices
                basePrice: basePrice, // Base price for backend calculations
                priceWithGST: finalPrice, // GST-inclusive price for display
                originalPrice: strikethroughPrice,
                gstPercent: gstPercent,
                imageUrl: buyNowProduct.imageUrl || buyNowProduct.image,
                quantity: buyNowProduct.quantity || 1,
                category: buyNowProduct.category,
                selections: buyNowProduct.selections,
                selectedColor: buyNowProduct.selections?.color,
                selectedSize: buyNowProduct.selections?.size,
                selectedStorage: buyNowProduct.selections?.storage?.label || buyNowProduct.selections?.storage,
                selectedMemory: buyNowProduct.selections?.memory?.label || buyNowProduct.selections?.memory,
                isBuyNow: true
            };
            
            setCheckoutItems([buyNowCartItem]);
            setSelectedItems(new Set([buyNowCartItem.id]));
            setCartItems([]);
            setLoading(false);
            return;
        }
        
        // Otherwise, listen to cart for normal checkout
        const unsubscribe = listenToCart((items) => {
            setCartItems(items);
            const { buyNowProduct, selectedItemIds } = location.state || {};
            
            if (buyNowProduct) {
                // Buy Now flow: Create temporary cart item for Buy Now product
                const { finalPrice, strikethroughPrice, gstPercent, basePrice } = getProductPricingWithGST(buyNowProduct, buyNowProduct.selections || {});
                
                const buyNowCartItem = {
                    id: `buynow_${buyNowProduct.id}_${Date.now()}`,
                    productId: buyNowProduct.id,
                    sellerId: buyNowProduct.sellerId || null,
                    name: buyNowProduct.name || buyNowProduct.title,
                    // Store BOTH base price and product pricing fields for consistency
                    price: buyNowProduct.price, // Original product price field (for PriceDisplay)
                    discountPrice: buyNowProduct.discountPrice, // Original discount price (for PriceDisplay)
                    oldPrice: buyNowProduct.oldPrice, // Original old price (for PriceDisplay)
                    pricingType: buyNowProduct.pricingType, // Pricing type (uniform/varied)
                    sizePrices: buyNowProduct.sizePrices, // Size-specific prices
                    basePrice: basePrice, // Base price for backend calculations
                    priceWithGST: finalPrice, // GST-inclusive price for display
                    originalPrice: strikethroughPrice,
                    gstPercent: gstPercent,
                    imageUrl: buyNowProduct.imageUrl || buyNowProduct.image,
                    quantity: buyNowProduct.quantity || 1,
                    category: buyNowProduct.category,
                    selections: buyNowProduct.selections,
                    selectedColor: buyNowProduct.selections?.color,
                    selectedSize: buyNowProduct.selections?.size,
                    selectedStorage: buyNowProduct.selections?.storage?.label || buyNowProduct.selections?.storage,
                    selectedMemory: buyNowProduct.selections?.memory?.label || buyNowProduct.selections?.memory,
                    isBuyNow: true // Flag to identify Buy Now item
                };
                
                // Combine Buy Now product with cart items (Buy Now first)
                const allItems = [buyNowCartItem, ...items];
                setCheckoutItems(allItems);
                
                // Pre-select ONLY the Buy Now product
                setSelectedItems(new Set([buyNowCartItem.id]));
                
            } else if (selectedItemIds && selectedItemIds.length > 0) {
                // Regular cart checkout: Show only selected items
                const itemsToCheckout = items.filter(item => 
                    selectedItemIds.includes(item.id || item.productId)
                );
                setCheckoutItems(itemsToCheckout);
                // All items selected by default
                setSelectedItems(new Set(itemsToCheckout.map(item => item.id || item.productId)));
            } else {
                // Fallback: show all cart items, all selected
                setCheckoutItems(items);
                setSelectedItems(new Set(items.map(item => item.id || item.productId)));
            }
            
            let itemsToCheckout = items;
            
            if (selectedItemIds && selectedItemIds.length > 0) {
                itemsToCheckout = items.filter(item => selectedItemIds.includes(item.id || item.productId));
            }
            
            setCheckoutItems(itemsToCheckout);
            setLoading(false);
        });
        return () => unsubscribe && unsubscribe();
    }, [location.state]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
            setShippingAddress(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setShippingAddress(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    // Estimate shipping charges when address is complete
    const estimateShippingCharges = async (address, items) => {
        // Check if address has required fields
        if (!address.pincode || address.pincode.length !== 6) {
            return;
        }
        
        if (!items || items.length === 0) {
            return;
        }
        
        setEstimatingShipping(true);
        try {
            const requestBody = {
                shippingAddress: address,
                cartItems: items,
                totalWeight: items.length * 0.5 // Estimate 0.5kg per item
            };
            
            const response = await authFetch('/shipping/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setShippingFee(data.shippingCharge || 0);
                setEstimatedDeliveryDays(data.estimatedDeliveryDays || '');
                setShippingEstimated(true);
            } else {
                console.error('❌ Shipping estimation failed:', data.message);
                setShippingFee(0);
                setShippingEstimated(false);
            }
        } catch (error) {
            console.error('❌ Error estimating shipping:', error);
            setShippingFee(0);
            setShippingEstimated(false);
        } finally {
            setEstimatingShipping(false);
        }
    };
    
    // Trigger shipping estimation when address changes OR items load
    useEffect(() => {
        // Filter selected items
        const selectedItems_filtered = checkoutItems.filter(item => 
            selectedItems.has(item.id || item.productId)
        );
        
        if (shippingAddress.pincode && shippingAddress.pincode.length === 6 && selectedItems_filtered.length > 0) {
            estimateShippingCharges(shippingAddress, selectedItems_filtered);
        } else {
            // Reset shipping if conditions not met
            if (shippingFee > 0 || shippingEstimated) {
                setShippingFee(0);
                setShippingEstimated(false);
                setEstimatedDeliveryDays('');
            }
        }
    }, [shippingAddress, checkoutItems, selectedItems]);

    const handleBillingAddressChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
            setBillingAddress(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setBillingAddress(prev => ({ ...prev, [name]: value }));
        }
        if (errors[`billing_${name}`]) {
            setErrors(prev => ({ ...prev, [`billing_${name}`]: '' }));
        }
    };

    const handleRazorpayPayment = async () => {
        setRazorpayLoading(true);
        try {
            const selectedCartItems = selectedCheckoutItems;
            
            // Prepare billing address (same as shipping if checkbox is checked)
            const finalBillingAddress = sameAsBilling ? { ...shippingAddress, type: 'billing' } : billingAddress;
            
            const customerInfo = {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                email: user?.email || '',
                phone: user?.phoneNumber || user?.phone || shippingAddress.phone || '',
                shippingAddress: shippingAddress,
                billingAddress: finalBillingAddress,
                gstNumber: hasGST ? cleanGST(gstNumber) : null,
                businessName: hasGST && businessName ? businessName.trim() : null,
                estimatedShippingCharge: shippingFee // Pass estimated shipping to backend
            };

            const createOrderResponse = await authFetch('/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: finalTotal,
                    cartItems: selectedCartItems,
                    customerInfo: customerInfo,
                    couponCode: appliedCoupon?.code || null,
                    couponDiscount: couponDiscount,
                    platformFeeBreakdown: adminConfig.platformFeeBreakdown // Send platform fee breakdown
                })
            });

            const orderResult = await createOrderResponse.json();

            if (!orderResult.success) {
                alert('Failed to create payment order');
                setRazorpayLoading(false);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);

            script.onload = () => {
                const options = {
                    key: orderResult.key_id,
                    amount: orderResult.order.amount,
                    currency: orderResult.order.currency,
                    order_id: orderResult.order.id,
                    name: 'Goodkart',
                    description: 'Order Payment',
                    image: '/logo.png',
                    handler: async function (response) {
                        try {
                            const selectedCartItems = selectedCheckoutItems;
                            
                            // Prepare billing address
                            const finalBillingAddress = sameAsBilling ? { ...shippingAddress, type: 'billing' } : billingAddress;
                            
                            const customerInfo = {
                                firstName: shippingAddress.firstName,
                                lastName: shippingAddress.lastName,
                                email: user?.email || '',
                                phone: user?.phoneNumber || user?.phone || shippingAddress.phone || '',
                                shippingAddress: shippingAddress,
                                billingAddress: finalBillingAddress,
                                gstNumber: hasGST ? cleanGST(gstNumber) : null,
                                businessName: hasGST && businessName ? businessName.trim() : null,
                                estimatedShippingCharge: shippingFee // Pass estimated shipping to backend
                            };
                            
                            const verifyResponse = await authFetch('/payment/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    cartItems: selectedCartItems,
                                    customerInfo: customerInfo,
                                    amount: finalTotal,
                                    uid: auth.currentUser?.uid || 'guest',
                                    couponCode: appliedCoupon?.code || null,
                                    couponDiscount: couponDiscount,
                                    platformFeeBreakdown: adminConfig.platformFeeBreakdown,
                                    effectivePlatformFee: finalOrderTotals.platformFee
                                })
                            });

                            const verifyResult = await verifyResponse.json();

                            if (verifyResult.success) {
                                // Only remove items from cart if they're not Buy Now items
                                const isBuyNow = location.state?.buyNowProduct;
                                if (!isBuyNow) {
                                    selectedCartItems.forEach(item => removeFromCart(item.id || item.productId));
                                }
                                
                                // Save shipping address if requested
                                if (addressMode === 'new' && saveAddressForFuture && user) {
                                    try {
                                        const newAddress = { 
                                            ...shippingAddress, 
                                            isDefault: setAsDefault,
                                            type: 'shipping',
                                            id: Date.now().toString()
                                        };
                                        await authFetch(`/consumer/${user.uid}/addresses`, {
                                            method: 'POST',
                                            body: JSON.stringify({ address: newAddress })
                                        });
                                    } catch (error) {
                                        console.error("Error saving shipping address:", error);
                                    }
                                }
                                
                                // Save billing address if requested and different from shipping
                                if (!sameAsBilling && billingAddressMode === 'new' && saveBillingForFuture && user) {
                                    try {
                                        const newBillingAddress = { 
                                            ...billingAddress, 
                                            isDefault: setBillingAsDefault,
                                            type: 'billing',
                                            id: (Date.now() + 1).toString()
                                        };
                                        await authFetch(`/consumer/${user.uid}/addresses`, {
                                            method: 'POST',
                                            body: JSON.stringify({ address: newBillingAddress })
                                        });
                                    } catch (error) {
                                        console.error("Error saving billing address:", error);
                                    }
                                }
                                
                                setOrderId(verifyResult.orderId);
                                setShowAnimation(true);
                            } else {
                                alert('Payment verification failed: ' + verifyResult.message);
                            }
                        } catch (error) {
                            console.error('Verification Error:', error);
                            alert('Payment verification failed. Please contact support.');
                        } finally {
                            setRazorpayLoading(false);
                        }
                    },
                    prefill: {
                        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                        email: user?.email || '',
                        contact: user?.phoneNumber || user?.phone || ''
                    },
                    theme: { color: '#3B7CF1' },
                    modal: {
                        ondismiss: function () { setRazorpayLoading(false); }
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
                setRazorpayLoading(false);
            };

            script.onerror = () => {
                alert('Failed to load Razorpay. Please try again.');
                setRazorpayLoading(false);
            };
        } catch (error) {
            console.error('Razorpay Error:', error);
            alert('Payment initialization failed');
            setRazorpayLoading(false);
        }
    };

    const processOrder = async (paymentType, paymentId = null) => {
        setLoading(true);
        try {
            const selectedCartItems = selectedCheckoutItems;
            
            // Prepare billing address
            const finalBillingAddress = sameAsBilling ? { ...shippingAddress, type: 'billing' } : billingAddress;
            
            const customerInfo = {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                email: user?.email || '',
                phone: user?.phoneNumber || user?.phone || shippingAddress.phone || '',
                shippingAddress: shippingAddress,
                billingAddress: finalBillingAddress,
                gstNumber: hasGST ? cleanGST(gstNumber) : null,
                businessName: hasGST && businessName ? businessName.trim() : null,
                estimatedShippingCharge: shippingFee // Pass estimated shipping to backend
            };

            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("Please login to place an order");
                setLoading(false);
                return;
            }

            const response = await authFetch('/payment/cod-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: currentUser.uid,
                    cartItems: selectedCartItems,
                    customerInfo: customerInfo,
                    amount: finalTotal,
                    couponCode: appliedCoupon?.code || null,
                    couponDiscount: actualCouponDiscount,
                    platformFeeBreakdown: adminConfig.platformFeeBreakdown,
                    effectivePlatformFee: finalOrderTotals.platformFee
                })
            });

            const result = await response.json();

            if (result.success) {
                // Save shipping address if requested
                if (addressMode === 'new' && saveAddressForFuture && user) {
                    try {
                        const newAddress = { 
                            ...shippingAddress, 
                            isDefault: setAsDefault,
                            type: 'shipping',
                            id: Date.now().toString()
                        };
                        await authFetch(`/consumer/${user.uid}/addresses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: newAddress })
                        });
                    } catch (error) {
                        console.error("Error saving shipping address:", error);
                    }
                }
                
                // Save billing address if requested and different from shipping
                if (!sameAsBilling && billingAddressMode === 'new' && saveBillingForFuture && user) {
                    try {
                        const newBillingAddress = { 
                            ...billingAddress, 
                            isDefault: setBillingAsDefault,
                            type: 'billing',
                            id: (Date.now() + 1).toString()
                        };
                        await authFetch(`/consumer/${user.uid}/addresses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: newBillingAddress })
                        });
                    } catch (error) {
                        console.error("Error saving billing address:", error);
                    }
                }
                
                // Only remove items from cart if they're not Buy Now items
                const isBuyNow = location.state?.buyNowProduct;
                if (!isBuyNow) {
                    selectedCartItems.forEach(item => removeFromCart(item.id || item.productId));
                }
                
                setOrderId(result.orderId);
                setShowAnimation(true);
            } else {
                alert("Failed to place order: " + result.message);
            }
        } catch (error) {
            console.error("Order Error:", error);
            alert("An error occurred while placing your order.");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Validate shipping address
        if (!shippingAddress.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!shippingAddress.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!shippingAddress.addressLine.trim() || shippingAddress.addressLine.length < 5) newErrors.addressLine = 'Full address is required';
        if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
        if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
        if (!/^\d{6}$/.test(shippingAddress.pincode)) newErrors.pincode = 'Pincode must be exactly 6 digits';
        
        // Validate GST number if checkbox is checked
        if (hasGST) {
            const gstValidationError = getGSTError(gstNumber);
            if (gstValidationError) {
                newErrors.gstNumber = gstValidationError;
                setGstError(gstValidationError);
            } else {
                setGstError('');
            }
        }
        
        // Validate billing address if different from shipping
        if (!sameAsBilling) {
            if (!billingAddress.firstName.trim()) newErrors.billing_firstName = 'Billing first name is required';
            if (!billingAddress.lastName.trim()) newErrors.billing_lastName = 'Billing last name is required';
            if (!billingAddress.addressLine.trim() || billingAddress.addressLine.length < 5) newErrors.billing_addressLine = 'Billing address is required';
            if (!billingAddress.city.trim()) newErrors.billing_city = 'Billing city is required';
            if (!billingAddress.state.trim()) newErrors.billing_state = 'Billing state is required';
            if (!/^\d{6}$/.test(billingAddress.pincode)) newErrors.billing_pincode = 'Billing pincode must be exactly 6 digits';
        }
        
        if (step === 2 && !paymentMethod) newErrors.payment = 'Please select a payment method';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRemove = async (productId) => {
        await removeFromCart(productId);
    };

    const handleContinue = async () => {
        if (!auth.currentUser) {
            window.dispatchEvent(new Event('openLoginModal'));
            return;
        }
        if (step === 1) {
            if (validateForm()) { 
                setValidationError('');
                setStep(2); 
            }
            else { 
                // Check if billing address is the issue
                const hasBillingErrors = Object.keys(errors).some(key => key.startsWith('billing_'));
                if (hasBillingErrors && !sameAsBilling) {
                    setValidationError('Please fill in all required billing address fields correctly.');
                } else {
                    setValidationError('Please fill in all required address fields correctly.');
                }
                // Scroll to error message
                setTimeout(() => {
                    const errorElement = document.getElementById('validation-error');
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        } else {
            const isValid = validateForm();
            if (isValid) {
                setValidationError('');
                if (paymentMethod === 'razorpay') { handleRazorpayPayment(); }
                else { processOrder(paymentMethod); }
            } else {
                setValidationError('Please fix the validation errors before continuing.');
                // Scroll to error message
                setTimeout(() => {
                    const errorElement = document.getElementById('validation-error');
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }
    };

    // Toggle item selection in checkout
    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Filter selected items for payment
    const selectedCheckoutItems = checkoutItems.filter(item => 
        selectedItems.has(item.id || item.productId)
    );

    // Calculate order totals using the SAME utility as Order Summary for consistency
    const couponDiscount = appliedCoupon ? 0 : 0; // Will be calculated properly below
    const orderTotals = calculateOrderTotalsWithGSTInclusive(selectedCheckoutItems, {
        adminConfig,
        couponDiscount: 0, // Calculate after we get product total
        shippingFee: shippingFee // Use estimated shipping fee
    });
    
    // Calculate coupon discount on product pricing total
    const actualCouponDiscount = appliedCoupon ? (orderTotals.productPricingTotal * appliedCoupon.discountPercent / 100) : 0;
    
    // Recalculate with actual coupon discount
    const finalOrderTotals = calculateOrderTotalsWithGSTInclusive(selectedCheckoutItems, {
        adminConfig,
        couponDiscount: actualCouponDiscount,
        shippingFee: shippingFee // Use estimated shipping fee
    });
    
    // Use the final total from order totals calculation
    const finalTotal = finalOrderTotals.total;
    const subtotal = orderTotals.basePrice; // Base price for backend

    // Apply coupon function
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }
        
        setApplyingCoupon(true);
        setCouponError('');
        
        try {
            // Simulate API call - replace with actual API endpoint
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock coupon validation - replace with actual API call
            const mockCoupons = {
                'SAVE10': { code: 'SAVE10', discountPercent: 10, description: '10% off' },
                'SAVE20': { code: 'SAVE20', discountPercent: 20, description: '20% off' },
                'FIRST50': { code: 'FIRST50', discountPercent: 50, description: '50% off for first order' }
            };
            
            const coupon = mockCoupons[couponCode.toUpperCase()];
            
            if (coupon) {
                setAppliedCoupon(coupon);
                setCouponError('');
            } else {
                setCouponError('Invalid coupon code');
                setAppliedCoupon(null);
            }
        } catch (error) {
            setCouponError('Failed to apply coupon');
            setAppliedCoupon(null);
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleQuantityChange = async (item, newQuantity) => {
        if (newQuantity < 1) return;
        if (newQuantity > (item.stock || 99)) {
            alert(`Only ${item.stock || 99} items available in stock`);
            return;
        }
        
        // For Buy Now items, update the state directly
        if (item.isBuyNow) {
            setCheckoutItems(prevItems => 
                prevItems.map(i => 
                    i.id === item.id ? { ...i, quantity: newQuantity } : i
                )
            );
        } else {
            // For cart items, update in cart
            await updateCartItemQuantity(item.id || item.productId, newQuantity);
        }
    };

    const handleAnimationComplete = () => {
        navigate(`/track?orderId=${orderId}`);
    };

    if (isOrdered) {
        return (
            <CheckoutSuccess 
                orderId={orderId} 
                shippingAddress={shippingAddress} 
                paymentMethod={paymentMethod} 
                subtotal={subtotal} 
                user={user} 
            />
        );
    }

    return (
        <div className="bg-gray-50/20 min-h-screen">
            <div className="container px-4 py-6 max-w-7xl mx-auto">
                {/* Sticky Header */}
                <div className="sticky top-[70px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 py-4 mb-6 shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        {/* Left: Back to Shopping Button */}
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm font-medium"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none' }}
                        >
                            <ArrowLeft size={16} />
                            Back to Shopping
                        </Link>
                        
                        {/* Right: Title and Subtitle */}
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                Checkout <span className="text-gray-400 font-light">Process</span>
                            </h1>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">Securely complete your purchase at Goodkart</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-7 space-y-4">
                        {/* Cart Items List */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                                    <ShoppingBag size={20} className="text-primary" />
                                    Your Items ({selectedItems.size} of {checkoutItems.length} selected)
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {(() => {
                                    // Separate selected and unselected items
                                    const selectedItemsList = checkoutItems.filter(item => 
                                        selectedItems.has(item.id || item.productId)
                                    );
                                    const unselectedItemsList = checkoutItems.filter(item => 
                                        !selectedItems.has(item.id || item.productId)
                                    );
                                    
                                    // Show all selected items + limited unselected items
                                    const unselectedToShow = showAllItems ? unselectedItemsList : unselectedItemsList.slice(0, 3);
                                    const itemsToDisplay = [...selectedItemsList, ...unselectedToShow];
                                    
                                    return itemsToDisplay.map((item) => {
                                        const itemId = item.id || item.productId;
                                        const isSelected = selectedItems.has(itemId);
                                        const isBuyNowItem = item.isBuyNow;
                                        
                                        return (
                                            <div key={itemId} className={`flex gap-3 items-center p-3 rounded-xl border bg-white hover:shadow-sm transition-all ${isSelected ? 'border-primary border-2' : 'border-gray-200'}`}>
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleItemSelection(itemId)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                                            />
                                            
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-semibold text-gray-900 truncate text-sm">{item.name}</h4>
                                                    {isBuyNowItem && (
                                                        <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                                                            Buy Now
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Variant Info */}
                                                {(item.selectedColor || item.selectedSize || item.selectedStorage || item.selections?.storage || item.selections?.memory) && (
                                                    <div className="flex gap-1 text-xs text-gray-600 flex-wrap">
                                                        {(item.selectedColor || item.selections?.color) && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedColor || item.selections?.color}
                                                            </span>
                                                        )}
                                                        {(item.selectedSize || item.selections?.size) && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedSize || item.selections?.size}
                                                            </span>
                                                        )}
                                                        {(item.selectedStorage || item.selections?.storage) && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedStorage || item.selections?.storage?.label || item.selections?.storage}
                                                            </span>
                                                        )}
                                                        {(item.selectedMemory || item.selections?.memory) && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedMemory || item.selections?.memory?.label || item.selections?.memory}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium text-gray-500">Qty:</span>
                                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1}
                                                            className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs">
                                                            <Minus size={10} />
                                                        </button>
                                                        <span className="w-6 text-center font-semibold text-gray-900 text-xs">{item.quantity}</span>
                                                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} disabled={item.quantity >= (item.stock || 99)}
                                                            className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs">
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <PriceDisplay product={item} size="sm" showBadge={false} />
                                                {!isBuyNowItem && (
                                                    <button onClick={() => handleRemove(itemId)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remove">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                                })()}
                                
                                {/* Show More / Show Less Button - Only for unselected items */}
                                {(() => {
                                    const unselectedCount = checkoutItems.filter(item => 
                                        !selectedItems.has(item.id || item.productId)
                                    ).length;
                                    
                                    if (unselectedCount <= 3) return null;
                                    
                                    const hiddenCount = unselectedCount - 3;
                                    
                                    return (
                                        <div className="pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => setShowAllItems(!showAllItems)}
                                                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                {showAllItems ? (
                                                    <>
                                                        <Minus size={18} />
                                                        Show Less
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={18} />
                                                        Show {hiddenCount} More {hiddenCount === 1 ? 'Item' : 'Items'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>

                        {/* Step 1: Address */}
                        <AddressStep
                            step={step}
                            setStep={setStep}
                            shippingAddress={shippingAddress}
                            handleAddressChange={handleAddressChange}
                            errors={errors}
                            savedAddresses={savedAddresses}
                            selectedAddressIndex={selectedAddressIndex}
                            setSelectedAddressIndex={setSelectedAddressIndex}
                            setShippingAddress={setShippingAddress}
                            addressMode={addressMode}
                            setAddressMode={setAddressMode}
                            saveAddressForFuture={saveAddressForFuture}
                            setSaveAddressForFuture={setSaveAddressForFuture}
                            setAsDefault={setAsDefault}
                            setSetAsDefault={setSetAsDefault}
                            fetchingSavedAddress={fetchingSavedAddress}
                            handleContinue={handleContinue}
                            sameAsBilling={sameAsBilling}
                            setSameAsBilling={setSameAsBilling}
                            validationError={validationError}
                            billingAddress={billingAddress}
                            handleBillingAddressChange={handleBillingAddressChange}
                            billingAddressMode={billingAddressMode}
                            setBillingAddressMode={setBillingAddressMode}
                            savedBillingAddresses={savedBillingAddresses}
                            selectedBillingAddressIndex={selectedBillingAddressIndex}
                            setSelectedBillingAddressIndex={setSelectedBillingAddressIndex}
                            setBillingAddress={setBillingAddress}
                            saveBillingForFuture={saveBillingForFuture}
                            setSaveBillingForFuture={setSaveBillingForFuture}
                            setBillingAsDefault={setBillingAsDefault}
                            setSetBillingAsDefault={setSetBillingAsDefault}
                            hasGST={hasGST}
                            setHasGST={setHasGST}
                            gstNumber={gstNumber}
                            setGstNumber={setGstNumber}
                            businessName={businessName}
                            setBusinessName={setBusinessName}
                            gstError={gstError}
                            setGstError={setGstError}
                        />

                        {/* Coupon Section - Between Items and Shipping */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50">
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Tag size={18} className="text-primary" />
                                    Apply Coupon Code
                                </h3>
                            </div>
                            <div className="p-4">
                                {!appliedCoupon ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter coupon code"
                                                className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                                disabled={applyingCoupon}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={applyingCoupon || !couponCode.trim()}
                                                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 text-sm"
                                            >
                                                {applyingCoupon ? 'Applying...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-500 font-medium px-1">{couponError}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <Tag size={16} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-green-900">{appliedCoupon.code}</p>
                                                    <p className="text-xs text-green-700">{appliedCoupon.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="p-1.5 hover:bg-green-100 rounded-lg transition-all"
                                                title="Remove coupon"
                                            >
                                                <X size={16} className="text-green-700" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Step 2: Payment */}
                        <PaymentStep
                            step={step}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            finalTotal={finalTotal}
                            razorpayLoading={razorpayLoading}
                            loading={loading}
                            handleContinue={handleContinue}
                        />
                    </div>

                    {/* Order Summary Sidebar */}
                    <CheckoutOrderSummary 
                        subtotal={subtotal} 
                        couponDiscount={actualCouponDiscount}
                        finalTotal={finalTotal}
                        selectedItems={selectedCheckoutItems}
                        adminConfig={adminConfig}
                        shippingFee={shippingFee}
                        estimatingShipping={estimatingShipping}
                        shippingEstimated={shippingEstimated}
                        estimatedDeliveryDays={estimatedDeliveryDays}
                    />
                </div>
            </div>

            {/* Confirmation Animation */}
            <AnimatePresence>
                {showAnimation && (
                    <ConfirmationAnimation onComplete={handleAnimationComplete} />
                )}
            </AnimatePresence>
        </div>
    );
}




