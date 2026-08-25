import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INDIAN_STATES, CITY_DATA } from './onboardingConfig';
import { SELLER_CATEGORIES } from '@/modules/shared/config/categories';

export default function BusinessInfoStep({ sellerData, updateSellerData, nextStep, prevStep }) {
  const [customShopCategory, setCustomShopCategory] = useState(
    sellerData.shopCategory?.startsWith('other:') ? sellerData.shopCategory.slice(6) : ''
  );
  const handleGSTSelection = (hasGST) => updateSellerData('hasGST', hasGST);

  const availableCities = CITY_DATA[sellerData.pickupState] || [];
  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1] text-sm";
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const isFormValid = () => {
    // 1. Business basic info
    const isBaseValid = sellerData.shopName && sellerData.shopCategory && sellerData.hasGST;
    if (!isBaseValid) return false;

    // 2. GST validation if 'yes'
    if (sellerData.hasGST === 'yes') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(sellerData.gstNumber)) return false;
    }

    // 3. Pickup Address validation
    const isPickupValid = sellerData.pickupAddress &&
      sellerData.pickupCity &&
      sellerData.pickupState &&
      sellerData.pickupPincode?.length === 6;

    if (!isPickupValid) return false;

    return true;
  };

  return (
    <div className="bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Business & GST Details</h2>
        <p className="text-gray-500">Tell us about your shop and pickup location</p>
      </div>

      <div className="space-y-8">
        {/* Core Shop Definition Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name *</label>
            <input
              type="text"
              value={sellerData.shopName}
              onChange={(e) => updateSellerData('shopName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
              placeholder="Enter your shop name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Category *</label>
            <select
              value={sellerData.shopCategory?.toLowerCase().startsWith('other:') ? 'Other' : sellerData.shopCategory}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Other') {
                  setCustomShopCategory('');
                  updateSellerData('shopCategory', 'other:');
                } else {
                  setCustomShopCategory('');
                  updateSellerData('shopCategory', val);
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
            {(sellerData.shopCategory?.toLowerCase().startsWith('other:') || sellerData.shopCategory === 'Other') && (
              <input
                type="text"
                value={customShopCategory}
                onChange={(e) => {
                  setCustomShopCategory(e.target.value);
                  updateSellerData('shopCategory', `other:${e.target.value}`);
                }}
                className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
                placeholder="Please specify your shop category"
              />
            )}
          </div>
        </div>

        {/* GST Toggle Form */}
        <div className="border-t pt-8">
          <label className="block text-lg font-medium text-gray-900 mb-4 text-center">Do you have a GST Number? *</label>
          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={() => handleGSTSelection('yes')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${sellerData.hasGST === 'yes' ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              style={sellerData.hasGST === 'yes' ? { backgroundColor: '#3B7CF1' } : {}}
            >
              Yes
            </button>
            <button
              onClick={() => handleGSTSelection('no')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${sellerData.hasGST === 'no' ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              style={sellerData.hasGST === 'no' ? { backgroundColor: '#3B7CF1' } : {}}
            >
              No
            </button>
          </div>

          {/* Conditional Rendering Blocks */}
          {sellerData.hasGST === 'yes' && (
            <div className="max-w-md mx-auto space-y-4 animate-in fade-in zoom-in duration-200">
              <label className="block text-sm font-medium text-gray-700">GST Number *</label>
              <input
                type="text"
                maxLength={15}
                value={sellerData.gstNumber}
                onChange={(e) => updateSellerData('gstNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1]"
                placeholder="Enter 15-character GST number"
              />
              {sellerData.gstNumber && !gstRegex.test(sellerData.gstNumber) && (
                <p className="text-red-500 text-xs mt-1 font-medium">Invalid GST format. Enter valid 15-character GST.</p>
              )}
            </div>
          )}

          {sellerData.hasGST === 'no' && (
            <div className="space-y-6 pt-4 border-t border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100 mb-6 flex items-center justify-center gap-3">
                <CheckCircle2 size={24} className="shrink-0 text-[#3B7CF1]" />
                <p>Tax-exempt flow. PAN verified in previous step.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pickup Address Section */}
        <div className="border-t pt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Pickup Address</h2>
            <p className="text-gray-500 text-sm">Where should we pick up your products?</p>
          </div>

          <div className="space-y-4">
            {/* Building / Plot */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plot / Building / House No. *</label>
              <input type="text" value={sellerData.pickupAddress}
                onChange={(e) => updateSellerData('pickupAddress', e.target.value)}
                className={inp} placeholder="e.g. Plot 12, Flat 3A, Shop No. 5" />
            </div>

            {/* Street */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Street / Road Name *</label>
              <input type="text" value={sellerData.pickupStreet || ''}
                onChange={(e) => updateSellerData('pickupStreet', e.target.value)}
                className={inp} placeholder="e.g. MG Road, Sector 21, Industrial Area" />
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Landmark</label>
              <input type="text" value={sellerData.pickupLandmark}
                onChange={(e) => updateSellerData('pickupLandmark', e.target.value)}
                className={inp} placeholder="e.g. Near Bus Stand, Opp. City Hospital" />
            </div>

            {/* State & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                <select value={sellerData.pickupState}
                  onChange={(e) => { updateSellerData('pickupState', e.target.value); updateSellerData('pickupCity', ''); }}
                  className={inp + " bg-white"}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City *</label>
                {availableCities.length > 0 ? (
                  <select value={sellerData.pickupCity}
                    onChange={(e) => updateSellerData('pickupCity', e.target.value)}
                    className={inp + " bg-white"}>
                    <option value="">Select City</option>
                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input type="text" value={sellerData.pickupCity}
                    onChange={(e) => updateSellerData('pickupCity', e.target.value)}
                    className={inp} placeholder="Enter city name" />
                )}
              </div>
            </div>

            {/* Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pincode *</label>
                <input type="text" maxLength={6} value={sellerData.pickupPincode}
                  onChange={(e) => updateSellerData('pickupPincode', e.target.value.replace(/\D/g, ''))}
                  className={inp} placeholder="6-digit pincode" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 border-t pt-8">
          <button
            onClick={prevStep}
            className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={!isFormValid()}
            style={{ backgroundColor: '#3B7CF1' }}
            className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
}





