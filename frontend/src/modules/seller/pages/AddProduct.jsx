import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, Tag, AlertCircle, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';
import { VARIANT_CONFIGS } from '@/modules/shared/config/productVariants';
import { SELLER_CATEGORIES, getSubcategories } from '@/modules/shared/config/categories';
import { calculatePlatformFeeBreakdown, formatPlatformFeeBreakdown, getPlatformFeeBreakdownFromConfig, calculateTotalPlatformFeePercent } from '@/modules/shared/utils/platformFeeUtils';

// Extracted Components
import ImageUploader from '../components/AddProduct/ImageUploader';
import VariantsEditor from '../components/AddProduct/VariantsEditor';

const CATEGORY_CONFIG = VARIANT_CONFIGS;
const categories = SELLER_CATEGORIES;

const CATEGORY_GST_RATES_DEFAULT = {}; // Removed hardcoded defaults as per request

const sty = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '1rem' },
    container: { maxWidth: '1100px', margin: '0 auto' },
    card: { background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    sectionIcon: (color) => ({ padding: '0.5rem', background: `${color}15`, color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    label: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155' },
    input: { width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: 'white', transition: 'border-color 0.2s', outline: 'none' },
    select: { width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc', cursor: 'pointer' },
    priceInput: { width: '100%', padding: '0.7rem 0.7rem 0.7rem 1.8rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem' },
    badge: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '50px', background: `${color}15`, color, fontSize: '0.78rem', fontWeight: 600 }),
};

export default function AddProduct() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Core state
    const [product, setProduct] = useState({
        name: '', price: '', discountPrice: '', category: '', subCategory: '', stock: '', description: '', image: '', images: [], gstPercent: '', customCategory: ''
    });

    // Fee constants
    const USER_FEE_PERCENT = 3;
    
    // Platform fee breakdown state
    const [platformFeeBreakdown, setPlatformFeeBreakdown] = useState({
        digitalSecurityFee: { percent: 1.2, label: 'Digital Security Fee' },
        merchantVerification: { percent: 1.0, label: 'Merchant Verification' },
        transitCare: { percent: 0.8, label: 'Transit Care' },
        platformMaintenance: { percent: 0.5, label: 'Platform Maintenance' }
    });
    const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
    
    // Seller GST status
    const [sellerHasGST, setSellerHasGST] = useState(false);
    const [sellerProfileLoaded, setSellerProfileLoaded] = useState(false);

    // Calculate platform fee percent from breakdown (default 3.5%)
    // Added 2% extra convenience fee for sellers without GST ID
    const PLATFORM_FEE_PERCENT = (platformFeeBreakdown 
        ? calculateTotalPlatformFeePercent(platformFeeBreakdown) 
        : 3.5) + (!sellerHasGST ? 2 : 0);

    // Sub-component state
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [pricingType, setPricingType] = useState('same');
    const [sizePrices, setSizePrices] = useState({});

    const [selectedColors, setSelectedColors] = useState([]);
    const [customColorInput, setCustomColorInput] = useState('');

    const [variants, setVariants] = useState({});
    const [customVariantInput, setCustomVariantInput] = useState({});
    const [variantPricingType, setVariantPricingType] = useState({});

    const [specifications, setSpecifications] = useState([]);
    const [showSpecInput, setShowSpecInput] = useState(false);
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecVal, setNewSpecVal] = useState('');

    const [variantImages, setVariantImages] = useState({});

    const config = CATEGORY_CONFIG[product.category] || null;

    const [categoryGstRates, setCategoryGstRates] = useState(CATEGORY_GST_RATES_DEFAULT);

    // Load seller profile to check GST status + fetch admin category GST rates + platform fee breakdown
    useEffect(() => {
        // Fetch admin-configured GST rates and platform fee breakdown
        import('@/modules/shared/utils/api').then(({ authFetch }) => {
            authFetch('/admin/config/public').then(r => r.json()).then(d => {
                if (d.success && d.config) {
                    if (d.config.categoryGstRates) setCategoryGstRates(d.config.categoryGstRates);
                    // Use seller platform fee breakdown for the seller product listing page
                    const sellerBreakdown = d.config.platformFeeBreakdownSeller || d.config.platformFeeBreakdown;
                    if (sellerBreakdown) {
                        setPlatformFeeBreakdown(getPlatformFeeBreakdownFromConfig({ platformFeeBreakdown: sellerBreakdown }));
                    }
                    // Fetch default GST if available
                    if (d.config.defaultGstPercent) {
                        setProduct(prev => ({ ...prev, gstPercent: prev.gstPercent || d.config.defaultGstPercent }));
                    }
                }
            }).catch(() => {});
        });

        const loadSellerProfile = async () => {
            try {
                const user = auth.currentUser;
                let uid = user?.uid;
                if (!uid) {
                    try { uid = JSON.parse(localStorage.getItem('seller_user'))?.uid; } catch { uid = null; }
                }
                if (uid) {
                    const res = await authFetch(`/seller/${uid}/dashboard-data`);
                    const data = await res.json();
                    if (data.success && data.profile) {
                        const hasGST = data.profile.hasGST === 'yes' && data.profile.gstNumber;
                        setSellerHasGST(!!hasGST);
                        
                        // If they don't have GST, strictly lock and pre-fill the static rate immediately
                        if (!hasGST && product.category) {
                            setProduct(prev => ({ ...prev, gstPercent: categoryGstRates[prev.category] ?? 18 }));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load seller profile for GST check:', err);
            } finally {
                setSellerProfileLoaded(true);
            }
        };
        loadSellerProfile();
    }, []);

    // Handlers
    const toggleSize = (size) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter(s => s !== size));
            const newPrices = { ...sizePrices };
            delete newPrices[size];
            setSizePrices(newPrices);
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };
    const addCustomSize = () => {
        const trimmed = customSizeInput.trim();
        if (trimmed && !selectedSizes.includes(trimmed)) {
            setSelectedSizes([...selectedSizes, trimmed]);
            setCustomSizeInput('');
        }
    };

    const toggleColor = (color) => {
        if (selectedColors.includes(color)) setSelectedColors(selectedColors.filter(c => c !== color));
        else setSelectedColors([...selectedColors, color]);
    };
    const addCustomColor = () => {
        const trimmed = customColorInput.trim();
        if (trimmed && !selectedColors.includes(trimmed)) {
            setSelectedColors([...selectedColors, trimmed]);
            setCustomColorInput('');
        }
    };

    const toggleVariant = (variantKey, value) => {
        const current = variants[variantKey] || [];
        const exists = current.find(v => v.label === value);
        if (exists) setVariants({ ...variants, [variantKey]: current.filter(v => v.label !== value) });
        else setVariants({ ...variants, [variantKey]: [...current, { label: value, priceOffset: 0 }] });
    };
    const addCustomVariant = (variantKey) => {
        const input = (customVariantInput[variantKey] || '').trim();
        if (!input) return;
        const current = variants[variantKey] || [];
        if (!current.find(v => v.label === input)) {
            setVariants({ ...variants, [variantKey]: [...current, { label: input, priceOffset: 0 }] });
        }
        setCustomVariantInput({ ...customVariantInput, [variantKey]: '' });
    };
    const updateVariantPrice = (variantKey, label, priceOffset) => {
        const current = variants[variantKey] || [];
        setVariants({
            ...variants,
            [variantKey]: current.map(v => v.label === label ? { ...v, priceOffset: Number(priceOffset) || 0 } : v)
        });
    };

    const addSpecification = () => {
        if (newSpecKey.trim()) {
            setSpecifications([...specifications, { key: newSpecKey.trim(), value: newSpecVal.trim() }]);
            setNewSpecKey('');
            setNewSpecVal('');
            setShowSpecInput(false);
        }
    };
    const addPresetSpec = (presetKey) => {
        if (!specifications.find(s => s.key === presetKey)) setSpecifications([...specifications, { key: presetKey, value: '' }]);
    };
    const updateSpecValue = (index, value) => {
        const updated = [...specifications];
        updated[index].value = value;
        setSpecifications(updated);
    };
    const removeSpec = (index) => setSpecifications(specifications.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!product.image) {
            alert('Main Product Image is compulsory. Please upload it.');
            return;
        }

        const user = auth.currentUser;
        let sellerId = user?.uid || null;
        if (!sellerId) {
            try { sellerId = JSON.parse(localStorage.getItem('seller_user'))?.uid; } catch { sellerId = null; }
        }
        if (!sellerId) { alert("Please login first"); return; }

        const fullProduct = {
            title: product.name,
            price: parseFloat(product.price),
            discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
            category: product.category,
            subCategory: product.category === 'Others' ? product.customCategory : (product.subCategory || null),
            stock: parseInt(product.stock),
            description: product.description,
            image: product.image,
            images: product.images || [],
            platformFeePercent: PLATFORM_FEE_PERCENT,
            userFeePercent: USER_FEE_PERCENT,
        };

        // Always include GST. It is mandatory for all products.
        if (product.gstPercent) {
            fullProduct.gstPercent = parseFloat(product.gstPercent);
        } else {
            alert('Please provide a GST Percent value.');
            setLoading(false);
            return;
        }

        if (Object.keys(variantImages).length > 0) fullProduct.variantImages = variantImages;

        if (selectedSizes.length > 0) {
            fullProduct.sizes = selectedSizes;
            fullProduct.pricingType = pricingType;
            if (pricingType === 'varied') fullProduct.sizePrices = sizePrices;
        }
        if (selectedColors.length > 0) fullProduct.colors = selectedColors;

        const attributesObj = {};
        for (const [key, items] of Object.entries(variants)) {
            if (items.length > 0) attributesObj[key] = items;
        }
        if (Object.keys(attributesObj).length > 0) {
            fullProduct.attributes = attributesObj;
        }

        if (specifications.length > 0) {
            const specsObj = {};
            specifications.forEach(s => { if (s.key && s.value) specsObj[s.key] = s.value; });
            if (Object.keys(specsObj).length > 0) fullProduct.specifications = specsObj;
        }

        setLoading(true);
        try {
            const response = await authFetch('/seller/product/add', {
                method: 'POST',
                body: JSON.stringify({ sellerId, productData: fullProduct })
            });
            const data = await response.json();
            if (data.success) { navigate('/seller/dashboard'); }
            else { alert("Failed: " + data.message); }
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Error adding product");
        } finally { setLoading(false); }
    };

    return (
        <div style={sty.page}>
            <div style={sty.container}>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-8">
                    <button onClick={() => navigate('/seller/dashboard')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '12px' }}>
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>
                    <div className="text-left sm:text-right">
                        <h1 className="text-xl md:text-2xl font-extrabold">Create New <span className="gradient-text">Listing</span></h1>
                        <p className="text-muted text-sm">Build your product with dynamic attributes</p>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 md:gap-8">
                        {/* ═══════════ LEFT COLUMN ═══════════ */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                            className="flex flex-col gap-6">

                            {/* ── Basic Info ── */}
                            <div style={sty.card}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={sty.sectionIcon('var(--primary)')}><Info size={20} /></div>
                                    <h3 style={{ margin: 0 }}>Product Information</h3>
                                </div>
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <label style={sty.label}>Product Title</label>
                                        <input type="text" placeholder="e.g. Premium Silk Scarf" required style={sty.input}
                                            value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={sty.label}>Description</label>
                                        <textarea placeholder="Describe your product in detail..." required rows="4" style={{ ...sty.input, resize: 'vertical' }}
                                            value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Category & Pricing ── */}
                            <div style={sty.card}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={sty.sectionIcon('#22c55e')}><Tag size={20} /></div>
                                    <h3 style={{ margin: 0 }}>Category & Pricing</h3>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={sty.label}>Category</label>
                                    <select required style={sty.select} value={product.category}
                                        onChange={e => {
                                            const newCat = e.target.value;
                                            // Fallback to 18 if no rate found in admin config
                                            const newGst = !sellerHasGST ? (categoryGstRates[newCat] ?? 18) : product.gstPercent;
                                            setProduct({ ...product, category: newCat, subCategory: '', gstPercent: newGst });
                                            setSelectedSizes([]); setSelectedColors([]); setVariants({});
                                            setSpecifications([]); setPricingType('same'); setSizePrices({});
                                        }}>
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{CATEGORY_CONFIG[cat]?.icon || '📦'} {cat}</option>
                                        ))}
                                    </select>
                                    {product.category === 'Others' && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <label style={sty.label}>Specify Your Category</label>
                                            <input type="text" placeholder="e.g. Handmade Pottery, Custom Tech" required style={sty.input}
                                                value={product.customCategory} onChange={e => setProduct({ ...product, customCategory: e.target.value })} />
                                            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>This category will be listed under the "Others" section on the home page.</p>
                                        </div>
                                    )}
                                </div>

                                {product.category && product.category !== 'Others' && getSubcategories(product.category).length > 0 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={sty.label}>Subcategory</label>
                                        <select required style={sty.select} value={product.subCategory}
                                            onChange={e => setProduct({ ...product, subCategory: e.target.value })}>
                                            <option value="">Select Subcategory</option>
                                            {getSubcategories(product.category).map(subCat => (
                                                <option key={subCat} value={subCat}>{subCat}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {config && (
                                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={sty.badge('var(--primary)')}>
                                            {config.icon} {product.category}
                                        </span>
                                        {config.hasSizes && <span style={sty.badge('#5BB8FF')}>📏 Size Options</span>}
                                        {config.hasColors && <span style={sty.badge('#ec4899')}>🎨 Color Options</span>}
                                        {config.hasVariants && <span style={sty.badge('#f59e0b')}>⚙️ Variant Options</span>}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                    <div>
                                        <label style={sty.label}>Base Price (₹)</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: '#94a3b8' }}>₹</span>
                                            <input type="number" placeholder="0.00" required style={sty.priceInput}
                                                value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={sty.label}>Discount Price (₹)</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: '#94a3b8' }}>₹</span>
                                            <input type="number" placeholder="Optional" style={sty.priceInput}
                                                value={product.discountPrice} onChange={e => setProduct({ ...product, discountPrice: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={sty.label}>Stock Qty</label>
                                        <input type="number" placeholder="Units" required style={sty.input}
                                            value={product.stock} onChange={e => setProduct({ ...product, stock: e.target.value })} />
                                    </div>
                                </div>

                                {sellerHasGST ? (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label style={sty.label}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Percent size={14} /> GST Percent (%) <span style={{ color: 'red' }}>*</span>
                                            </span>
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="number" placeholder="e.g. 18" required min="0" max="100" style={sty.priceInput}
                                                value={product.gstPercent} onChange={e => setProduct({ ...product, gstPercent: e.target.value })} 
                                            />
                                            <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: '#94a3b8', fontSize: '0.85rem' }}>%</span>
                                        </div>
                                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>Enter applicable GST manually</p>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Percent size={16} style={{ color: 'var(--primary)' }} />
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Product GST (Fixed)</span>
                                            </div>
                                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{product.gstPercent || 0}%</span>
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>As a non-GST seller, the GST rate is determined by the admin based on category.</p>
                                    </div>
                                )}

                                {/* Platform Fee Breakdown */}
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div 
                                        onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                                        style={{
                                            display: 'flex',
                                            userSelect: 'none',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.85rem 1rem',
                                            border: '1.5px solid #e2e8f0',
                                            borderRadius: '10px',
                                            background: '#f8fafc',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Tag size={16} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                                                Platform Fee Breakdown
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                                                {PLATFORM_FEE_PERCENT}%
                                            </span>
                                            {showFeeBreakdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {showFeeBreakdown && platformFeeBreakdown && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                style={{
                                                    marginTop: '0.75rem',
                                                    padding: '1rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    background: 'white'
                                                }}
                                            >
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 500 }}>
                                                    Based on product price: ₹{Number(product.price).toLocaleString()}
                                                </p>
                                                {(() => {
                                                    const basePrice = parseFloat(product.price) || 0;
                                                    const breakdown = calculatePlatformFeeBreakdown(basePrice, platformFeeBreakdown);
                                                    const items = formatPlatformFeeBreakdown(breakdown);
                                                    
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {items.map((item) => (
                                                                <div key={item.key} style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '0.5rem 0.75rem',
                                                                    background: '#f8fafc',
                                                                    borderRadius: '6px'
                                                                }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                                                                            {item.label}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                                                            {item.description}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                                            ₹{item.amount.toFixed(2)}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                            {item.percent}%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {!sellerHasGST && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '0.5rem 0.75rem',
                                                                    background: 'rgba(236, 72, 153, 0.05)',
                                                                    borderRadius: '6px',
                                                                    border: '1px dashed #ec4899'
                                                                }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ec4899' }}>
                                                                            Non-GST Convenience Fee
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                                                            Applicable for sellers without GST registration
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ec4899' }}>
                                                                            ₹{((parseFloat(product.price) || 0) * 0.02).toFixed(2)}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                            2%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '0.75rem',
                                                                background: 'rgba(24, 0, 173,0.08)',
                                                                borderRadius: '6px',
                                                                marginTop: '0.25rem',
                                                                borderTop: '2px solid var(--primary)'
                                                            }}>
                                                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                                                                    Total Platform Fee
                                                                </span>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                                        ₹{breakdown.total.amount.toFixed(2)}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                                        {breakdown.total.percent}%
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    {!product.price && (
                                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                            Enter product price to see fee breakdown
                                        </p>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {config && (
                                    <VariantsEditor
                                        config={config} product={product}
                                        selectedSizes={selectedSizes} toggleSize={toggleSize} customSizeInput={customSizeInput} setCustomSizeInput={setCustomSizeInput} addCustomSize={addCustomSize}
                                        pricingType={pricingType} setPricingType={setPricingType} sizePrices={sizePrices} setSizePrices={setSizePrices}
                                        selectedColors={selectedColors} toggleColor={toggleColor} customColorInput={customColorInput} setCustomColorInput={setCustomColorInput} addCustomColor={addCustomColor}
                                        variants={variants} toggleVariant={toggleVariant} customVariantInput={customVariantInput} setCustomVariantInput={setCustomVariantInput} addCustomVariant={addCustomVariant} updateVariantPrice={updateVariantPrice}
                                        specifications={specifications} showSpecInput={showSpecInput} setShowSpecInput={setShowSpecInput} newSpecKey={newSpecKey} setNewSpecKey={setNewSpecKey} newSpecVal={newSpecVal} setNewSpecVal={setNewSpecVal} addSpecification={addSpecification} addPresetSpec={addPresetSpec} updateSpecValue={updateSpecValue} removeSpec={removeSpec}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* ═══════════ RIGHT COLUMN ═══════════ */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="flex flex-col gap-6">

                            <ImageUploader 
                                product={product} 
                                setProduct={setProduct} 
                                selectedColors={selectedColors}
                                variants={variants}
                                variantImages={variantImages}
                                setVariantImages={setVariantImages}
                            />

                            {/* Summary Preview */}
                            {product.category && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={sty.card}>
                                    <h4 style={{ margin: '0 0 1rem', color: '#334155' }}>📋 Listing Summary</h4>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {product.name && <div><strong>Title:</strong> {product.name}</div>}
                                        <div><strong>Category:</strong> {config?.icon} {product.category}</div>
                                        {product.subCategory && <div><strong>Subcategory:</strong> {product.subCategory}</div>}
                                        {product.price && <div><strong>Base Price:</strong> ₹{Number(product.price).toLocaleString()}</div>}
                                        {product.stock && <div><strong>Stock:</strong> {product.stock} units</div>}
                                        {selectedSizes.length > 0 && <div><strong>Sizes:</strong> {selectedSizes.join(', ')}</div>}
                                        {selectedColors.length > 0 && <div><strong>Colors:</strong> {selectedColors.join(', ')}</div>}
                                        {Object.entries(variants).map(([k, v]) => v.length > 0 && (
                                            <div key={k}><strong>{k}:</strong> {v.map(i => i.label).join(', ')}</div>
                                        ))}
                                        {Object.keys(variantImages).length > 0 && (
                                            <div><strong>Variant Images:</strong> {Object.keys(variantImages).length} uploaded</div>
                                        )}
                                        {specifications.filter(s => s.value).length > 0 && (
                                            <div><strong>Specs:</strong> {specifications.filter(s => s.value).length} defined</div>
                                        )}
                                        <div><strong>Platform Fee:</strong> {PLATFORM_FEE_PERCENT}%</div>
                                        {product.gstPercent && (
                                            <div><strong>GST:</strong> {product.gstPercent}%</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button type="submit" disabled={loading}
                                    className="btn btn-primary shadow-glow"
                                    style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', fontSize: '1.1rem' }}>
                                    {loading ? 'Publishing...' : '🚀 Publish Product'}
                                </button>
                                <button type="button" onClick={() => navigate('/seller/dashboard')}
                                    className="btn btn-secondary" style={{ width: '100%', padding: '1.25rem', borderRadius: '16px' }}>
                                    Cancel
                                </button>
                            </div>

                            {/* Tips */}
                            <div style={{ ...sty.card, background: '#f8fafc', border: 'none' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <AlertCircle size={18} /> Seller Tips
                                </h4>
                                <ul style={{ fontSize: '0.85rem', color: '#64748b', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>Add sizes & colors to help customers find the right fit.</li>
                                    <li>Set variant pricing for different configurations.</li>
                                    <li>Specifications improve search visibility.</li>
                                    <li>High-quality images boost conversions by 40%.</li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </form>
            </div>
        </div>
    );
}



