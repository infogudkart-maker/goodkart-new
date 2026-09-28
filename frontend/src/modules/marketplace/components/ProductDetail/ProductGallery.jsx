import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Share2 } from 'lucide-react';

/**
 * ProductGallery
 *
 * Modern luxury presentation:
 * - Minimalist stage with side navigation arrows
 * - Pagination dots at the bottom
 * - Floating share icon at bottom right
 * - In-place hover zoom & fullscreen click modal
 */
export default function ProductGallery({
    product,
    mainImages,
    variantImageMap,
    variantImages,
    variantImageUrl,
    setVariantImageUrl,
    activeImageIndex,
    setActiveImageIndex,
    selectedColor,
    setSelectedColor,
    handleShare
}) {
    const [isZoomed, setIsZoomed] = useState(false);

    const hasColorVariants = Object.keys(variantImageMap || {}).length > 0;
    
    // Get the current color's images for gallery
    const getCurrentColorImages = () => {
        if (!hasColorVariants) {
            return mainImages?.length > 0 ? mainImages : ['/placeholder-image.jpg'];
        }
        
        const colorKey = selectedColor 
            ? (typeof selectedColor === 'object' ? selectedColor.name : selectedColor)
            : Object.keys(variantImages || {})[0];
        
        if (colorKey && variantImages?.[colorKey]) {
            const imgs = Array.isArray(variantImages[colorKey]) 
                ? variantImages[colorKey] 
                : [variantImages[colorKey]];
            return imgs.filter(Boolean);
        }
        
        return mainImages?.length > 0 ? mainImages : ['/placeholder-image.jpg'];
    };

    const currentColorImages = getCurrentColorImages();
    const displayImage = currentColorImages[activeImageIndex] || currentColorImages[0] || '/placeholder-image.jpg';

    const nextImage = () => {
        setActiveImageIndex((prev) => (prev + 1) % currentColorImages.length);
    };
    
    const prevImage = () => {
        setActiveImageIndex((prev) => (prev - 1 + currentColorImages.length) % currentColorImages.length);
    };

    const [showZoomPreview, setShowZoomPreview] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        });
    };

    return (
        <div className="pd-luxury-gallery">
            <div className="gallery-main-stage">
                <div
                    className="gallery-image-wrapper"
                    onClick={() => setIsZoomed(true)}
                >
                    <motion.img
                        key={displayImage}
                        src={displayImage}
                        alt={product?.name || 'Product'}
                        className="gallery-hero-img"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setShowZoomPreview(true)}
                        onMouseLeave={() => setShowZoomPreview(false)}
                    />

                    {/* Side navigation arrows */}
                    {currentColorImages.length > 1 && (
                        <>
                            <button
                                className="gallery-nav-arrow arrow-left"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                aria-label="Previous Image"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <button
                                className="gallery-nav-arrow arrow-right"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                aria-label="Next Image"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </>
                    )}

                    {/* Floating Share Button at bottom right */}
                    {handleShare && (
                        <button
                            className="gallery-share-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                            }}
                            title="Share this product"
                            aria-label="Share"
                        >
                            <Share2 size={18} />
                        </button>
                    )}
                </div>

                {/* Dot Pagination indicators */}
                {currentColorImages.length > 1 && (
                    <div className="gallery-pagination-dots">
                        {currentColorImages.map((_, idx) => (
                            <button
                                key={idx}
                                className={`pagination-dot ${activeImageIndex === idx ? 'active' : ''}`}
                                onClick={() => setActiveImageIndex(idx)}
                                aria-label={`View image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Right-side Zoom Preview Panel on hover */}
                <AnimatePresence>
                    {showZoomPreview && (
                        <motion.div
                            className="luxury-zoom-panel"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div
                                className="luxury-zoom-bg"
                                style={{
                                    backgroundImage: `url(${displayImage})`,
                                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    backgroundSize: '250%'
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Zoom Modal on click */}
            <AnimatePresence>
                {isZoomed && (
                    <motion.div
                        className="zoom-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomed(false)}
                    >
                        <motion.div
                            className="zoom-modal-content"
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={displayImage} alt="Full resolution view" />
                            <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


