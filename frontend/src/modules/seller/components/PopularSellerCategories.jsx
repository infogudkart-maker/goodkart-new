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
  CheckCircle2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Palette,
  Compass,
  LayoutGrid,
  Tag,
  SlidersHorizontal,
  Star
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
    gradient: 'from-rose-500/10 to-pink-500/10',
    badge: '🔥 Highest Demand',
    searches: '3.8M+ Monthly Searches',
    margin: 'Up to 60% Margin',
    description: 'Silk, cotton, designer sarees and festive ethnic wear with high repeat customer volume.'
  },
  {
    id: 'jewellery',
    title: 'Fashion Jewellery',
    sellLabel: 'Sell Jewellery Online',
    group: 'jewellery',
    icon: Gem,
    color: '#D97706',
    bgColor: '#FFFBEB',
    gradient: 'from-amber-500/10 to-yellow-500/10',
    badge: '⭐ 0% Commission',
    searches: '2.5M+ Monthly Searches',
    margin: 'High Repeat Orders',
    description: 'Gold-plated, silver, Kundan, and contemporary fashion accessories with high margins.'
  },
  {
    id: 'tshirts',
    title: 'T-Shirts & Casuals',
    sellLabel: 'Sell Tshirts Online',
    group: 'fashion',
    icon: Shirt,
    color: '#2563EB',
    bgColor: '#EFF6FF',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    badge: '⚡ Fast Moving',
    searches: '4.2M+ Monthly Searches',
    margin: 'High Volume Driver',
    description: 'Graphic, oversized, and solid polo t-shirts in high demand across young shoppers.'
  },
  {
    id: 'shirts',
    title: 'Shirts & Formal Wear',
    sellLabel: 'Sell Shirts Online',
    group: 'fashion',
    icon: Layers,
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    gradient: 'from-indigo-500/10 to-purple-500/10',
    badge: '👔 High Value',
    searches: '1.9M+ Monthly Searches',
    margin: 'All-Year Demand',
    description: 'Formal, linen, and printed casual shirts for office and daily casual styles.'
  },
  {
    id: 'watches',
    title: 'Watches & Wearables',
    sellLabel: 'Sell Watches Online',
    group: 'electronics',
    icon: Watch,
    color: '#0D9488',
    bgColor: '#F0FDFA',
    gradient: 'from-teal-500/10 to-emerald-500/10',
    badge: '⌚ Trending',
    searches: '2.1M+ Monthly Searches',
    margin: 'High Order Value',
    description: 'Smart watches, analog dials, and luxury couple sets with instant shipping perks.'
  },
  {
    id: 'electronics',
    title: 'Electronics & Audio',
    sellLabel: 'Sell Electronics Online',
    group: 'electronics',
    icon: Laptop,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    gradient: 'from-purple-500/10 to-violet-500/10',
    badge: '🚀 Top Growth',
    searches: '5.1M+ Monthly Searches',
    margin: 'Massive Reach',
    description: 'TWS earbuds, chargers, Bluetooth speakers, and mobile accessories.'
  },
  {
    id: 'clothes',
    title: 'Western & Kids Apparel',
    sellLabel: 'Sell Clothes Online',
    group: 'fashion',
    icon: Sparkles,
    color: '#EC4899',
    bgColor: '#FDF2F8',
    gradient: 'from-pink-500/10 to-rose-500/10',
    badge: '👗 Everyday Demand',
    searches: '3.4M+ Monthly Searches',
    margin: 'Rapid Turnaround',
    description: 'Co-ord sets, dresses, denim, and kidswear with steady daily sales across India.'
  },
  {
    id: 'socks',
    title: 'Footwear & Socks',
    sellLabel: 'Sell Socks Online',
    group: 'fashion',
    icon: Footprints,
    color: '#059669',
    bgColor: '#ECFDF5',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    badge: '📦 Easy Shipping',
    searches: '1.2M+ Monthly Searches',
    margin: 'Low Return Rate',
    description: 'Sneakers, ankle socks, formal loafers, and comfort slides with fast logistics.'
  },
  {
    id: 'home',
    title: 'Home Decor & Kitchen',
    sellLabel: 'Sell Home Decor Online',
    group: 'home',
    icon: Home,
    color: '#CA8A04',
    bgColor: '#FEFCE8',
    gradient: 'from-yellow-500/10 to-amber-500/10',
    badge: '🏡 High Growth',
    searches: '2.8M+ Monthly Searches',
    margin: 'Consistent Sales',
    description: 'Bedsheets, curtains, kitchen organisers, and modern ambient lighting.'
  },
  {
    id: 'beauty',
    title: 'Beauty & Personal Care',
    sellLabel: 'Sell Beauty Online',
    group: 'home',
    icon: HeartHandshake,
    color: '#DB2777',
    bgColor: '#FDF2F8',
    gradient: 'from-rose-500/10 to-pink-500/10',
    badge: '💄 High Retention',
    searches: '3.1M+ Monthly Searches',
    margin: 'High Repeat Rate',
    description: 'Organic skincare, herbal hair oils, makeup, and wellness essentials.'
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
  // Design variant switcher state (1: Bento Grid, 2: Pill Matrix, 3: Carousel Slider, 4: Split Spotlight)
  const [selectedDesign, setSelectedDesign] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [spotlightCategory, setSpotlightCategory] = useState(CATEGORY_DATA[0]);

  const filteredCategories = CATEGORY_DATA.filter(item => {
    if (activeTab === 'all') return true;
    return item.group === activeTab;
  });

  const displayedGridCategories = isExpanded ? filteredCategories : filteredCategories.slice(0, 8);

  const handleSliderPrev = () => {
    setSliderIndex(prev => (prev === 0 ? Math.max(0, filteredCategories.length - 3) : prev - 1));
  };

  const handleSliderNext = () => {
    setSliderIndex(prev => (prev >= filteredCategories.length - 3 ? 0 : prev + 1));
  };

  return (
    <section id="popular-categories" className="py-16 sm:py-20 bg-gradient-to-b from-gray-50/80 via-white to-gray-50/50 relative overflow-hidden border-t border-gray-100">
      
      {/* Interactive Design Selector Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-blue-200/80 shadow-lg shadow-blue-900/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1800AD] px-2">
            <Palette size={16} className="text-[#3B7CF1]" />
            <span>SELECT DESIGN VARIANT:</span>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 1, label: '1. Modern Bento Grid', icon: LayoutGrid },
              { id: 2, label: '2. Minimalist Pills', icon: Tag },
              { id: 3, label: '3. Interactive Slider', icon: SlidersHorizontal },
              { id: 4, label: '4. Split Spotlight', icon: Compass }
            ].map(variant => {
              const Icon = variant.icon;
              const isActive = selectedDesign === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedDesign(variant.id)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1800AD] text-white shadow-md shadow-blue-900/20'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-[#1800AD]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{variant.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#1800AD] text-xs font-bold uppercase tracking-wider mb-3.5 shadow-sm">
            <TrendingUp size={14} className="text-[#3B7CF1]" />
            High Demand Sectors
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 font-['Outfit',sans-serif]">
            Popular Categories To Sell Online
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Start selling in India's fastest growing retail categories with <strong className="text-gray-900 font-bold">0% commission</strong> and instant seller onboarding.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DESIGN VARIANT 1: MODERN BENTO GRID WITH DEMAND STATS & TABS */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Category Tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsExpanded(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#1800AD] text-white shadow-md shadow-blue-900/20 scale-[1.02]'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {displayedGridCategories.map((cat, index) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.id}
                    onClick={() => onCategorySelect && onCategorySelect(cat)}
                    className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#3B7CF1]/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          <IconComponent size={22} strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100/90 text-gray-700 border border-gray-200/60 group-hover:bg-blue-50 group-hover:text-[#1800AD] group-hover:border-blue-200 transition-colors">
                          {cat.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#1800AD] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {cat.sellLabel}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                      <div>
                        <span className="text-[11px] font-semibold text-gray-600 block">{cat.searches}</span>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> {cat.margin}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1800AD] group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCategories.length > 8 && (
              <div className="text-center">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-300 shadow-sm text-sm font-bold text-[#1800AD] hover:bg-blue-50 hover:border-[#1800AD] transition-all"
                >
                  {isExpanded ? <>Show Fewer Categories <ChevronUp size={16} /></> : <>View All Categories ({filteredCategories.length}) <ChevronDown size={16} /></>}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN VARIANT 2: MINIMALIST PILL MATRIX & COMPACT BADGES     */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-lg shadow-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Explore Fast Selling Niches</h3>
                  <p className="text-xs text-gray-500">Tap on any category to view seller onboarding and demand analytics</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> 0% Platform Fee on all categories
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {CATEGORY_DATA.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategorySelect && onCategorySelect(cat)}
                      className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50/90 hover:bg-blue-50/80 border border-gray-200 hover:border-[#3B7CF1] text-gray-800 transition-all duration-200 hover:shadow-sm"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.bgColor, color: cat.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block text-gray-900 group-hover:text-[#1800AD]">
                          {cat.sellLabel}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {cat.searches}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1 hidden sm:inline-block">
                        {cat.badge.replace(/[🔥⭐⚡👔⌚🚀👗📦🏡💄]/g, '').trim()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-100">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#1800AD] text-white flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Have a unique category or custom brand?</h4>
                    <p className="text-[11px] text-gray-600">You can list any eligible retail category in under 10 minutes.</p>
                  </div>
                </div>
                <button
                  onClick={() => onCategorySelect && onCategorySelect({ id: 'custom' })}
                  className="px-4 py-2 rounded-xl bg-[#1800AD] text-white text-xs font-bold hover:bg-blue-900 transition-colors whitespace-nowrap"
                >
                  Register Shop Now &rarr;
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN VARIANT 3: INTERACTIVE CAROUSEL SLIDER WITH VISUALS    */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Showing High Velocity Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSliderPrev}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-[#1800AD] hover:border-blue-300 shadow-sm transition-all"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleSliderNext}
                  className="w-10 h-10 rounded-xl bg-[#1800AD] text-white flex items-center justify-center hover:bg-blue-900 shadow-sm transition-all"
                  aria-label="Next Slide"
                >
                  <ChevronRightIcon size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {CATEGORY_DATA.slice(sliderIndex, sliderIndex + 3).map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className={`rounded-3xl p-6 border border-gray-200/90 bg-gradient-to-br ${cat.gradient} bg-white shadow-lg shadow-gray-100 flex flex-col justify-between relative overflow-hidden`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-5">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          <IconComponent size={26} strokeWidth={2.2} />
                        </div>
                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white text-gray-900 shadow-sm border border-gray-200/80">
                          {cat.badge}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.title}</h3>
                      <span className="text-xs font-semibold text-blue-600 block mb-3">{cat.sellLabel}</span>
                      <p className="text-xs text-gray-600 leading-relaxed mb-6">{cat.description}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between relative z-10">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">{cat.searches}</span>
                        <span className="text-[11px] text-emerald-600 font-semibold">{cat.margin}</span>
                      </div>
                      <button
                        onClick={() => onCategorySelect && onCategorySelect(cat)}
                        className="px-4 py-2 rounded-xl bg-[#1800AD] text-white text-xs font-bold hover:bg-blue-900 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-900/20"
                      >
                        Start Selling <ArrowRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Slider Dots */}
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: Math.ceil(CATEGORY_DATA.length / 3) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSliderIndex(i * 3)}
                  className={`h-2 rounded-full transition-all ${
                    Math.floor(sliderIndex / 3) === i ? 'w-8 bg-[#1800AD]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN VARIANT 4: TWO-COLUMN SPLIT HERO SPOTLIGHT             */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Featured Spotlight Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#1800AD] to-[#3B7CF1] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold w-fit mb-6">
                    <Star size={13} fill="currentColor" /> Category In High Demand
                  </div>

                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner bg-white/15 backdrop-blur-md text-white"
                  >
                    {React.createElement(spotlightCategory.icon, { size: 30, strokeWidth: 2.2 })}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">{spotlightCategory.title}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed mb-6">{spotlightCategory.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                    <div>
                      <span className="text-[11px] text-blue-200 uppercase font-semibold block">Monthly Demand</span>
                      <span className="text-base font-bold text-white">{spotlightCategory.searches}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-blue-200 uppercase font-semibold block">Seller Advantage</span>
                      <span className="text-base font-bold text-white">{spotlightCategory.margin}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4">
                  <button
                    onClick={() => onCategorySelect && onCategorySelect(spotlightCategory)}
                    className="w-full py-3.5 px-6 rounded-xl bg-white text-[#1800AD] font-bold text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    Start Selling in {spotlightCategory.title.split('&')[0]} <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Right List of Other High Demand Categories */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select a category to view details:</span>
                  <span className="text-xs font-semibold text-[#1800AD]">10+ Active Niches</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {CATEGORY_DATA.slice(0, 6).map(cat => {
                    const isSelected = spotlightCategory.id === cat.id;
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSpotlightCategory(cat)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#1800AD] shadow-md'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#1800AD]' : 'text-gray-900'}`}>
                            {cat.title}
                          </h4>
                          <span className="text-[11px] text-gray-500 font-medium block">
                            {cat.searches}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#1800AD] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center justify-between">
                  <div className="text-xs text-gray-600 font-medium">
                    Looking for more categories like <strong className="text-gray-900">Footwear, Kitchen, Appliances</strong>?
                  </div>
                  <button
                    onClick={() => onCategorySelect && onCategorySelect({ id: 'all' })}
                    className="text-xs font-bold text-[#1800AD] hover:underline whitespace-nowrap ml-2"
                  >
                    View All &rarr;
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
}
