import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Upload, X, AlertOctagon, ShieldCheck, Check } from 'lucide-react';
import Rating from '@/modules/shared/components/common/Rating';
import { authFetch } from '@/modules/shared/utils/api';
import { auth } from '@/modules/shared/config/firebase';
import { clearProductReviewCache } from '@/modules/shared/utils/reviewUtils';

const ExpandableText = ({ text, maxLength = 180 }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text || text.length <= maxLength) {
        return <p className="rb">{text}</p>;
    }

    return (
        <p className="rb">
            {isExpanded ? text : `${text.slice(0, maxLength)}...`}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="show-more-btn-text"
            >
                {isExpanded ? 'Show less' : 'Show more'}
            </button>
        </p>
    );
};

export default function ProductReviews({
    productId,
    product,
    reviews,
    reviewStats,
    isEligibleForReview,
    setIsEligibleForReview,
    eligibleOrder,
    setEligibleOrder
}) {
    const navigate = useNavigate();
    const [reviewsLimit, setReviewsLimit] = useState(2);
    const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '', images: [] });
    const [uploading, setUploading] = useState(false);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            window.dispatchEvent(new Event('openLoginModal'));
            return;
        }

        if (!isEligibleForReview || !eligibleOrder) {
            alert('You can only review products after delivery.');
            return;
        }

        try {
            const res = await authFetch(`/reviews`, {
                method: 'POST',
                body: JSON.stringify({
                    productId: productId,
                    rating: newReview.rating,
                    title: newReview.title,
                    body: newReview.body,
                    images: newReview.images,
                    orderId: eligibleOrder.orderId
                })
            });

            const data = await res.json();

            if (data.success) {
                setNewReview({ rating: 5, title: '', body: '', images: [] });
                setIsEligibleForReview(false);
                setEligibleOrder(null);

                clearProductReviewCache(productId);
                
                // Clear all product caches to show updated ratings everywhere
                try {
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('fs_cache_')) {
                            localStorage.removeItem(key);
                        }
                    });
                } catch (e) {
                    console.error('Error clearing caches:', e);
                }

                // Dispatch event to update reviews
                window.dispatchEvent(new CustomEvent('reviewsUpdate', {
                    detail: { productId, review: data.review }
                }));

                alert('✅ Review submitted successfully! The page will refresh to show your review.');
                
                // Reload page to show updated reviews
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                alert('❌ Failed to submit review: ' + data.message);
            }
        } catch (err) {
            alert('❌ Connection error. Failed to submit review.');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (newReview.images.length >= 4) {
            alert('Maximum 4 images allowed');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await authFetch('/auth/upload-image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setNewReview(prev => ({ ...prev, images: [...prev.images, data.url] }));
            }
        } catch (err) {
            console.error('Error uploading image:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            {/* Description */}
            <section className="pd-desc-block">
                <div className="block-header">
                    <h2>Description</h2>
                </div>
                <div className="desc-content-modern">
                    <ExpandableText text={product?.description} maxLength={150} />
                </div>
            </section>

            {/* Reviews */}
            <section className="pd-reviews-block">
                <div className="block-header">
                    <h2>Customer Reviews</h2>
                    <div className="header-stats">
                        <Rating
                            averageRating={reviewStats.average || 0}
                            totalReviews={reviewStats.total || 0}
                            size={16}
                            showCount={true}
                            className="reviews-header-rating"
                        />
                    </div>
                </div>

                {/* Review Input Box */}
                <div className="review-write-box glass-card">
                    <div className="write-rev-header">
                        <h3>Write a Review</h3>
                        {!isEligibleForReview && (
                            <div className="review-eligibility-badge">
                                <AlertOctagon size={14} />
                                <span>Available only after delivery</span>
                            </div>
                        )}
                    </div>

                    {isEligibleForReview ? (
                        <form onSubmit={handleReviewSubmit} className="rev-inline-form">
                            <div className="star-rating-input">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        className={newReview.rating >= num ? 'active' : ''}
                                        onClick={() => setNewReview(prev => ({ ...prev, rating: num }))}
                                    >
                                        <Star size={24} fill={newReview.rating >= num ? "#FFB800" : "none"} color="#FFB800" />
                                    </button>
                                ))}
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Headline for your review"
                                    value={newReview.title}
                                    onChange={e => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                                <textarea
                                    placeholder="What did you like or dislike? How was the quality?"
                                    value={newReview.body}
                                    onChange={e => setNewReview(prev => ({ ...prev, body: e.target.value }))}
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="rev-upload-section">
                                <div className="upload-meta">
                                    <label className="image-upload-trigger">
                                        <Upload size={18} />
                                        <span>Add Photos</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
                                    </label>
                                    <span className="upload-hint">Max 4 photos</span>
                                </div>
                                <div className="rev-preview-grid">
                                    {newReview.images.map((img, idx) => (
                                        <div key={idx} className="preview-item">
                                            <img src={img} alt="" />
                                            <button type="button" onClick={() => setNewReview(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}><X size={12} /></button>
                                        </div>
                                    ))}
                                    {uploading && <div className="rev-loader"></div>}
                                </div>
                            </div>

                            <button type="submit" className="rev-submit-btn">Post Review</button>
                        </form>
                    ) : (
                        <div className="not-eligible-msg">
                            <ShieldCheck size={40} className="text-muted mb-3" />
                            <h4>Have you bought this item?</h4>
                            <p>You can only write a review for this product after it has been delivered to you. This helps us maintain authentic, high-quality feedback from our community.</p>
                            <button className="btn-secondary mt-3" onClick={() => navigate('/consumer/dashboard')}>View My Orders</button>
                        </div>
                    )}
                </div>

                <div className="rev-list-modern">
                    {reviews.length > 0 ? (
                        <>
                            {reviews.slice(0, reviewsLimit).map((rev, i) => (
                                <div key={rev.id || i} className="rev-card-vertical">
                                    <div className="rev-top">
                                        <div className="rev-user-id">
                                            <div className="u-circ">{(rev.customerName || rev.author || 'A')?.charAt(0)}</div>
                                            <div className="u-meta">
                                                <div className="flex items-center gap-2">
                                                    <span className="un">{rev.customerName || rev.author || 'Anonymous'}</span>
                                                    {rev.verified && (
                                                        <span className="verified-badge" title="Verified Purchase">
                                                            <Check size={12} /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="ud">
                                                    {rev.createdAt ? (
                                                        rev.createdAt._seconds
                                                            ? new Date(rev.createdAt._seconds * 1000).toLocaleDateString()
                                                            : (rev.createdAt.toDate ? rev.createdAt.toDate().toLocaleDateString() : new Date(rev.createdAt).toLocaleDateString())
                                                    ) : 'Verified Purchase'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="rs">
                                            {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < rev.rating ? "#FFB800" : "none"} color="#FFB800" />)}
                                        </div>
                                    </div>
                                    <h4 className="rt">{rev.title}</h4>
                                    <ExpandableText text={rev.body} />
                                    {rev.images && rev.images.length > 0 && (
                                        <div className="ri">
                                            {rev.images.map((img, idx) => <img key={idx} src={img} alt="Review" onClick={() => window.open(img)} />)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="reviews-expand-actions">
                                {reviews.length > reviewsLimit && (
                                    <button className="show-more-reviews-blue-btn" onClick={() => setReviewsLimit(prev => prev + 5)}>
                                        Show More Reviews
                                    </button>
                                )}
                                {reviewsLimit > 2 && (
                                    <button className="show-more-reviews-blue-btn show-less" onClick={() => setReviewsLimit(2)}>
                                        Show Less Reviews
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-rev-yet">
                            <p>No reviews yet. Share your experience with others!</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

