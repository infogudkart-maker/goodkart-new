import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductSection({ 
    title, 
    subtitle, 
    groupedData, 
    bg, 
    loading, 
    wishlist, 
    productReviews, 
    handleAddToCart, 
    toggleWishlist, 
    openQuickView 
}) {
    return (
        <section className="section" style={{ background: bg }}>
            <div className="container">
                <div className="section-header-compact">
                    <div className="header-info">
                        <h2 className="title-modern">
                            {title.split(' ')[0]} <span className="gradient-text">{title.split(' ').slice(1).join(' ')}</span>
                        </h2>
                        <p>{subtitle}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="product-uniform-grid">
                        {[...Array(4)].map((_, i) => <div key={i} className="product-card skeleton" />)}
                    </div>
                ) : (
                    Object.entries(groupedData).map(([cat, items]) => (
                        <div key={cat} className="category-group-wrapper">
                            <div className="category-group-header">
                                <h3>{cat}</h3>
                                <div className="line" />
                                <Link to={`/products?category=${cat}`} className="view-more">
                                    View all {cat} <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="product-uniform-grid">
                                {items.map((p, i) => (
                                    <ProductCard 
                                        key={p.id} 
                                        product={p} 
                                        index={i} 
                                        wishlist={wishlist}
                                        productReviews={productReviews}
                                        handleAddToCart={handleAddToCart}
                                        toggleWishlist={toggleWishlist}
                                        openQuickView={openQuickView}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

