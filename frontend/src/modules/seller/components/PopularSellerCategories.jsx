import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Shirt, 
  Watch, 
  Tv, 
  ShoppingBag, 
  Gem, 
  Footprints, 
  Home, 
  Flame, 
  TrendingUp, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Layers,
  HeartHandshake,
  Laptop,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_DATA = [
  {
    id: 'sarees',
    title: 'Sarees & Ethnic Wear',
    sellLabel: 'Sell Sarees Online',
    group: 'fashion',
    icon: ShoppingBag,
    color: '#E11D48',
    bgColor: '#FFF1F2',
    badge: '🔥 Highest Demand',
    searches: '3.8M+ Monthly Searches',
    margin: 'Up to 60% Margin'
  },
  {
    id: 'jewellery',
    title: 'Fashion Jewellery',
    sellLabel: 'Sell Jewellery Online',
    group: 'jewellery',
    icon: Gem,
    color: '#D97706',
    bgColor: '#FFFBEB',
    badge: '⭐ 0% Commission',
    searches: '2.5M+ Monthly Searches',
    margin: 'High Repeat Orders'
  },
  {
    id: 'tshirts',
    title: 'T-Shirts & Casuals',
    sellLabel: 'Sell Tshirts Online',
    group: 'fashion',
    icon: Shirt,
    color: '#2563EB',
    bgColor: '#EFF6FF',
    badge: '⚡ Fast Moving',
    searches: '4.2M+ Monthly Searches',
    margin: 'Volume Driver'
  },
  {
    id: 'shirts',
    title: 'Shirts & Formal Wear',
    sellLabel: 'Sell Shirts Online',
    group: 'fashion',
    icon: Layers,
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    badge: '👔 High Value',
    searches: '1.9M+ Monthly Searches',
    margin: 'All-Year Demand'
  },
  {
    id: 'watches',
    title: 'Watches & Wearables',
    sellLabel: 'Sell Watches Online',
    group: 'electronics',
    icon: Watch,
    color: '#0D9488',
    bgColor: '#F0FDFA',
    badge: '⌚ Trending',
    searches: '2.1M+ Monthly Searches',
    margin: 'High Order Value'
  },
  {
    id: 'electronics',
    title: 'Electronics & Audio',
    sellLabel: 'Sell Electronics Online',
    group: 'electronics',
    icon: Laptop,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    badge: '🚀 Top Growth',
    searches: '5.1M+ Monthly Searches',
    margin: 'Massive Reach'
  },
  {
    id: 'clothes',
    title: 'Western & Kids Apparel',
    sellLabel: 'Sell Clothes Online',
    group: 'fashion',
    icon: Sparkles,
    color: '#EC4899',
    bgColor: '#FDF2F8',
    badge: '👗 Everyday Demand',
    searches: '3.4M+ Monthly Searches',
    margin: 'Rapid Turnaround'
  },
  {
    id: 'socks',
    title: 'Footwear & Socks',
    sellLabel: 'Sell Socks Online',
    group: 'fashion',
    icon: Footprints,
    color: '#059669',
    bgColor: '#ECFDF5',
    badge: '📦 Easy Shipping',
    searches: '1.2M+ Monthly Searches',
    margin: 'Low Return Rate'
  },
  {
    id: 'home',
    title: 'Home Decor & Kitchen',
    sellLabel: 'Sell Home Decor Online',
    group: 'home',
    icon: Home,
    color: '#CA8A04',
    bgColor: '#FEFCE8',
    badge: '🏡 High Growth',
    searches: '2.8M+ Monthly Searches',
    margin: 'Consistent Sales'
  },
  {
    id: 'beauty',
    title: 'Beauty & Personal Care',
    sellLabel: 'Sell Beauty Online',
    group: 'home',
    icon: HeartHandshake,
    color: '#DB2777',
    bgColor: '#FDF2F8',
    badge: '💄 High Retention',
    searches: '3.1M+ Monthly Searches',
    margin: 'High Repeat Rate'
  },
  {
    id: 'appliances',
    title: 'Kitchen & Small Appliances',
    sellLabel: 'Sell Appliances Online',
    group: 'electronics',
    icon: Tv,
    color: '#0284C7',
    bgColor: '#F0F9FF',
    badge: '⚡ Prime Category',
    searches: '1.7M+ Monthly Searches',
    margin: 'High Basket Size'
  },
  {
    id: 'accessories',
    title: 'Bags, Wallets & Belts',
    sellLabel: 'Sell Accessories Online',
    group: 'jewellery',
    icon: Sparkles,
    color: '#9333EA',
    bgColor: '#FAF5FF',
    badge: '🎁 Gifting Favorite',
    searches: '2.3M+ Monthly Searches',
    margin: 'Strong Margin'
  }
];

const TABS = [
  { id: 'all', label: 'All Popular Categories' },
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'jewellery', label: 'Jewellery & Accessories' },
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'home', label: 'Home & Beauty' }
];

export default function PopularSellerCategories({ onCategorySelect }) {
  const [activeTab, setActiveTab] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredCategories = CATEGORY_DATA.filter(item => {
    if (activeTab === 'all') return true;
    return item.group === activeTab;
  });

  const displayedCategories = isExpanded ? filteredCategories : filteredCategories.slice(0, 8);

  return (
    <section id="popular-categories" className="py-20 bg-gradient-to-b from-gray-50/80 to-white relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#1800AD] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <TrendingUp size={14} className="text-[#3B7CF1]" />
            High Demand Sectors
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4 font-['Outfit',sans-serif]">
            Popular Categories To Sell Online
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Join thousands of successful sellers across India. Enjoy <strong className="text-gray-900 font-bold">0% commission</strong>, instant logistics support, and reach crores of eager shoppers.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsExpanded(false);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#1800AD] text-white shadow-md shadow-blue-900/20 scale-[1.02]'
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <AnimatePresence>
            {displayedCategories.map((cat, index) => {
              const IconComponent = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  onClick={() => onCategorySelect && onCategorySelect(cat)}
                  className="group relative bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-[#3B7CF1]/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Row: Icon & Demand Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm"
                        style={{ backgroundColor: cat.bgColor, color: cat.color }}
                      >
                        <IconComponent size={22} strokeWidth={2.2} />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100/80 text-gray-700 border border-gray-200/50 group-hover:bg-blue-50 group-hover:text-[#1800AD] group-hover:border-blue-200 transition-colors">
                        {cat.badge}
                      </span>
                    </div>

                    {/* Title & Sell Keyword */}
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#1800AD] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {cat.sellLabel}
                    </p>
                  </div>

                  {/* Bottom Stats & CTA */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-600 block">
                        {cat.searches}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> {cat.margin}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1800AD] group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* View More / View Less Toggle */}
        {filteredCategories.length > 8 && (
          <div className="text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-300 shadow-sm text-sm font-bold text-[#1800AD] hover:bg-blue-50 hover:border-[#1800AD] transition-all"
            >
              {isExpanded ? (
                <>
                  Show Fewer Categories <ChevronUp size={16} />
                </>
              ) : (
                <>
                  View All Categories ({filteredCategories.length}) <ChevronDown size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
