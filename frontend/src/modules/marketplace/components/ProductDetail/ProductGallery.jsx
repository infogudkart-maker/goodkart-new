import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * ProductGallery
 *
 * Logic:
 * - If NO color variants exist: Show angle thumbnails from mainImages
 * - If color variants exist: 
 *   - Show color thumbnails at bottom
 *   - When a color is selected, show that color's images as angle thumbnails
 *   - Use first color's first image as default main image
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
}) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [showZoomPreview, setShowZoomPreview] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [showAllThumbnails, setShowAllThumbnails] = useState(false);

    const hasColorVariants = Object.keys(variantImageMap || {}).length > 0;
    
    // Get the current color's images for angle thumbnails
    const getCurrentColorImages = () => {
        if (!hasColorVariants) {
            return mainImages?.length > 0 ? mainImages : ['/placeholder-image.jpg'];
        }
        
        // If color variants exist, get images for selected color
        const colorKey = selectedColor 
            ? (typeof selectedColor === 'object' ? selectedColor.name : selectedColor)
            : Object.keys(variantImages || {})[0]; // Default to first color
        
        if (colorKey && variantImages?.[colorKey]) {
            const imgs = Array.isArray(variantImages[colorKey]) 
                ? variantImages[colorKey] 
                : [variantImages[colorKey]];
            return imgs.filter(Boolean);
        }
        
        return ['/placeholder-image.jpg'];
    };

    const currentColorImages = getCurrentColorImages();
    const displayImage = currentColorImages[activeImageIndex] || currentColorImages[0];

    const nextImage = () => {
        setActiveImageIndex((prev) => (prev + 1) % currentColorImages.length);
    };
    
    const prevImage = () => {
        setActiveImageIndex((prev) => (prev - 1 + currentColorImages.length) % currentColorImages.length);
    };

    const variantEntries = Object.entries(variantImageMap || {});

    return (
        <div className="pd-media">
            <div className="media-container">
                <div
                    className="media-stage glass-card"
                    onMouseMove={(e) => {
                        if (!showZoomPreview) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setZoomPosition({ x, y });
                    }}
                    onMouseEnter={() => setShowZoomPreview(true)}
                    onMouseLeave={() => setShowZoomPreview(false)}
                    onClick={() => setIsZoomed(true)}
                >
                    <motion.img
                        key={displayImage}
                        src={displayImage}
                        alt={product?.name || 'Product'}
                        className="product-main-image"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                    {currentColorImages.length > 1 && (
                        <>
                            {/* Thumbnail previews - positioned from top */}
                            <div className="angle-thumbnails-container">
                                <div className="angle-thumbnails">
                                    {currentColorImages.slice(0, 3).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`angle-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveImageIndex(idx);
                                            }}
                                            onMouseEnter={(e) => e.stopPropagation()}
                                        >
                                            <img src={img} alt={`Angle ${idx + 1}`} />
                                        </div>
                                    ))}
                                    {currentColorImages.length > 3 && (
                                        <div 
                                            className="angle-thumb more-indicator"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAllThumbnails(true);
                                            }}
                                            onMouseEnter={(e) => e.stopPropagation()}
                                        >
                                            <span>{currentColorImages.length - 3}+</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Navigation arrows - independently positioned at bottom */}
                            <div className="arrow-controls-fixed">
                                <button
                                    className="ctrl-btn-bottom"
                                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                    onMouseEnter={(e) => e.stopPropagation()}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    className="ctrl-btn-bottom"
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                    onMouseEnter={(e) => e.stopPropagation()}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Zoom Preview on hover */}
                <AnimatePresence>
                    {showZoomPreview && (
                        <motion.div
                            className="zoom-preview-panel-right"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div
                                className="zoom-preview-image"
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

            {/* Zoom Modal */}
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
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={displayImage} alt="Full size" />
                            <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* All Thumbnails Modal */}
            <AnimatePresence>
                {showAllThumbnails && (
                    <motion.div
                        className="thumbnails-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAllThumbnails(false)}
                    >
                        <motion.div
                            className="thumbnails-modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="close-thumbnails-btn" onClick={() => setShowAllThumbnails(false)}>
                                <X size={24} />
                            </button>
                            <div className="all-thumbnails-grid">
                                {currentColorImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`thumbnail-grid-item ${activeImageIndex === idx ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveImageIndex(idx);
                                            setShowAllThumbnails(false);
                                        }}
                                    >
                                        <img src={img} alt={`View ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Thumbnail strip — variant images only (shown only when color variants exist) */}
            {hasColorVariants && variantEntries.length > 0 && (
                <div className="thumbnail-track">
                    {variantEntries.map(([colorKey, imgUrl]) => {
                        const isActive = selectedColor && (typeof selectedColor === 'object' ? selectedColor.name : selectedColor) === colorKey;
                        return (
                            <div
                                key={colorKey}
                                className={`thumb-item ${isActive ? 'active' : ''}`}
                                title={colorKey}
                                onClick={() => {
                                    setActiveImageIndex(0); // Reset to first image of new color
                                    if (setSelectedColor && product?.colors) {
                                        const match = product.colors.find(c =>
                                            (typeof c === 'object' ? c.name : c) === colorKey
                                        );
                                        if (match) setSelectedColor(match);
                                    }
                                }}
                            >
                                <img src={imgUrl} alt={colorKey} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

