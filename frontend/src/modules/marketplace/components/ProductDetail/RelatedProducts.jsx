import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';

export default function RelatedProducts({
    product,
    productId,
    seller,
    fbtProducts,
    fbtSelections,
    toggleFbt,
    fbtTotalPrice,
    fbtTotalCount,
    similarProducts,
    recentlyViewed
}) {
    const navigate = useNavigate();

    return (
        <>
            {/* About the Seller */}
            {seller && (
                <div className="about-seller-section">
                    <div className="block-header">
                        <h2>About the Seller</h2>
                    </div>
                    <div className="seller-card glass-card">
                        <div className="seller-main-info">
                            <div className="seller-avatar">
                                {seller.shopName?.charAt(0) || 'S'}
                            </div>
                            <div className="seller-text">
                                <h3 className="shop-name">{seller.shopName}</h3>
                                <div className="seller-badges">
                                    <span className="badge-item verified">
                                        <Shield size={14} fill="#22c55e" color="#22c55e" />
                                        Verified Seller
                                    </span>
                                    <span className="badge-item category">{seller.category}</span>
                                </div>
                            </div>
                        </div>

                        <div className="seller-details-grid">
                            <div className="detail-item">
                                <span className="label">Seller Name</span>
                                <span className="value">{seller.name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Company</span>
                                <span className="value">{seller.companyName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Location</span>
                                <span className="value">{seller.city}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Member Since</span>
                                <span className="value">
                                    {(() => {
                                        if (!seller.joinedAt) return '2026';
                                        const d = seller.joinedAt instanceof Date ? seller.joinedAt : new Date(seller.joinedAt);
                                        return isNaN(d) ? '2026' : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Frequently Bought Together */}
            {fbtProducts.length > 0 ? (
                <div className="fbt-section">
                    <h2>Frequently Bought Together</h2>
                    <div className="fbt-container glass-card">
                        <div className="fbt-visual">
                            {fbtProducts.map((p, i) => (
                                <div key={i} className="fbt-item-wrapper">
                                    <div className={`fbt-img-card ${fbtSelections[i] ? 'selected' : ''}`}>
                                        <img src={p.image} alt={p.name} />
                                        <input type="checkbox" checked={fbtSelections[i]} onChange={() => toggleFbt(i)} />
                                    </div>
                                    {i < fbtProducts.length - 1 && <span className="plus">+</span>}
                                </div>
                            ))}
                        </div>
                        <div className="fbt-details">
                            {fbtProducts.map((p, i) => (
                                <div key={i} className={`fbt-row ${fbtSelections[i] ? '' : 'disabled'}`}>
                                    <div className="fbt-info">
                                        <span className="p-name">{p.name}</span>
                                        <div className="rating">
                                            <span className="no-rating">No reviews</span>
                                        </div>
                                    </div>
                                    <div className="p-price">
                                        <PriceDisplay product={p} size="xs" showGSTIndicator={false} />
                                    </div>
                                </div>
                            ))}
                            <div className="fbt-total-row">
                                <div className="total-meta">
                                    <span>Total price for {fbtTotalCount} items</span>
                                    <span className="total-price">₹{fbtTotalPrice.toLocaleString()}</span>
                                </div>
                                <button className="fbt-add-btn">Add {fbtTotalCount} to Cart</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="fbt-section">
                    <h2>Frequently Bought Together</h2>
                    <div className="empty-recommendations glass-card">
                        <div className="empty-icon">📦</div>
                        <h3>No Bundle Recommendations Yet</h3>
                        <p>Products frequently bought together will appear here once we have more order data from customers.</p>
                    </div>
                </div>
            )}

            {/* Similar Products */}
            {similarProducts.length > 0 ? (
                <div className="similar-section">
                    <h2>Similar Products</h2>
                    <p>You might also like these products</p>
                    <div className="similar-grid">
                        {similarProducts.map(p => (
                            <div key={p.id} className="similar-card glass-card" onClick={() => navigate('/product/' + p.id)}>
                                <img src={p.image} alt={p.name} />
                                <h3>{p.name}</h3>
                                <div className="rating">
                                    <span className="no-rating">No reviews</span>
                                </div>
                                <PriceDisplay product={p} size="sm" showGSTIndicator={false} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="similar-section">
                    <h2>Similar Products</h2>
                    <div className="empty-recommendations glass-card">
                        <div className="empty-icon">🔍</div>
                        <h3>No Similar Products Found</h3>
                        <p>Similar products in this category will appear here as more items are added to our catalog.</p>
                    </div>
                </div>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 1 && (
                <div className="recently-viewed-section">
                    <h2>Recently Viewed</h2>
                    <p>Products you've viewed</p>
                    <div className="similar-grid">
                        {recentlyViewed.filter(p => p.id !== productId).slice(0, 4).map(p => (
                            <div key={p.id} className="similar-card glass-card" onClick={() => navigate('/product/' + p.id)}>
                                <img src={p.imageUrl || p.image} alt={p.name} />
                                <h3>{p.name}</h3>
                                <div className="rating">
                                    <span className="no-rating">No reviews</span>
                                </div>
                                <PriceDisplay product={p} size="sm" showGSTIndicator={false} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

