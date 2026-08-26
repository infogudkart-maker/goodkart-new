import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Percent, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Truck, 
  ArrowRight,
  Shield,
  Award,
  ChevronRight,
  Layout,
  Sliders,
  Split,
  Table,
  Check,
  X,
  Star,
  Users,
  BarChart3,
  Layers
} from 'lucide-react';

const FEATURES_DATA = [
  {
    id: 'commission',
    icon: Percent,
    title: "0% Commission Fee",
    tag: "100% Profit To You",
    stat: "0%",
    statLabel: "Platform Commission",
    shortDesc: "Keep every single rupee you make without hidden fees.",
    description: "Unlike traditional marketplaces that cut 15-30% of your sales, Goodkart charges absolutely 0% commission. You keep 100% of your profit margin.",
    benefit: "Zero Listing & Subscription Costs",
    color: "#1800AD",
    accentBg: "from-blue-600 to-indigo-700",
    lightBg: "#EFF6FF"
  },
  {
    id: 'penalty',
    icon: ShieldCheck,
    title: "0 Penalty Charges",
    tag: "Stress-Free Operations",
    stat: "₹0",
    statLabel: "Cancellation Penalty",
    shortDesc: "Never worry about late dispatch or unavoidable cancellation fees.",
    description: "We understand that logistics and supplier inventory can have sudden hiccups. We never penalize you for delayed dispatches or unfulfilled orders.",
    benefit: "Zero Penalty Guarantee",
    color: "#059669",
    accentBg: "from-emerald-600 to-teal-700",
    lightBg: "#ECFDF5"
  },
  {
    id: 'growth',
    icon: TrendingUp,
    title: "Inclusive Growth for Every Seller",
    tag: "No GSTIN? No Problem",
    stat: "100%",
    statLabel: "Seller Inclusion",
    shortDesc: "Open for small artisans, home businesses, and non-GSTIN sellers.",
    description: "Start selling your handcrafted or regional items with minimal documentation. We support both regular GSTIN holders and Enrolment ID (non-GSTIN) sellers.",
    benefit: "Instant Onboarding Support",
    color: "#7C3AED",
    accentBg: "from-purple-600 to-violet-700",
    lightBg: "#F5F3FF"
  },
  {
    id: 'payouts',
    icon: Clock,
    title: "7-Day Fast Payment Cycle",
    tag: "Uninterrupted Cashflow",
    stat: "7 Days",
    statLabel: "From Delivery Date",
    shortDesc: "Direct bank payouts deposited every week without holding funds.",
    description: "Maintain a steady working capital with our ultra-fast 7-day payment cycle from the date of order delivery straight into your registered bank account.",
    benefit: "Weekly Automated Payouts",
    color: "#0284C7",
    accentBg: "from-cyan-600 to-blue-700",
    lightBg: "#F0F9FF"
  },
  {
    id: 'business',
    icon: Zap,
    title: "Ease of Doing Business",
    tag: "Automated Workflows",
    stat: "28K+",
    statLabel: "Pincodes Covered",
    shortDesc: "1-click bulk listing, integrated logistics, and real-time inventory.",
    description: "Manage orders effortlessly. Our intelligent seller dashboard provides instant doorstep pickups, barcode generation, and automated stock tracking.",
    benefit: "Integrated Pan-India Delivery",
    color: "#EA580C",
    accentBg: "from-orange-600 to-amber-700",
    lightBg: "#FFF7ED"
  },
  {
    id: 'visibility',
    icon: Sparkles,
    title: "Free Catalog Visibility & Ads",
    tag: "First 30 Days Promo",
    stat: "₹5,000",
    statLabel: "Free Ad Credits",
    shortDesc: "Complementary ad boost to put your products in front of millions.",
    description: "Boost your listings to the top of category pages. Every newly onboarded seller receives free promotional credits to jumpstart early sales.",
    benefit: "Free Promotional Boost",
    color: "#DB2777",
    accentBg: "from-pink-600 to-rose-700",
    lightBg: "#FDF2F8"
  }
];

const COMPARISON_DATA = [
  { feature: "Commission on Sales", goodkart: "0% Commission", others: "15% - 35% Deducted", isAdvantage: true },
  { feature: "Late Dispatch Penalty", goodkart: "₹0 (Zero Penalties)", others: "Heavy Penalties per Order", isAdvantage: true },
  { feature: "Payment Settlement", goodkart: "7-Day Fast Cycle", others: "15 - 30 Days Holding", isAdvantage: true },
  { feature: "Selling Without Regular GSTIN", goodkart: "Fully Supported (Enrolment ID)", others: "Mandatory Regular GSTIN", isAdvantage: true },
  { feature: "Listing & Subscription Fees", goodkart: "Free Forever", others: "Monthly Subscriptions / Fees", isAdvantage: true },
  { feature: "Doorstep Logistics Support", goodkart: "Integrated Pan-India Pickup", others: "Complex Tiered Logistics", isAdvantage: true }
];

