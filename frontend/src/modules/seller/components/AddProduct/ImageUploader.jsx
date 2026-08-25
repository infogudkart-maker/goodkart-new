import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Trash2, Upload, Loader, Plus } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

const sty = {
    card: { background: 'white', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    sectionIcon: (color) => ({ padding: '0.5rem', background: `${color}15`, color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
};

export default function ImageUploader({ 
    product, 
    setProduct, 
    selectedColors, 
    variants, 
    variantImages, 
    setVariantImages 
}) {
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingLabel, setUploadingLabel] = useState(null);

    const allVariantLabels = [
        ...selectedColors,
        ...Object.values(variants).flat().map(v => v.label)
    ];

    const hasColorVariants = allVariantLabels.length > 0;

    // Automatically set main image from first color's first image
    const autoSetMainImage = () => {
        if (hasColorVariants && allVariantLabels.length > 0) {
            const firstColorLabel = allVariantLabels[0];
            const firstColorImages = variantImages[firstColorLabel];
            if (firstColorImages) {
                const firstImage = Array.isArray(firstColorImages) ? firstColorImages[0] : firstColorImages;
                if (firstImage && product.image !== firstImage) {
                    setProduct(prev => ({ ...prev, image: firstImage }));
                }
            }
        }
    };

    // Auto-update main image when variant images change
    React.useEffect(() => {
        autoSetMainImage();
    }, [variantImages, allVariantLabels.length]);

    return (
        <div className="flex flex-col gap-6">
            {/* Main Product Image Upload - Disabled when colors are selected */}
            {!hasColorVariants && (
                <div style={sty.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#5BB8FF')}><ImageIcon size={20} /></div>
                        <h3 style={{ margin: 0 }}>Product Media</h3>
                    </div>
                    <div style={{
                        border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '2rem', textAlign: 'center',
                        background: '#fafbfc', minHeight: '200px', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                    }}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {product.image && (
                                <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
                                    <img src={product.image} alt="Main Preview" style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain' }} />
                                    <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Main Image</span>
                                    <button type="button" onClick={() => {
                                        const newImages = [...(product.images || [])];
                                        if (newImages.length > 0) {
                                            setProduct({ ...product, image: newImages[0], images: newImages.slice(1) });
                                        } else {
                                            setProduct({ ...product, image: '' });
                                        }
                                    }}
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                            
                            {(product.images && product.images.length > 0) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
                                    {product.images.map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                            <img src={img} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                            <button type="button" onClick={() => {
                                                const newImages = [...product.images];
                                                newImages.splice(idx, 1);
                                                setProduct({ ...product, images: newImages });
                                            }} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                                                <Trash2 size={12} />
                                            </button>
                                            <button type="button" onClick={() => {
                                                const newImages = [...product.images];
                                                newImages[idx] = product.image;
                                                setProduct({ ...product, image: img, images: newImages });
                                            }} title="Set as Main" style={{ position: 'absolute', bottom: '-6px', left: '-6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                                                <ImageIcon size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="flex flex-col items-center gap-3" style={{ cursor: 'pointer', width: '100%', padding: '1rem', border: '2px dashed #cbd5e1', borderRadius: '12px', background: 'white', transition: 'all 0.2s' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    {uploadingMain ? <Loader className="animate-spin" style={{ color: 'var(--primary)' }} /> : <Upload style={{ color: '#64748b' }} />}
                                </div>
                                <div style={{ width: '100%', textAlign: 'center' }}>
                                    <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        {uploadingMain ? "Uploading..." : (product.image ? "Upload Additional Angles" : "Click to Upload Main Image")}
                                    </p>
                                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>Supports multiple image selection</p>
                                    <input type="file" accept="image/*" multiple hidden disabled={uploadingMain}
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files);
                                            if (files.length === 0) return;
                                            setUploadingMain(true);
                                            try {
                                                const newUrls = [];
                                                for (let file of files) {
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    const response = await authFetch('/auth/upload-image', { method: 'POST', body: formData });
                                                    const data = await response.json();
                                                    if (data.success) { newUrls.push(data.url); }
                                                    else { alert('Upload failed: ' + data.message); }
                                                }
                                                if (newUrls.length > 0) {
                                                    if (!product.image) {
                                                        setProduct(p => ({ ...p, image: newUrls[0], images: [...(p.images || []), ...newUrls.slice(1)] }));
                                                    } else {
                                                        setProduct(p => ({ ...p, images: [...(p.images || []), ...newUrls] }));
                                                    }
                                                }
                                            } catch (err) { console.error(err); alert('Upload error'); }
                                            finally { setUploadingMain(false); }
                                        }} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Info message when colors are selected */}
            {hasColorVariants && (
                <div style={{
                    ...sty.card,
                    background: 'linear-gradient(135deg, #EBF0FF 0%, #f8fafc 100%)',
                    border: '2px solid #3B7CF1',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={sty.sectionIcon('#3B7CF1')}><ImageIcon size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0, color: '#3B7CF1', fontSize: '1rem' }}>Color Variants Detected</h3>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                                Main image upload is disabled. The first image from your first color variant will be used as the main product image automatically.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Variant Images Upload */}
            {allVariantLabels.length > 0 && (
                <div style={sty.card} className="p-4 md:p-8">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#3b82f6')}><ImageIcon size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0 }}>Variant Images</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>(Optional) Upload multiple images for specific colors or variants. One is mandatory if you choose to add images.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {allVariantLabels.map(label => {
                            const images = Array.isArray(variantImages[label]) ? variantImages[label] : (variantImages[label] ? [variantImages[label]] : []);
                            return (
                                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>{label}</span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: uploadingLabel === label ? 'not-allowed' : 'pointer', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, opacity: uploadingLabel === label ? 0.7 : 1 }}>
                                            {uploadingLabel === label ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                                            {uploadingLabel === label ? 'Uploading...' : 'Add Images'}
                                            <input type="file" accept="image/*" multiple hidden disabled={uploadingLabel === label}
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files);
                                                    if (files.length === 0) return;
                                                    setUploadingLabel(label);
                                                    try {
                                                        const newUrls = [];
                                                        for (let file of files) {
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            const response = await authFetch('/auth/upload-image', { method: 'POST', body: formData });
                                                            const data = await response.json();
                                                            if (data.success) { newUrls.push(data.url); }
                                                        }
                                                        if (newUrls.length > 0) {
                                                            setVariantImages(prev => {
                                                                const existing = Array.isArray(prev[label]) ? prev[label] : (prev[label] ? [prev[label]] : []);
                                                                return { ...prev, [label]: [...existing, ...newUrls] };
                                                            });
                                                        }
                                                    } catch (err) { console.error(err); alert('Upload error'); }
                                                    finally { setUploadingLabel(null); }
                                                }} />
                                        </label>
                                    </div>
                                    {images.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {images.map((imgSrc, idx) => (
                                                <div key={idx} style={{ position: 'relative' }}>
                                                    <img src={imgSrc} alt={`${label}-${idx}`} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                                    {idx === 0 && <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px' }}>Main</span>}
                                                    <button type="button" onClick={() => {
                                                        setVariantImages(prev => {
                                                            const currentArr = Array.isArray(prev[label]) ? [...prev[label]] : [...[prev[label]]];
                                                            currentArr.splice(idx, 1);
                                                            const newState = { ...prev };
                                                            if (currentArr.length === 0) delete newState[label];
                                                            else newState[label] = currentArr;
                                                            return newState;
                                                        });
                                                    }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '0.2rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}



