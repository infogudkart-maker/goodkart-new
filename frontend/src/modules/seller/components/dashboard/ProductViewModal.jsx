import { useState, useEffect } from 'react';
import { Edit2, Eye, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/modules/shared/utils/api';
import { VARIANT_CONFIGS } from '@/modules/shared/config/productVariants';
import { SELLER_CATEGORIES } from '@/modules/shared/config/categories';

const CATEGORY_GST_RATES = {
    "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12, "Electronics": 18, 
    "Home & Living": 18, "Handicrafts": 5, "Artworks": 12, "Beauty & Personal Care": 18,
    "Sports & Fitness": 18, "Books & Stationery": 12, "Food & Beverages": 5,
    "Gifts & Customization": 18, "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
    "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
    "Automotive & Accessories": 18, "Travel & Utility": 18, "Sustainability & Eco-Friendly": 12
};

import ImageUploader from '../AddProduct/ImageUploader';
import VariantsEditor from '../AddProduct/VariantsEditor';

const CATEGORY_CONFIG = VARIANT_CONFIGS;

export default function ProductViewModal({
    show, selectedProduct, onClose, onUpdateProduct, sellerProfile
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    // GST logic
    const [categoryGstRates, setCategoryGstRates] = useState(CATEGORY_GST_RATES);
    const sellerHasGST = sellerProfile?.hasGST === 'yes' && !!sellerProfile?.gstNumber;

    // Edit states
    const [editData, setEditData] = useState(null);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [pricingType, setPricingType] = useState('same');
    const [sizePrices, setSizePrices] = useState({});
    
    const [selectedColors, setSelectedColors] = useState([]);
    const [customColorInput, setCustomColorInput] = useState('');
    
    const [variants, setVariants] = useState({});
    const [customVariantInput, setCustomVariantInput] = useState({});
    
    const [specifications, setSpecifications] = useState([]);
    const [showSpecInput, setShowSpecInput] = useState(false);
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecVal, setNewSpecVal] = useState('');
    
    const [variantImages, setVariantImages] = useState({});

    useEffect(() => {
        if (show) {
            authFetch('/admin/config/public')
                .then(r => r.json())
                .then(d => {
                    if (d.success && d.config?.categoryGstRates) {
                        setCategoryGstRates(d.config.categoryGstRates);
                    }
                })
                .catch(console.error);
        }
    }, [show]);

    useEffect(() => {
        if (selectedProduct) {
            let cat = selectedProduct.category;
            let customCat = '';
            if (cat && cat.startsWith('Other:')) {
                customCat = cat.replace('Other:', '');
                cat = 'Other';
            }

            setEditData({
                ...selectedProduct,
                name: selectedProduct.title || '',
                price: selectedProduct.price || '',
                discountPrice: selectedProduct.discountPrice || '',
                category: cat || '',
                customCategory: customCat,
                stock: selectedProduct.stock || '',
                description: selectedProduct.description || '',
                image: selectedProduct.image || '',
                gstPercent: selectedProduct.gstPercent || ''
            });

            setSelectedSizes(selectedProduct.sizes || []);
            setPricingType(selectedProduct.pricingType || 'same');
            setSizePrices(selectedProduct.sizePrices || {});
            setSelectedColors(selectedProduct.colors || []);
            setVariantImages(selectedProduct.variantImages || {});
            
            const specsArray = Object.entries(selectedProduct.specifications || {}).map(([key, value]) => ({ key, value }));
            setSpecifications(specsArray);

            const parsedVariants = {};
            if (selectedProduct.attributes) {
                Object.keys(selectedProduct.attributes).forEach(k => {
                    parsedVariants[k] = selectedProduct.attributes[k];
                });
            } else {
                const standardKeys = ['id', 'title', 'price', 'discountPrice', 'category', 'stock', 'description', 'image', 'platformFeePercent', 'userFeePercent', 'gstPercent', 'sellerId', 'createdAt', 'status', 'customCategory', 'sizes', 'colors', 'pricingType', 'sizePrices', 'specifications', 'variantImages', 'views', 'name', 'attributes'];
                Object.keys(selectedProduct).forEach(k => {
                    if (!standardKeys.includes(k) && Array.isArray(selectedProduct[k])) {
                        parsedVariants[k] = selectedProduct[k];
                    }
                });
            }
            setVariants(parsedVariants);
            setIsEditing(false);
        }
    }, [selectedProduct, show]);


    // Mutation Handlers
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

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editData.image) {
            alert('Main Product Image is compulsory. Please upload or provide a URL.');
            return;
        }
        if (!editData.gstPercent && editData.gstPercent !== 0) {
            alert('Please provide a GST Percent value.');
            return;
        }

        const fullProduct = {
            id: editData.id,
            title: editData.name,
            price: parseFloat(editData.price),
            discountPrice: editData.discountPrice ? parseFloat(editData.discountPrice) : null,
            category: editData.category === 'Other' ? `Other:${editData.customCategory}` : editData.category,
            stock: parseInt(editData.stock),
            description: editData.description,
            image: editData.image,
            gstPercent: editData.gstPercent ? parseFloat(editData.gstPercent) : null
        };

        if (Object.keys(variantImages).length > 0) fullProduct.variantImages = variantImages;
        else fullProduct.variantImages = {}; // clear if removed

        if (selectedSizes.length > 0) {
            fullProduct.sizes = selectedSizes;
            fullProduct.pricingType = pricingType;
            if (pricingType === 'varied') fullProduct.sizePrices = sizePrices;
        } else {
            fullProduct.sizes = [];
        }
        
        if (selectedColors.length > 0) fullProduct.colors = selectedColors;
        else fullProduct.colors = [];

        // Attach all variants
        const standardKeys = ['id', 'title', 'price', 'discountPrice', 'category', 'stock', 'description', 'image', 'platformFeePercent', 'userFeePercent', 'gstPercent', 'sellerId', 'createdAt', 'status', 'customCategory', 'sizes', 'colors', 'pricingType', 'sizePrices', 'specifications', 'variantImages', 'views', 'name', 'attributes'];
        // Clear old variants keys that might have been removed
        Object.keys(selectedProduct).forEach(k => {
            if (!standardKeys.includes(k) && Array.isArray(selectedProduct[k])) {
                fullProduct[k] = []; // Clear old
            }
        });
        
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
            fullProduct.specifications = specsObj;
        } else {
            fullProduct.specifications = {};
        }

        setUpdateLoading(true);
        try {
            await onUpdateProduct(fullProduct);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating product:", error);
        } finally {
            setUpdateLoading(false);
        }
    };

    if (!show || !selectedProduct || !editData) return null;

    const config = CATEGORY_CONFIG[editData.category] || null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(5, 5, 15, 0.75)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    style={{
                        width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto',
                        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)',
                        background: 'white', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.25)',
                        color: 'var(--text)', position: 'relative'
                    }}
                    className="md:rounded-[28px]"
                >
                    <div className="p-4 md:px-10 md:py-8 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-3" style={{ borderColor: 'var(--border)', background: 'linear-gradient(to right, #f8fafc, white)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="hidden sm:flex" style={{ padding: '0.75rem', background: 'var(--primary)15', color: 'var(--primary)', borderRadius: '12px' }}>
                                {isEditing ? <Edit2 size={24} /> : <Eye size={24} />}
                            </div>
                            <div>
                                <h2 className="text-lg md:text-2xl font-bold m-0">
                                    {isEditing ? 'Editing' : 'Product'} <span className="gradient-text">Details</span>
                                </h2>
                                <p className="text-muted text-xs md:text-sm" style={{ margin: 0 }}>ID: {selectedProduct.id?.substring(0, 12)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 md:gap-3">
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary text-sm" style={{ padding: '0.6rem 1rem', borderRadius: '12px' }}>
                                    <Edit2 size={16} /> Edit
                                </button>
                            )}
                            <button onClick={() => { onClose(); setIsEditing(false); }} style={{ padding: '0.6rem', borderRadius: '12px', background: 'var(--surface)', color: 'var(--text-muted)' }}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 md:p-10">
                        {isEditing ? (
                            <form onSubmit={handleUpdateProduct}>
                                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 md:gap-8">
                                    <div className="flex flex-col gap-6">
                                        <div className="glass-card" style={{ padding: '1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Product Title</label>
                                                    <input type="text" required style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}
                                                        value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Description</label>
                                                    <textarea required rows="4" style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', resize: 'vertical' }}
                                                        value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Category</label>
                                                        <select required style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }} 
                                                            value={editData.category}
                                                            onChange={e => {
                                                                const newCat = e.target.value;
                                                                const newGst = categoryGstRates[newCat] || 18;
                                                                setEditData({ ...editData, category: newCat, gstPercent: newGst });
                                                                setSelectedSizes([]); setSelectedColors([]); setVariants({});
                                                                setSpecifications([]); setPricingType('same'); setSizePrices({});
                                                            }}>
                                                            <option value="">Select Category</option>
                                                            {SELLER_CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_CONFIG[cat]?.icon || '📦'} {cat}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Base Price (₹)</label>
                                                        <input type="number" required style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}
                                                            value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Discount Price (₹)</label>
                                                        <input type="number" style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}
                                                            value={editData.discountPrice} onChange={e => setEditData({ ...editData, discountPrice: e.target.value })} placeholder="Optional" />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Stock Qty</label>
                                                        <input type="number" required style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}
                                                            value={editData.stock} onChange={e => setEditData({ ...editData, stock: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                                                            GST Percent (%) <span style={{color: 'red'}}>*</span>
                                                            {!sellerHasGST && <span style={{fontSize: '0.7rem', color: '#64748b', marginLeft: '8px', fontWeight: 400}}>(Fixed by Admin)</span>}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            required 
                                                            min="0" 
                                                            max="100" 
                                                            style={{ 
                                                                width: '100%', 
                                                                padding: '0.875rem 1rem', 
                                                                border: '1.5px solid #e2e8f0', 
                                                                borderRadius: '12px',
                                                                background: !sellerHasGST ? '#f1f5f9' : 'white',
                                                                cursor: !sellerHasGST ? 'not-allowed' : 'text'
                                                            }}
                                                            readOnly={!sellerHasGST}
                                                            value={editData.gstPercent} 
                                                            onChange={e => sellerHasGST && setEditData({ ...editData, gstPercent: e.target.value })} 
                                                        />
                                                    </div>
                                                    {editData.category === 'Other' && (
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Custom Category</label>
                                                            <input type="text" required style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}
                                                                value={editData.customCategory} onChange={e => setEditData({ ...editData, customCategory: e.target.value })} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {config && (
                                            <VariantsEditor
                                                config={config} product={editData}
                                                selectedSizes={selectedSizes} toggleSize={toggleSize} customSizeInput={customSizeInput} setCustomSizeInput={setCustomSizeInput} addCustomSize={addCustomSize}
                                                pricingType={pricingType} setPricingType={setPricingType} sizePrices={sizePrices} setSizePrices={setSizePrices}
                                                selectedColors={selectedColors} toggleColor={toggleColor} customColorInput={customColorInput} setCustomColorInput={setCustomColorInput} addCustomColor={addCustomColor}
                                                variants={variants} toggleVariant={toggleVariant} customVariantInput={customVariantInput} setCustomVariantInput={setCustomVariantInput} addCustomVariant={addCustomVariant} updateVariantPrice={updateVariantPrice}
                                                specifications={specifications} showSpecInput={showSpecInput} setShowSpecInput={setShowSpecInput} newSpecKey={newSpecKey} setNewSpecKey={setNewSpecKey} newSpecVal={newSpecVal} setNewSpecVal={setNewSpecVal} addSpecification={addSpecification} addPresetSpec={addPresetSpec} updateSpecValue={updateSpecValue} removeSpec={removeSpec}
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <ImageUploader 
                                            product={editData} setProduct={setEditData} selectedColors={selectedColors}
                                            variants={variants} variantImages={variantImages} setVariantImages={setVariantImages}
                                        />
                                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-auto">
                                            <button type="submit" disabled={updateLoading} className="btn btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '12px' }}>
                                                {updateLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '12px' }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4 md:gap-12">
                                <div className="flex flex-col gap-4">
                                    <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                        <img src={selectedProduct.image} alt={selectedProduct.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Status:</p>
                                            <p style={{ fontWeight: 600, color: '#16a34a', margin: 0 }}>Active</p>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Views:</p>
                                            <p style={{ fontWeight: 600, margin: 0 }}>{selectedProduct.views || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#1e293b' }}>{selectedProduct.title}</h3>
                                        <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: '#EBF0FF', color: '#3B7CF1', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                            {selectedProduct.category}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                                        <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.2rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Price</label>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>₹{Number(selectedProduct.price).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.2rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Discounted</label>
                                            {selectedProduct.discountPrice ? (
                                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a', margin: 0 }}>₹{Number(selectedProduct.discountPrice).toLocaleString('en-IN')}</p>
                                            ) : (
                                                <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>None</p>
                                            )}
                                        </div>
                                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.2rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Stock</label>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedProduct.stock > 0 ? '#1e293b' : '#ef4444', margin: 0 }}>{selectedProduct.stock}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Description</label>
                                        <p style={{ color: '#334155', fontSize: '1rem', lineHeight: 1.6, margin: 0, padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', whiteSpace: 'pre-line' }}>{selectedProduct.description}</p>
                                    </div>

                                    {/* Active Configurations Display */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {selectedProduct.sizes?.length > 0 && (
                                            <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: '12px' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#3B7CF1', fontSize: '0.85rem' }}>Available Sizes</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {selectedProduct.sizes.map(size => (
                                                        <span key={size} style={{ padding: '0.4rem 0.85rem', borderRadius: '50px', background: '#ede9fe', color: '#6d28d9', fontSize: '0.85rem', fontWeight: 500 }}>
                                                            {size} {selectedProduct.pricingType === 'varied' && selectedProduct.sizePrices?.[size] && ` — ₹${Number(selectedProduct.sizePrices[size]).toLocaleString()}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedProduct.colors?.length > 0 && (
                                            <div style={{ background: '#fdf2f8', padding: '1rem', borderRadius: '12px' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#db2777', fontSize: '0.85rem' }}>Available Colors</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {selectedProduct.colors.map(color => {
                                                        const img = (selectedProduct.variantImages || {})[color];
                                                        const imagesArray = Array.isArray(img) ? img : (img ? [img] : []);
                                                        return (
                                                            <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                                                                {imagesArray.length > 0 && (
                                                                    <img src={imagesArray[0]} alt={color} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                                                                )}
                                                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#be185d' }}>{color}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Other Variants */}
                                        {Object.keys(variants).map(vKey => {
                                            if (!variants[vKey] || variants[vKey].length === 0) return null;
                                            return (
                                                <div key={vKey} style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#d97706', fontSize: '0.85rem', textTransform: 'capitalize' }}>{vKey.replace('_', ' ')}</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {variants[vKey].map((v, i) => (
                                                            <span key={i} style={{ padding: '0.4rem 0.85rem', borderRadius: '50px', background: '#fef3c7', color: '#92400e', fontSize: '0.85rem', fontWeight: 500 }}>
                                                                {v.label} {v.priceOffset ? <span style={{ fontWeight: 700 }}>{v.priceOffset > 0 ? `+₹${v.priceOffset}` : `-₹${Math.abs(v.priceOffset)}`}</span> : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        
                                        {/* Specifications */}
                                        {Object.keys(selectedProduct.specifications || {}).length > 0 && (
                                            <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#0284c7', fontSize: '0.85rem' }}>Specifications</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                                                        <div key={key} style={{ padding: '0.5rem', background: 'white', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{key}</span>
                                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{val}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}




