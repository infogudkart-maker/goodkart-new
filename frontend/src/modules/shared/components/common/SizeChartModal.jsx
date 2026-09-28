import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, CheckCircle2 } from 'lucide-react';

const SIZE_CHARTS = {
    "Fashion": {
        title: "Size & Measurement Guide",
        subtitle: "Find your ideal fit with our standard sizing guide",
        headers: ["Size", "Chest (in)", "Waist (in)", "Hips (in)", "Length (in)"],
        rows: [
            ["XS", "32-34", "26-28", "34-36", "26"],
            ["S", "36-38", "30-32", "38-40", "27"],
            ["M", "38-40", "32-34", "40-42", "28"],
            ["L", "40-42", "34-36", "42-44", "29"],
            ["XL", "42-44", "36-38", "44-46", "30"],
            ["XXL", "44-46", "38-40", "46-48", "31"]
        ],
        tips: [
            "Chest: Measure around the fullest part of your chest with tape horizontal.",
            "Waist: Measure around your natural waistline, keeping tape comfortably loose.",
            "Hips: Stand with feet together and measure around the fullest part of your hips.",
            "Between sizes? We recommend choosing the larger size for a relaxed, comfortable fit."
        ]
    },
    "Electronics": {
        title: "Dimensions & Specifications",
        subtitle: "Standard physical specifications and dimensions",
        headers: ["Component", "Width", "Height", "Depth", "Weight"],
        rows: [
            ["Main Body", "31.2 cm", "1.5 cm", "22.1 cm", "1.24 kg"],
            ["Display Diagonal", "34.5 cm (13.6 in)", "-", "-", "-"],
            ["Retail Box", "40 cm", "28 cm", "8 cm", "2.1 kg"]
        ],
        tips: [
            "Dimensions are measured at the widest points of the device.",
            "Weight may vary slightly depending on configuration and accessories."
        ]
    }
};

export default function SizeChartModal({ isOpen, onClose, category = "Fashion" }) {
    if (!isOpen) return null;

    const cat = (category || '').toLowerCase();
    const isFashion = !cat.includes('electr') && !cat.includes('laptop') && !cat.includes('phone') && !cat.includes('gadget');
    const chart = SIZE_CHARTS[isFashion ? "Fashion" : "Electronics"];

    const modalContent = (
        <AnimatePresence>
            <div 
                className="size-chart-overlay" 
                onClick={onClose} 
                style={{ 
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem'
                }}
            >
                <motion.div
                    className="size-chart-card"
                    initial={{ scale: 0.92, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 15 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={e => e.stopPropagation()}
                    style={{ 
                        width: '100%',
                        maxWidth: '640px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '20px',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: '#FAFCFF'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                backgroundColor: '#EFF6FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563EB'
                            }}>
                                <Ruler size={22} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                                    {chart.title}
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                                    {chart.subtitle}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            style={{
                                background: '#F1F5F9',
                                border: 'none',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Table Body */}
                    <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                        <div style={{ 
                            borderRadius: '12px', 
                            border: '1px solid #E2E8F0', 
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                                <thead style={{ backgroundColor: '#F8FAFC' }}>
                                    <tr>
                                        {chart.headers.map((h, i) => (
                                            <th 
                                                key={i} 
                                                style={{ 
                                                    padding: '0.75rem 1rem', 
                                                    color: '#334155', 
                                                    fontWeight: 600,
                                                    borderBottom: '1px solid #E2E8F0',
                                                    fontSize: '0.82rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em'
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {chart.rows.map((row, rowIndex) => (
                                        <tr 
                                            key={rowIndex} 
                                            style={{ 
                                                borderTop: '1px solid #F1F5F9',
                                                backgroundColor: rowIndex % 2 === 0 ? '#FFFFFF' : '#FAFCFF',
                                                transition: 'background 0.15s ease'
                                            }}
                                        >
                                            {row.map((cell, cellIndex) => (
                                                <td 
                                                    key={cellIndex} 
                                                    style={{ 
                                                        padding: '0.75rem 1rem', 
                                                        color: cellIndex === 0 ? '#0F172A' : '#475569',
                                                        fontWeight: cellIndex === 0 ? 700 : 400
                                                    }}
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Measuring Tips Card */}
                        <div style={{ 
                            marginTop: '1.25rem', 
                            backgroundColor: '#F8FAFC', 
                            border: '1px solid #E2E8F0',
                            padding: '1rem 1.25rem', 
                            borderRadius: '12px' 
                        }}>
                            <h4 style={{ 
                                margin: '0 0 0.5rem 0', 
                                fontSize: '0.88rem', 
                                fontWeight: 700, 
                                color: '#1E293B',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                <CheckCircle2 size={16} color="#2563EB" />
                                How to Measure Accurately
                            </h4>
                            <ul style={{ 
                                margin: 0, 
                                paddingLeft: '1.1rem', 
                                fontSize: '0.82rem', 
                                color: '#64748B',
                                lineHeight: '1.6' 
                            }}>
                                {chart.tips.map((tip, i) => (
                                    <li key={i} style={{ marginBottom: '0.2rem' }}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ 
                        padding: '1rem 1.5rem', 
                        borderTop: '1px solid #F1F5F9', 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        backgroundColor: '#FAFCFF'
                    }}>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                padding: '0.65rem 1.85rem', 
                                backgroundColor: '#2563EB',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
                        >
                            Got It
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}


