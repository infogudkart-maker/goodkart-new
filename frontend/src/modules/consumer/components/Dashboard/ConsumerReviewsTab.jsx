import { Star, Package } from 'lucide-react';

export default function ConsumerReviewsTab({ reviewableOrders, onWriteReview }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Write Reviews</h2>
                <p className="text-sm text-gray-500 mt-1">Share your experience with products you've purchased</p>
            </div>
            <div className="p-6">
                {reviewableOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <Star size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No products to review</p>
                        <p className="text-sm text-gray-400">Products from delivered orders will appear here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewableOrders.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.productImage ? (
                                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-400" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.productName}</h3>
                                        <p className="text-xs text-gray-500 mb-2">Delivered on {item.deliveredDate}</p>
                                        <button onClick={() => onWriteReview(item)}
                                            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-[#120085] transition-colors flex items-center gap-2">
                                            <Star size={14} /> Write Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

