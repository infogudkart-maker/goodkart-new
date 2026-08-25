import { motion } from 'framer-motion';
import { Ruler, Palette, Cpu, Settings, CheckCircle, Plus, Trash2, X } from 'lucide-react';

const sty = {
    card: { background: 'white', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    sectionIcon: (color) => ({ padding: '0.5rem', background: `${color}15`, color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    label: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155' },
    input: { width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: 'white', transition: 'border-color 0.2s', outline: 'none' },
    chip: (active) => ({ padding: '0.5rem 1rem', borderRadius: '50px', border: active ? '2px solid var(--primary)' : '1.5px solid #e2e8f0', background: active ? 'var(--primary)' : 'white', color: active ? 'white' : '#475569', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }),
    chipRemove: { background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: '0.7rem' },
    addChipBtn: { padding: '0.5rem 1rem', borderRadius: '50px', border: '1.5px dashed #94a3b8', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' },
    priceInput: { width: '100%', padding: '0.7rem 0.7rem 0.7rem 1.8rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem' },
    dynamicSection: { background: '#f8fafc', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', marginTop: '1rem' },
    radioGroup: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
    radioOption: (active) => ({ padding: '0.75rem 1.25rem', borderRadius: '12px', border: active ? '2px solid var(--primary)' : '1.5px solid #e2e8f0', background: active ? 'var(--primary)08' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: active ? 600 : 400, color: active ? 'var(--primary)' : '#475569', transition: 'all 0.2s' }),
    specRow: { display: 'grid', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' },
    variantPriceRow: { display: 'grid', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' },
};

export default function VariantsEditor({
    config, product, 
    // Sizes
    selectedSizes, toggleSize, customSizeInput, setCustomSizeInput, addCustomSize,
    pricingType, setPricingType, sizePrices, setSizePrices,
    // Colors
    selectedColors, toggleColor, customColorInput, setCustomColorInput, addCustomColor,
    // Variants
    variants, toggleVariant, customVariantInput, setCustomVariantInput, addCustomVariant, updateVariantPrice,
    // Specs
    specifications, showSpecInput, setShowSpecInput, newSpecKey, setNewSpecKey, newSpecVal, setNewSpecVal,
    addSpecification, addPresetSpec, updateSpecValue, removeSpec
}) {
    if (!config) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6">

            {/* ── SIZES SECTION ── */}
            {config.hasSizes && config.defaultSizes && (
                <div style={sty.card} className="p-4 md:p-8">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#5BB8FF')}><Ruler size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0 }}>Size Options</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Select available sizes for this product</p>
                        </div>
                    </div>

                    {/* Size chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {(config.defaultSizes || []).map(size => (
                            <button key={size} type="button" style={sty.chip(selectedSizes.includes(size))}
                                onClick={() => toggleSize(size)}>
                                {selectedSizes.includes(size) && <CheckCircle size={14} />} {size}
                            </button>
                        ))}
                        {/* Show custom sizes that aren't in presets */}
                        {selectedSizes.filter(s => !config.defaultSizes.includes(s)).map(size => (
                            <button key={size} type="button" style={sty.chip(true)} onClick={() => toggleSize(size)}>
                                <CheckCircle size={14} /> {size}
                                <span style={sty.chipRemove}>×</span>
                            </button>
                        ))}
                    </div>

                    {/* Add custom size */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input type="text" placeholder="Custom size (e.g. XXXL, 42)" style={{ ...sty.input, flex: 1 }}
                            value={customSizeInput} onChange={e => setCustomSizeInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())} />
                        <button type="button" onClick={addCustomSize} style={sty.addChipBtn}>
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {/* Pricing type */}
                    {selectedSizes.length > 0 && (
                        <div style={sty.dynamicSection}>
                            <label style={{ ...sty.label, marginBottom: '0.75rem' }}>
                                💰 Is the price the same for all sizes?
                            </label>
                            <div style={sty.radioGroup}>
                                <div style={sty.radioOption(pricingType === 'same')} onClick={() => setPricingType('same')}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${pricingType === 'same' ? 'var(--primary)' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {pricingType === 'same' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                    </div>
                                    Same price for all sizes
                                </div>
                                <div style={sty.radioOption(pricingType === 'varied')} onClick={() => setPricingType('varied')}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${pricingType === 'varied' ? 'var(--primary)' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {pricingType === 'varied' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                    </div>
                                    Different price per size
                                </div>
                            </div>

                            {/* Per-size prices */}
                            {pricingType === 'varied' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    style={{ marginTop: '1rem' }}>
                                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                        Set individual prices for each size:
                                    </p>
                                    {selectedSizes.map(size => (
                                        <div key={size} style={sty.variantPriceRow} className="grid-cols-[1fr_2fr] sm:grid-cols-2">
                                            <span style={{ fontWeight: 600, color: '#334155' }}>{size}</span>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold' }}>₹</span>
                                                <input type="number" placeholder={product.price || '0'} style={sty.priceInput}
                                                    value={sizePrices[size] || ''}
                                                    onChange={e => setSizePrices({ ...sizePrices, [size]: e.target.value })} />
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── COLORS SECTION ── */}
            {config.hasColors && (
                <div style={sty.card} className="p-4 md:p-8">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#ec4899')}><Palette size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0 }}>Color Options</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Select available colors</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {(config.colorPresets || []).map(color => (
                            <button key={color} type="button" style={sty.chip(selectedColors.includes(color))}
                                onClick={() => toggleColor(color)}>
                                {selectedColors.includes(color) && <CheckCircle size={14} />} {color}
                            </button>
                        ))}
                        {selectedColors.filter(c => !(config.colorPresets || []).includes(c)).map(color => (
                            <button key={color} type="button" style={sty.chip(true)} onClick={() => toggleColor(color)}>
                                <CheckCircle size={14} /> {color}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" placeholder="Custom color (e.g. Pastel Pink)" style={{ ...sty.input, flex: 1 }}
                            value={customColorInput} onChange={e => setCustomColorInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomColor())} />
                        <button type="button" onClick={addCustomColor} style={sty.addChipBtn}>
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>
            )}

            {/* ── VARIANTS SECTION (Electronics, Food) ── */}
            {config.hasVariants && config.variantTypes?.map(vType => (
                <div key={vType.key} style={sty.card} className="p-4 md:p-8">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#f59e0b')}><Cpu size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0 }}>{vType.label} Variants</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Select available {vType.label.toLowerCase()} options & set price offsets</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {(vType.presets || []).map(preset => {
                            const isActive = (variants[vType.key] || []).find(v => v.label === preset);
                            return (
                                <button key={preset} type="button" style={sty.chip(!!isActive)}
                                    onClick={() => toggleVariant(vType.key, preset)}>
                                    {isActive && <CheckCircle size={14} />} {preset}
                                </button>
                            );
                        })}
                        {(variants[vType.key] || []).filter(v => !(vType.presets || []).includes(v.label)).map(v => (
                            <button key={v.label} type="button" style={sty.chip(true)}
                                onClick={() => toggleVariant(vType.key, v.label)}>
                                <CheckCircle size={14} /> {v.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input type="text" placeholder={`Custom ${vType.label.toLowerCase()}`} style={{ ...sty.input, flex: 1 }}
                            value={customVariantInput[vType.key] || ''}
                            onChange={e => setCustomVariantInput({ ...customVariantInput, [vType.key]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomVariant(vType.key))} />
                        <button type="button" onClick={() => addCustomVariant(vType.key)} style={sty.addChipBtn}>
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {/* Variant pricing */}
                    {(variants[vType.key] || []).length > 0 && (
                        <div style={sty.dynamicSection}>
                            <label style={{ ...sty.label, marginBottom: '0.5rem' }}>💰 Price offsets from base price</label>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                Use + for additional cost, - for discount, 0 for same as base price
                            </p>
                            {(variants[vType.key] || []).map(v => (
                                <div key={v.label} style={sty.variantPriceRow} className="grid-cols-[1fr_2fr] sm:grid-cols-2">
                                    <span style={{ fontWeight: 600, color: '#334155' }}>{v.label}</span>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>+₹</span>
                                        <input type="number" placeholder="0" style={{ ...sty.priceInput, paddingLeft: '2.2rem' }}
                                            value={v.priceOffset || ''}
                                            onChange={e => updateVariantPrice(vType.key, v.label, e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* ── SPECIFICATIONS SECTION ── */}
            {config.hasSpecifications && (
                <div style={sty.card} className="p-4 md:p-8">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#0ea5e9')}><Settings size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0 }}>Specifications</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Add product specs for customer reference</p>
                        </div>
                    </div>

                    {/* Quick-add preset specs */}
                    {config.specPresets && config.specPresets.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Quick add:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {config.specPresets.filter(sp => !specifications.find(s => s.key === sp)).map(preset => (
                                    <button key={preset} type="button" style={sty.addChipBtn} onClick={() => addPresetSpec(preset)}>
                                        <Plus size={12} /> {preset}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Existing specs */}
                    {specifications.map((spec, i) => (
                        <div key={i} style={sty.specRow} className="grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto]">
                            <input type="text" value={spec.key} readOnly
                                style={{ ...sty.input, background: '#f1f5f9', fontWeight: 600 }} />
                            <input type="text" placeholder="Enter value..." style={sty.input}
                                value={spec.value} onChange={e => updateSpecValue(i, e.target.value)} />
                            <button type="button" onClick={() => removeSpec(i)}
                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {/* Add custom spec */}
                    {showSpecInput ? (
                        <div style={sty.specRow} className="grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] mt-2">
                            <input type="text" placeholder="Spec name" style={sty.input}
                                value={newSpecKey} onChange={e => setNewSpecKey(e.target.value)} />
                            <input type="text" placeholder="Value" style={sty.input}
                                value={newSpecVal} onChange={e => setNewSpecVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecification())} />
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button type="button" onClick={addSpecification}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer' }}>
                                    <CheckCircle size={16} />
                                </button>
                                <button type="button" onClick={() => setShowSpecInput(false)}
                                    style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer' }}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setShowSpecInput(true)}
                            style={{ ...sty.addChipBtn, marginTop: '0.5rem' }}>
                            <Plus size={14} /> Add Custom Specification
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}