export default function WhyGoodkart() {
  const [selectedDesign, setSelectedDesign] = useState(1);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const activeFeature = FEATURES_DATA[activeFeatureIndex];

  return (
    <section id="why-choose-us" className="py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      
      {/* Design Switcher Toolbar for User */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-blue-200/80 shadow-lg shadow-blue-900/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1800AD] px-2">
            <Sliders size={16} className="text-[#3B7CF1]" />
            <span>TRY DIFFERENT DESIGN CONCEPTS:</span>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 1, label: '1. Split Interactive Showcase', icon: Split },
              { id: 2, label: '2. Dark Glassmorphism Experience', icon: Layers },
              { id: 3, label: '3. Comparison Matrix', icon: Table },
              { id: 4, label: '4. Modern Bento Cards', icon: Layout }
            ].map(v => {
              const Icon = v.icon;
              const isActive = selectedDesign === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedDesign(v.id)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1800AD] text-white shadow-md shadow-blue-900/20'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-[#1800AD]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#1800AD] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Coins size={14} className="text-[#3B7CF1]" />
            Seller Advantage
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight font-['Outfit',sans-serif]">
            Why Suppliers Love Selling On Goodkart
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Built to maximize your margins, protect your cashflow, and give you nationwide reach with zero friction.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DESIGN 1: SPLIT INTERACTIVE SHOWCASE (STRIPE / APPLE STYLE)   */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Dynamic Spotlight Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#0B034E] via-[#1800AD] to-[#3B7CF1] rounded-3xl p-8 sm:p-10 text-white shadow-2xl shadow-blue-950/20 relative overflow-hidden min-h-[460px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold tracking-wide uppercase">
                      {activeFeature.tag}
                    </span>
                    <span className="text-xs text-blue-200 font-semibold flex items-center gap-1">
                      <Star size={13} fill="currentColor" /> Highlighted Benefit
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white block mb-1">
                      {activeFeature.stat}
                    </span>
                    <span className="text-xs uppercase font-bold text-blue-200 tracking-wider block">
                      {activeFeature.statLabel}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    {activeFeature.title}
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed mb-6">
                    {activeFeature.description}
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    {activeFeature.benefit}
                  </span>
                </div>
              </div>

              {/* Right Interactive Selection List */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                {FEATURES_DATA.map((feat, index) => {
                  const isSelected = activeFeatureIndex === index;
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.id}
                      onClick={() => setActiveFeatureIndex(index)}
                      className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-blue-50/90 border-[#1800AD] shadow-md shadow-blue-900/5 translate-x-1.5'
                          : 'bg-white border-gray-200/90 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: feat.lightBg, color: feat.color }}
                        >
                          <Icon size={22} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-base font-bold ${isSelected ? 'text-[#1800AD]' : 'text-gray-900'}`}>
                              {feat.title}
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hidden sm:inline-block">
                              {feat.tag}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {feat.shortDesc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#1800AD]' : 'text-gray-400'}`}>
                          {feat.stat}
                        </span>
                        <ChevronRight size={18} className={isSelected ? 'text-[#1800AD]' : 'text-gray-300'} />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN 2: DARK GLASSMORPHISM EXPERIENCE                       */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 2 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="bg-[#0A0D1F] rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {FEATURES_DATA.map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.id}
                      className="group bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.08] hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon size={22} />
                          </div>
                          <span className="text-xl font-black text-white font-mono">{feat.stat}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed mb-6">
                          {feat.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-emerald-400 font-semibold">
                        <span>{feat.benefit}</span>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN 3: HIGH-CONVERTING COMPARISON MATRIX (GOODKART VS OTHERS)*/}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 3 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50/80 p-5 sm:p-6 border-b border-gray-200 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                <div className="col-span-5 sm:col-span-6">Seller Benefit</div>
                <div className="col-span-4 sm:col-span-3 text-[#1800AD] font-black flex items-center gap-1.5">
                  <Award size={16} /> Goodkart
                </div>
                <div className="col-span-3 sm:col-span-3 text-gray-400">Other Platforms</div>
              </div>

              <div className="divide-y divide-gray-100">
                {COMPARISON_DATA.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 p-4 sm:p-5 items-center hover:bg-blue-50/30 transition-colors text-xs sm:text-sm">
                    <div className="col-span-5 sm:col-span-6 font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1800AD]" />
                      {row.feature}
                    </div>
                    <div className="col-span-4 sm:col-span-3 font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-lg w-fit">
                      <Check size={14} className="shrink-0 text-emerald-600 stroke-[3]" />
                      <span>{row.goodkart}</span>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-gray-500 flex items-center gap-1.5">
                      <X size={14} className="shrink-0 text-rose-500" />
                      <span>{row.others}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#1800AD] to-[#3B7CF1] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-base">Ready to start with 0% commission?</h4>
                  <p className="text-xs text-blue-100">Join over 50,000+ happy suppliers across India today.</p>
                </div>
                <button
                  onClick={() => window.location.href = '#/seller/register'}
                  className="px-6 py-2.5 rounded-xl bg-white text-[#1800AD] font-bold text-xs hover:bg-blue-50 transition-all shadow-md whitespace-nowrap"
                >
                  Start Selling Now &rarr;
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN 4: MODERN BENTO FEATURE CARDS                          */}
        {/* ------------------------------------------------------------- */}
        {selectedDesign === 4 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {FEATURES_DATA.map((feat, i) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="group bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                          style={{ backgroundColor: feat.lightBg, color: feat.color }}
                        >
                          <IconComponent size={26} strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100/90 text-gray-700 border border-gray-200/60 group-hover:bg-blue-50 group-hover:text-[#1800AD] transition-colors">
                          {feat.tag}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1800AD] transition-colors font-['Outfit',sans-serif]">
                        {feat.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {feat.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle2 size={15} />
                        <span>{feat.benefit}</span>
                      </div>
                      <span className="text-xs font-black text-gray-400 group-hover:text-[#1800AD] transition-colors">
                        {feat.stat}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
}
