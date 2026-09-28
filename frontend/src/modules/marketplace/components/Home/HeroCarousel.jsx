import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
    {
        id: 1,
        title: "Summer Fashion Collection",
        subtitle: "Explore our curated collection of trending summer fashion pieces",
        badge: "New Season",
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&auto=format&fit=crop&q=80",
        btnText: "Shop Now",
        link: "/products?category=Fashion"
    },
    {
        id: 2,
        title: "Premium Electronics",
        subtitle: "Experience cutting-edge technology with our premium electronics",
        badge: "Featured",
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&auto=format&fit=crop&q=80",
        btnText: "Discover More",
        link: "/products?category=Electronics"
    },
    {
        id: 3,
        title: "Luxury Accessories",
        subtitle: "Complete your look with our premium accessories collection",
        badge: "Limited Edition",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&auto=format&fit=crop&q=80",
        btnText: "View Collection",
        link: "/products?category=Jewelry & Accessories"
    }
];

export default function HeroCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="hero-carousel">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hero-slide"
                    style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(" + HERO_SLIDES[currentSlide].image + ")" }}
                >
                    <div className="container hero-content">
                        <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="hero-badge"
                        >
                            <Sparkles size={14} /> {HERO_SLIDES[currentSlide].badge}
                        </motion.span>
                        <motion.h1
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {HERO_SLIDES[currentSlide].title}
                        </motion.h1>
                        <motion.p
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {HERO_SLIDES[currentSlide].subtitle}
                        </motion.p>
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="hero-btns"
                        >
                            <Link to={HERO_SLIDES[currentSlide].link} className="btn-modern btn-main">
                                Shop Collection
                                <ArrowRight size={18} />
                            </Link>
                            <Link to="/products" className="btn-modern btn-outline">Explore Brands</Link>
                        </motion.div>
                    </div>

                    <div className="carousel-nav">
                        <button className="nav-btn" onClick={() => setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}>
                            <ChevronLeft size={24} />
                        </button>
                        <button className="nav-btn" onClick={() => setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)}>
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="carousel-dots">
                        {HERO_SLIDES.map((_, i) => (
                            <div
                                key={i}
                                className={"dot " + (currentSlide === i ? 'active' : '')}
                                onClick={() => setCurrentSlide(i)}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    );
}

