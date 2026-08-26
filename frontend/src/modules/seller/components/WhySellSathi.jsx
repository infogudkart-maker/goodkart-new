import React from 'react';
import { motion } from 'framer-motion';
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
  ArrowUpRight
} from 'lucide-react';

const features = [
  {
    icon: Percent,
    title: "0% Commission Fee",
    tag: "Maximum Profits",
    description: "Suppliers keep 100% of their earnings. No hidden charges, zero listing fees, and no monthly subscription costs.",
    benefit: "100% Profit to Seller",
    color: "#1800AD",
    bgColor: "#EFF6FF",
    borderColor: "hover:border-blue-300"
  },
  {
    icon: ShieldCheck,
    title: "0 Penalty Charges",
    tag: "Stress-Free Selling",
    description: "Sell online with confidence. Zero penalty charges on late dispatches or unavoidable order cancellations.",
    benefit: "Zero Penalty Guarantee",
    color: "#059669",
    bgColor: "#ECFDF5",
    borderColor: "hover:border-emerald-300"
  },
  {
    icon: TrendingUp,
    title: "Growth For Every Business",
    tag: "Inclusive Onboarding",
    description: "From individual artisans to large manufacturers. Now open even for sellers who don't have a regular GSTIN.",
    benefit: "Non-GSTIN Supported",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    borderColor: "hover:border-purple-300"
  },
  {
    icon: Zap,
    title: "Ease of Doing Business",
    tag: "Fast & Automated",
    description: "1-click bulk product uploads, integrated low-cost shipping, and automated inventory sync with real-time alerts.",
    benefit: "Automated Workflows",
    color: "#EA580C",
    bgColor: "#FFF7ED",
    borderColor: "hover:border-orange-300"
  },
  {
    icon: Clock,
    title: "7-Day Fast Payment Cycle",
    tag: "Healthy Cashflow",
    description: "Direct bank payouts deposited within 7 days from the date of order delivery without arbitrary holding periods.",
    benefit: "Reliable Weekly Payouts",
    color: "#0284C7",
    bgColor: "#F0F9FF",
    borderColor: "hover:border-cyan-300"
  },
  {
    icon: Sparkles,
    title: "Free Visibility & Ad Boost",
    tag: "First 30 Days Free",
    description: "Get higher product ranking and dedicated promotional slots with complementary advertising credits for new sellers.",
    benefit: "Free Ad Credits Included",
    color: "#DB2777",
    bgColor: "#FDF2F8",
    borderColor: "hover:border-pink-300"
  }
];

const WhyGoodkart = () => {
  return (
    <section id="why-choose-us" className="py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#1800AD] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm"
          >
            <Coins size={14} className="text-[#3B7CF1]" />
            Seller Advantage
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight font-['Outfit',sans-serif]"
          >
            Why Suppliers Love Selling On Goodkart
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            We built an ecosystem that prioritizes your profits, simplifies logistics, and puts total control back into your hands.
          </motion.p>
        </div>

        {/* Perfectly Balanced 3-Column Feature Cards Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className={`group relative bg-white rounded-3xl p-7 sm:p-8 border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between ${feature.borderColor}`}
                >
                  <div>
                    {/* Card Top: Icon & Tag */}
                    <div className="flex items-center justify-between mb-6">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: feature.bgColor, color: feature.color }}
                      >
                        <IconComponent size={26} strokeWidth={2.2} />
                      </div>
                      
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100/90 text-gray-700 border border-gray-200/60 group-hover:bg-blue-50 group-hover:text-[#1800AD] group-hover:border-blue-200 transition-colors">
                        {feature.tag}
                      </span>
                    </div>

                    {/* Card Title & Description */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1800AD] transition-colors font-['Outfit',sans-serif]">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {feature.description}
                    </p>
                  </div>

                  {/* Card Bottom: Verified Benefit Pill */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 size={15} />
                      <span>{feature.benefit}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1800AD] group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                      <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyGoodkart;
