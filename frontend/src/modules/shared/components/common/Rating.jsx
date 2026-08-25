import React from 'react';
import { Star } from 'lucide-react';

/**
 * Dynamic Rating Component
 * 
 * Renders stars dynamically based on average rating
 * and displays review count with proper formatting
 */
const Rating = ({ 
    averageRating = 0, 
    totalReviews = 0, 
    size = 16, 
    showCount = true, 
    className = '',
    showNoReviewsText = true 
}) => {
    // Calculate star display
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const renderStars = () => {
        const stars = [];
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Star 
                    key={`full-${i}`} 
                    size={size} 
                    fill="#FFB800" 
                    color="#FFB800"
                />
            );
        }
        
        // Half star
        if (hasHalfStar) {
            stars.push(
                <Star 
                    key="half" 
                    size={size} 
                    fill="#FFB800" 
                    color="#FFB800"
                    style={{ opacity: 0.5 }}
                />
            );
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Star 
                    key={`empty-${i}`} 
                    size={size} 
                    fill="none" 
                    color="#FFB800"
                />
            );
        }
        
        return stars;
    };

    // Format display text - Amazon style
    const getDisplayText = () => {
        if (totalReviews === 0 && showNoReviewsText) {
            return <span style={{ fontSize: '0.75rem', color: '#565959' }}>No reviews yet</span>;
        }
        
        if (totalReviews === 0) {
            return "";
        }
        
        return <span style={{ fontSize: '0.75rem', color: '#007185', fontWeight: 400 }}>({totalReviews.toLocaleString()})</span>;
    };

    return (
        <div className={`rating-component flex flex-row items-center gap-1 ${className}`}>
            <div className="rating-stars flex flex-row items-center" style={{ gap: '2px' }}>
                {renderStars()}
            </div>
            {showCount && (
                <span className="rating-text" style={{ marginLeft: '4px' }}>
                    {getDisplayText()}
                </span>
            )}
        </div>
    );
};

export default Rating;

