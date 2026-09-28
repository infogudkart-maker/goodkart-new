import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function CategoryShowcase({ groupedDeals, wishlist, productReviews, handleAddToCart, toggleWishlist, openQuickView }) {
    if (Object.keys(groupedDeals).length === 0) return null;

    return (
        <section className="section deals-section" style={{ background: '#FFFFFF' }}>
            <div className="container">
                <div className="section-header-compact">
                    <div className="header-info">
                        <h2 className="title-modern">Flash <span className="gradient-text">Deals</span></h2>
                        <p>Exclusive limited-time offers grouped by category</p>
                    </div>
                </div>

                {Object.entries(groupedDeals).map(([cat, items]) => (
                    <div key={cat} className="category-group-wrapper">
                        <div className="category-group-header">
                            <h3>{cat}</h3>
                            <div className="line" />
                            <Link to={`/products?category=${cat}`} className="view-more">
                                Browse all <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="product-uniform-grid">
                            {items.map((deal, idx) => (
                                <ProductCard 
                                    key={deal.id} 
                                    product={deal} 
                                    index={idx} 
                                    wishlist={wishlist}
                                    productReviews={productReviews}
                                    handleAddToCart={handleAddToCart}
                                    toggleWishlist={toggleWishlist}
                                    openQuickView={openQuickView}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

