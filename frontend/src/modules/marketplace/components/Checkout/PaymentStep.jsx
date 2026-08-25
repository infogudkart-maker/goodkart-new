import React from 'react';
import { CreditCard, Banknote, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentStep({
    step,
    paymentMethod,
    setPaymentMethod,
    finalTotal,
    razorpayLoading,
    loading,
    handleContinue
}) {
    return (
        <section className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all ${step < 2 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div className="p-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">2</div>
                    Secure Payment Method
                </h3>
            </div>

            <div className="p-4 space-y-3">
                {/* Pay Online Option */}
                <div
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'razorpay' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentMethod === 'razorpay' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                            <CreditCard size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Pay Online</h4>
                            <p className="text-xs text-gray-500">Cards, UPI, Netbanking, Wallets</p>
                        </div>
                        {paymentMethod === 'razorpay' && (
                            <div className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                Secure
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {paymentMethod === 'razorpay' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-gray-100"
                            >
                                <div className="bg-blue-50/50 p-3 rounded-lg mb-3 border border-blue-100">
                                    <p className="text-xs text-gray-600">
                                        You'll be redirected to Razorpay for secure payment
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-700 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleContinue();
                                    }}
                                    disabled={razorpayLoading}
                                >
                                    {razorpayLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Shield size={16} />
                                            Pay ₹{finalTotal.toLocaleString()}
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Cash on Delivery Option */}
                <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                            <Banknote size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Cash on Delivery</h4>
                            <p className="text-xs text-gray-500">Pay when you receive</p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {paymentMethod === 'cod' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-gray-100"
                            >
                                <div className="bg-amber-50/50 p-3 rounded-lg mb-3 border border-amber-100">
                                    <p className="text-xs text-gray-600 text-center">
                                        Pay online for safer delivery
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleContinue();
                                    }}
                                    disabled={loading || razorpayLoading}
                                >
                                    {loading ? 'Processing...' : 'Place Order'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}


