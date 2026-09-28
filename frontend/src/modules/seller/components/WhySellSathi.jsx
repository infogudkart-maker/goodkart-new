import React from 'react';
import { motion } from 'framer-motion';
import { 
  Percent, 
  ShieldAlert, 
  TrendingUp, 
  Zap, 
  Eye, 
  Ban, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    id: 'commission',
    icon: Percent,
    title: "0% Commission Fee",
    tag: "100% Profit to You",
    description: "Suppliers keep 100% of profit. No hidden charges, no listing fees, no subscription costs.",
    color: "#1800AD",
    borderAccent: "border-l-[#1800AD]",
    bgHover: "hover:border-[#1800AD]/40",
    iconBg: "bg-blue-50 text-[#1800AD]"
  },
  {
    id: 'penalty',
    icon: ShieldAlert,
    title: "0 Penalty Charges",
    tag: "Stress-Free Operations",
    description: "Sell online without the fear of order cancellation charges with 0 Penalty for late dispatch.",
    color: "#059669",
    borderAccent: "border-l-[#059669]",
    bgHover: "hover:border-[#059669]/40",
    iconBg: "bg-emerald-50 text-[#059669]"
  },
  {
    id: 'growth',
    icon: TrendingUp,
    title: "Growth for Every Supplier",
    tag: "Non-GSTIN Supported",
    description: "From small to large, and now open for sellers who don't have a Regular GSTIN too.",
    color: "#7C3AED",
    borderAccent: "border-l-[#7C3AED]",
    bgHover: "hover:border-[#7C3AED]/40",
    iconBg: "bg-purple-50 text-[#7C3AED]"
  },
  {
    id: 'business',
    icon: Zap,
    title: "Ease of Doing Business",
    tag: "7-Day Payment Cycle",
    description: "Easy Product Listing, Lowest Cost Shipping, and 7-Day Payment Cycle from the delivery date.",
    color: "#EA580C",
    borderAccent: "border-l-[#EA580C]",
    bgHover: "hover:border-[#EA580C]/40",
    iconBg: "bg-orange-50 text-[#EA580C]"
  },
  {
    id: 'visibility',
    icon: Eye,
    title: "Free Catalog Visibility",
    tag: "First 30 Days Free",
    description: "Run advertisements for your catalogs to increase visibility. Free ad credit for first 30 days.",
    color: "#DB2777",
    borderAccent: "border-l-[#DB2777]",
    bgHover: "hover:border-[#DB2777]/40",
    iconBg: "bg-pink-50 text-[#DB2777]"
  },
  {
    id: 'cancellation',
    icon: Ban,
    title: "No Order Cancellation Charges",
    tag: "Zero Deduction",
    description: "Cancel orders that you can't fulfill for unforeseen reasons without worrying about penalties.",
    color: "#0284C7",
    borderAccent: "border-l-[#0284C7]",
    bgHover: "hover:border-[#0284C7]/40",
    iconBg: "bg-cyan-50 text-[#0284C7]"
  }
];

export default function WhyGoodkart() {
  return (
    <section id="grow-business" className="py-20 lg:py-24 bg-gradient-to-b from-white via-gray-50/60 to-white relative overflow-hidden border-t border-gray-100">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[#1800AD] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles size={14} className="text-[#3B7CF1]" />
            Seller Advantages
          </div>
          
          <h2 className="section-title text-gray-900 mb-4">
            Why Suppliers Love Goodkart
          </h2>
          
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            We've built an ecosystem that prioritizes your profit and growth. Join India's most supplier-friendly marketplace.
          </p>
        </div>

        {/* 2-Column Wide Horizontal Accent Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.25 }}
                className={`group bg-white rounded-2xl p-6 border border-gray-200/90 border-l-4 ${item.borderAccent} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  {/* Top Row: Icon + Title + Right Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.iconBg} group-hover:scale-105 transition-transform`}>
                        <Icon size={22} strokeWidth={2.2} />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#1800AD] transition-colors font-['Outfit',sans-serif]">
                        {item.title}
                      </h3>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100/90 text-gray-700 border border-gray-200/60 shrink-0 whitespace-nowrap">
                      {item.tag}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed pl-[56px] pr-2 mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Verified Benefit Indicator */}
                <div className="pl-[56px] pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Verified Benefit
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}