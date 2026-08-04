import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { INDIAN_STATES, CITY_DATA } from './onboardingConfig';
import { useNavigate } from 'react-router-dom';

// Validation helpers
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PersonalInfoStep({ sellerData, updateSellerData, nextStep }) {
  const navigate = useNavigate();
  const availableCities = CITY_DATA[sellerData.state] || [];
  const [validationErrors, setValidationErrors] = useState({});

  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    switch (field) {
      case 'panNumber':
        if (value && value.length === 10 && !PAN_REGEX.test(value)) {
          errors.panNumber = 'PAN must follow format: ABCDE1234F (5 letters, 4 digits, 1 letter)';
        } else {
          delete errors.panNumber;
        }
        break;
      case 'emailId':
        if (value && !EMAIL_REGEX.test(value)) {
          errors.emailId = 'Please enter a valid email address';
        } else {
          delete errors.emailId;
        }
        break;
      case 'aadhaarNumber':
        if (value && value.length === 12 && !/^\d{12}$/.test(value)) {
          errors.aadhaarNumber = 'Aadhaar must be exactly 12 digits';
        } else {
          delete errors.aadhaarNumber;
        }
        break;
      case 'phoneNumber':
        if (value && value.length === 10 && !/^\d{10}$/.test(value)) {
          errors.phoneNumber = 'Phone number must be exactly 10 digits';
        } else {
          delete errors.phoneNumber;
        }
        break;
      case 'pincode':
        if (value && value.length === 6 && !/^\d{6}$/.test(value)) {
          errors.pincode = 'Pincode must be exactly 6 digits';
        } else {
          delete errors.pincode;
        }
        break;
      default:
        break;
    }
    setValidationErrors(errors);
  };

  const handleFieldChange = (field, value) => {
    updateSellerData(field, value);
    validateField(field, value);
  };

  const isFormValid = sellerData.fullName &&
    sellerData.aadhaarNumber?.length === 12 &&
    sellerData.phoneNumber?.length === 10 &&
    sellerData.age &&
    sellerData.panNumber?.length === 10 &&
    PAN_REGEX.test(sellerData.panNumber) &&
    sellerData.nameAsPerPAN &&
    sellerData.emailId &&
    EMAIL_REGEX.test(sellerData.emailId) &&
    sellerData.state &&
    sellerData.pincode?.length === 6 &&
    sellerData.district &&
    sellerData.city &&
    sellerData.buildingNumber &&
    sellerData.streetLocality &&
    Object.keys(validationErrors).length === 0;

  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7CF1] focus:border-[#3B7CF1] text-sm";

  return (
    <div className="bg-white">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/seller/register')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
        </div>
        <p className="text-gray-500 text-sm ml-[68px]">Provide your legal information carefully</p>
      </div>

      <div className="space-y-5">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
            <input type="text" value={sellerData.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              className={inp} placeholder="Enter your full name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Number (Locked) *</label>
            <input type="text" readOnly value={sellerData.aadhaarNumber}
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed text-sm"
              placeholder="12-digit Aadhaar number" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label>
            <input type="tel" maxLength={10} value={sellerData.phoneNumber}
              onChange={(e) => handleFieldChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
              className={inp} placeholder="10-digit phone number" />
            {validationErrors.phoneNumber && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{validationErrors.phoneNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Age (Locked) *</label>
            <input type="text" readOnly value={sellerData.age}
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed text-sm"
              placeholder="Age" />
          </div>
        </div>

        {/* PAN Section */}
        <div className="border-t pt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">PAN & Identity Details</h3>
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 mb-4 flex gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-[#3B7CF1] mt-0.5" />
            <p>Identity data (EID) allows tax-exempt selling without a GST certificate.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PAN Number *</label>
              <input type="text" maxLength={10} value={sellerData.panNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  handleFieldChange('panNumber', val);
                }}
                className={`${inp} ${validationErrors.panNumber ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="e.g. ABCDE1234F" />
              {validationErrors.panNumber && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{validationErrors.panNumber}</p>
              )}
              {sellerData.panNumber?.length === 10 && PAN_REGEX.test(sellerData.panNumber) && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12} />Valid PAN format</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name as per PAN *</label>
              <input type="text" value={sellerData.nameAsPerPAN}
                onChange={(e) => updateSellerData('nameAsPerPAN', e.target.value)}
                className={inp} placeholder="Legal name on PAN card" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Email ID *</label>
          <input type="email" value={sellerData.emailId}
            onChange={(e) => handleFieldChange('emailId', e.target.value)}
            className={`${inp} ${validationErrors.emailId ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="your@business.com" />
          {validationErrors.emailId && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{validationErrors.emailId}</p>
          )}
          {sellerData.emailId && EMAIL_REGEX.test(sellerData.emailId) && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12} />Valid email format</p>
          )}
        </div>

        {/* Address Section */}
        <div className="border-t pt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Shop / Business Address</h3>
          <div className="space-y-4">
            {/* Plot / Building */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plot / Building / House No. *</label>
                <input type="text" value={sellerData.buildingNumber}
                  onChange={(e) => updateSellerData('buildingNumber', e.target.value)}
                  className={inp} placeholder="e.g. Plot 12, Flat 3A" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Street / Road Name *</label>
                <input type="text" value={sellerData.streetLocality}
                  onChange={(e) => updateSellerData('streetLocality', e.target.value)}
                  className={inp} placeholder="e.g. MG Road, Sector 21" />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Landmark</label>
              <input type="text" value={sellerData.landmark}
                onChange={(e) => updateSellerData('landmark', e.target.value)}
                className={inp} placeholder="e.g. Near City Mall, Opp. Bus Stand" />
            </div>

            {/* State & District Dropdowns (SWAPPED: City first, District after) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                <select value={sellerData.state}
                  onChange={(e) => { updateSellerData('state', e.target.value); updateSellerData('city', ''); updateSellerData('district', ''); }}
                  className={inp + " bg-white"}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">District *</label>
                {availableCities.length > 0 ? (
                  <select value={sellerData.district}
                    onChange={(e) => updateSellerData('district', e.target.value)}
                    className={inp + " bg-white"}>
                    <option value="">Select District</option>
                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input type="text" value={sellerData.district}
                    onChange={(e) => updateSellerData('district', e.target.value)}
                    className={inp} placeholder="Enter district name" />
                )}
              </div>
            </div>

            {/* City & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City *</label>
                <input type="text" value={sellerData.city}
                  onChange={(e) => updateSellerData('city', e.target.value)}
                  className={inp} placeholder="e.g. Mumbai, Bengaluru" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pincode *</label>
                <input type="text" maxLength={6} value={sellerData.pincode}
                  onChange={(e) => handleFieldChange('pincode', e.target.value.replace(/\D/g, ''))}
                  className={inp} placeholder="6-digit pincode" />
                {validationErrors.pincode && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{validationErrors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <button onClick={() => navigate('/seller/register')}
            className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={nextStep} disabled={!isFormValid}
            style={{ backgroundColor: '#3B7CF1' }}
            className="px-8 py-3 text-white font-bold rounded-xl shadow-md hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}





