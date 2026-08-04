import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SellerHeader from '@/modules/seller/components/SellerHeader';
import Footer from '@/modules/seller/components/Footer';
import StatsSection from '@/modules/seller/components/StatsSection';
import WhyGoodkart from '@/modules/seller/components/WhySellSathi';
import HowItWorks from '@/modules/seller/components/HowItWorks';
import Testimonials from '@/modules/seller/components/Testimonials';
import { ArrowRight, BookOpen, Truck, Rocket, BarChart3, Mail, Zap, Play } from 'lucide-react';

const categories = [
  "Sell Sarees Online", "Sell Jewellery Online", "Sell Tshirts Online",
  "Sell Shirts Online", "Sell Watches Online", "Sell Electronics Online",
  "Sell Clothes Online", "Sell Socks Online"
];

export default function SellerLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SellerHeader />

      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-brand/5 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Sell Online to Crores of Customers at <span style={{ color: '#3B7CF1' }}>0% Commission</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
                Become a Goodkart seller and grow your business across India.
              </p>

              <button
                onClick={() => navigate('/seller/register')}
                style={{
                  backgroundColor: '#3B7CF1', color: 'white', padding: '16px 36px',
                  borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  marginTop: '24px', fontSize: '18px', display: 'inline-block',
                  boxShadow: '0 10px 25px -5px rgba(123, 77, 219, 0.3)'
                }}
                className="hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Start Selling Now
              </button>

              <p className="text-sm text-gray-500 mt-4">
                <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded mr-2">NEW</span>
                Don't have a GSTIN? You can still sell on Goodkart.{' '}
                <Link to="#" className="text-brand font-semibold hover:underline">Know more</Link>
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex-1 w-full max-w-xl">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-square lg:aspect-video">
                <img src="https://picsum.photos/seed/seller-hero/1200/800" alt="Seller Success" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <StatsSection />
      <WhyGoodkart />
      <HowItWorks />
      <Testimonials />

      <section className="w-full py-12 md:py-16 bg-gradient-to-r from-blue-600 via-blue-600 to-[#5BB8FF]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="rounded-[2rem] md:rounded-2xl bg-white/10 backdrop-blur-lg p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 border border-white/20">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4 text-white/80">
                <BookOpen size={20} className="md:w-6 md:h-6" />
                <span className="font-bold tracking-widest uppercase text-xs md:text-sm">SUPPLIER LEARNING HUB</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">Learn how to sell and grow your business on Goodkart</h2>
            </div>
            <button className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-brand font-bold text-base md:text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
              <Play fill="currentColor" size={18} /> Visit Learning Hub
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-10 md:mb-16 text-center tracking-tight">Grow Your Business With Goodkart</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {[
              { icon: Truck, title: "Efficient & Affordable Shipping", desc: "Sell your products across India with our vast logistics network covering 28,000+ pincodes." },
              { icon: Rocket, title: "Next Day Dispatch Program", desc: "Get higher visibility and faster growth by opting for our Next Day Dispatch (NDD) program." },
              { icon: Zap, title: "Ads to Grow More", desc: "Use our intuitive advertising tools to put your products in front of right customers." },
              { icon: BarChart3, title: "Business Insights & Analytics", desc: "Make data-driven decisions with our comprehensive seller dashboard and analytics." }
            ].map((feature, i) => (
              <div key={i} className="p-6 md:p-10 rounded-2xl md:rounded-[2rem] bg-gray-50 border border-gray-100 flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-brand/5 flex items-center justify-center text-brand shrink-0">
                  <feature.icon size={24} className="md:w-7 md:h-7" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{feature.title}</h4>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">Popular Categories To Sell Online</h2>
          <div className="flex flex-wrap gap-4 mb-8">
            {categories.map((cat, i) => (
              <button key={i} className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-brand hover:text-brand transition-all">
                {cat}
              </button>
            ))}
          </div>
          <button className="text-brand font-bold flex items-center gap-2 hover:underline">
            View More <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/5 text-brand mb-8">
            <Mail size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Goodkart Supplier Support Available 24/7</h2>
          <p className="text-gray-600 mb-8">Have questions? We're here to help you every step of the way.</p>
          <a href="mailto:support@Goodkart.com" className="text-2xl font-bold hover:underline" style={{ color: '#3B7CF1' }}>
            support@Goodkart.com
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}







