import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function CheckoutSuccess({ orderId, shippingAddress, paymentMethod, subtotal, user }) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50/20">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-2xl w-full bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-12 text-center space-y-8 relative overflow-hidden"
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
                <div className="relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                        className="w-24 h-24 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/20 rotate-12"
                    >
                        <ShoppingCart size={48} />
                    </motion.div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        Order <span className="gradient-text">Confirmed</span>
                    </h1>
                    <p className="text-gray-500 text-lg font-medium mt-4 max-w-sm mx-auto">
                        Thank you for your purchase, {shippingAddress.firstName}! Your order is being processed.
                    </p>
                </div>
                <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-400">ORDER ID</span>
                        <span className="text-gray-900 font-mono">#{orderId.substring(0, 10)}</span>
                    </div>
                    <div className="h-px bg-gray-100 w-full" />
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-400">PAYMENT</span>
                        <span className="text-gray-900 uppercase">{paymentMethod}</span>
                    </div>
                    <div className="h-px bg-gray-100 w-full" />
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">TOTAL</span>
                        <span className="text-2xl font-black text-primary">₹{subtotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        onClick={() => window.location.href = `/#/track?orderId=${orderId}`}
                        className="flex-1 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Track Detailed Status
                    </button>
                    <Link
                        to="/dashboard"
                        className="flex-1 py-5 bg-white text-gray-600 rounded-2xl font-black border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-center"
                    >
                        View Dashboard
                    </Link>
                </div>
                <p className="text-xs text-gray-400 font-bold">
                    A confirmation email has been sent to {user?.email}
                </p>
            </motion.div>
        </div>
    );
}

