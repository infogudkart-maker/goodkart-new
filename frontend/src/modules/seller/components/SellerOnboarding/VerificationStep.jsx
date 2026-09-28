import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { SELLER_CATEGORIES } from '@/modules/shared/config/categories';

export default function VerificationStep({ sellerData, updateSellerData, nextStep, prevStep, loading }) {
  const [customProductCategory, setCustomProductCategory] = useState(
    sellerData.productCategory?.startsWith('other:') ? sellerData.productCategory.slice(6) : ''
  );

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
  const isUpiValid = !sellerData.upiId || upiRegex.test(sellerData.upiId);

  const isFormValid = sellerData.bankAccountName &&
    sellerData.accountNumber &&
    ifscRegex.test(sellerData.ifscCode) &&
    isUpiValid &&
    sellerData.supplierName &&
    sellerData.businessType &&
    sellerData.productCategory &&
    (sellerData.productCategory.startsWith('other:') ? sellerData.productCategory.length > 6 : true) &&
    sellerData.contactEmail;

  return (
    <div className="bg-white">
      {/* Bank Details Section */}
      <div className="mb-8 border-b pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bank Details</h2>
        <p className="text-gray-500">Provide your payout information</p>

        <div className="space-y-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={sellerData.bankAccountName}
              onChange={(e) => updateSellerData('bankAccountName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
              placeholder="Enter account holder name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              maxLength={18}
              value={sellerData.accountNumber}
              onChange={(e) => updateSellerData('accountNumber', e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
              placeholder="Enter account number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                maxLength={11}
                value={sellerData.ifscCode}
                onChange={(e) => updateSellerData('ifscCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
                placeholder="Enter 11-char IFSC code"
              />
              {sellerData.ifscCode && !ifscRegex.test(sellerData.ifscCode) && (
                <p className="text-red-500 text-xs mt-1 font-medium italic">Invalid IFSC. Example: ABCD0123456</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID (Optional)
              </label>
              <input
                type="text"
                value={sellerData.upiId}
                onChange={(e) => updateSellerData('upiId', e.target.value.replace(/[^a-zA-Z0-9.\-@]/g, '').toLowerCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
                placeholder="e.g. name@bank"
              />
              {sellerData.upiId && !upiRegex.test(sellerData.upiId) && (
                <p className="text-red-500 text-xs mt-1 font-medium italic">Invalid UPI ID format.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Details Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Supplier Details</h2>
        <p className="text-gray-600">Final information about your business</p>

        <div className="space-y-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name *
            </label>
            <input
              type="text"
              value={sellerData.supplierName}
              onChange={(e) => updateSellerData('supplierName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              value={sellerData.businessType}
              onChange={(e) => updateSellerData('businessType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
            >
              <option value="">Select Business Type</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="llp">LLP</option>
              <option value="pvt-ltd">Private Limited</option>
              <option value="public-ltd">Public Limited</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Category *
            </label>
            <select
              value={sellerData.productCategory?.startsWith('other:') ? 'other' : sellerData.productCategory}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'other') {
                  setCustomProductCategory('');
                  updateSellerData('productCategory', 'other:');
                } else {
                  setCustomProductCategory('');
                  updateSellerData('productCategory', val);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
            >
              <option value="">Select Category</option>
              {SELLER_CATEGORIES.filter(cat => cat !== 'Others').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value="other">Other</option>
            </select>
            {(sellerData.productCategory?.startsWith('other:') || sellerData.productCategory === 'other') && (
              <input
                type="text"
                value={customProductCategory}
                onChange={(e) => {
                  setCustomProductCategory(e.target.value);
                  updateSellerData('productCategory', `other:${e.target.value}`);
                }}
                className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
                placeholder="Please specify your product category"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              value={sellerData.contactEmail}
              onChange={(e) => updateSellerData('contactEmail', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
              placeholder="Enter contact email"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-8 border-t">
        <button
          onClick={prevStep}
          disabled={loading}
          className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!isFormValid || loading}
          style={{ backgroundColor: '#3B7CF1' }}
          className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <React.Fragment>
              <Loader className="animate-spin" size={18} />
              Submitting...
            </React.Fragment>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>
    </div>
  );
}




