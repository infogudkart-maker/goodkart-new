import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, CheckCircle2 } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import PersonalInfoStep from '../components/SellerOnboarding/PersonalInfoStep';
import BusinessInfoStep from '../components/SellerOnboarding/BusinessInfoStep';
import VerificationStep from '../components/SellerOnboarding/VerificationStep';

const SellerOnboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const formRef = React.useRef(null);

  // Scroll to top when step changes
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Enhanced seller data state
  const [sellerData, setSellerData] = useState({
    // Personal Details
    fullName: '',
    aadhaarNumber: '',
    phoneNumber: '',
    age: '',

    // Shop Details
    shopAddress: '',
    shopName: '',
    shopCategory: '',

    // GST Details
    hasGST: null, // 'yes' or 'no'
    gstNumber: '',

    // EID Details (for non-GST)
    panNumber: '',
    nameAsPerPAN: '',
    emailId: '',
    state: '',
    pincode: '',
    landmark: '',
    district: '',
    city: '',
    buildingNumber: '',
    streetLocality: '',

    // Pickup Address
    pickupAddress: '',
    pickupStreet: '',
    pickupLandmark: '',
    pickupCity: '',
    pickupState: '',
    pickupPincode: '',

    // Bank Details
    bankAccountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',

    // Supplier Details
    supplierName: '',
    businessType: '',
    productCategory: '',
    contactEmail: '',

    // Aadhaar Image
    aadhaarImageUrl: ''
  });

  // Handle Aadhaar extracted data
  useEffect(() => {
    let extractedData = location.state?.extractedData;

    // Fallback: If nothing in state, check localStorage
    if (!extractedData) {
      try {
        const stored = localStorage.getItem('sellerAadhaarData');
        if (stored) {
          extractedData = JSON.parse(stored);
        }
      } catch (err) { /* ignore parse error */ }
    }

    if (extractedData && (extractedData.fullName || extractedData.aadhaarNumber || extractedData.name || extractedData.aadhaar_no)) {
      setSellerData(prev => ({
        ...prev,
        fullName: extractedData.fullName || extractedData.name || prev.fullName,
        aadhaarNumber: extractedData.aadhaarNumber || extractedData.aadhaar_no || prev.aadhaarNumber,
        phoneNumber: extractedData.phoneNumber || extractedData.phone || prev.phoneNumber,
        age: extractedData.age || prev.age,
        shopAddress: extractedData.shopAddress || prev.shopAddress,
        pincode: extractedData.pincode || prev.pincode,
        aadhaarImageUrl: extractedData.aadhaarImageUrl || prev.aadhaarImageUrl
      }));
    }
  }, [location.state]);

  const updateSellerData = (field, value) => {
    setSellerData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1: // Personal Details & PAN
        return sellerData.fullName &&
          sellerData.aadhaarNumber?.length === 12 &&
          sellerData.phoneNumber?.length === 10 &&
          sellerData.age &&
          sellerData.panNumber?.length === 10 &&
          sellerData.nameAsPerPAN &&
          sellerData.emailId &&
          sellerData.state &&
          sellerData.pincode?.length === 6 &&
          sellerData.district &&
          sellerData.city &&
          sellerData.buildingNumber &&
          sellerData.streetLocality;
      case 2: // Business (Shop, GST, Pickup)
        const shopCatValid = sellerData.shopCategory &&
          (sellerData.shopCategory.startsWith('other:') ? sellerData.shopCategory.length > 6 : true);
        const isBaseValid = sellerData.shopName && shopCatValid && sellerData.hasGST;
        if (!isBaseValid) return false;
        if (sellerData.hasGST === 'yes' && sellerData.gstNumber?.length !== 15) return false;
        const isPickupValid = sellerData.pickupAddress && sellerData.pickupCity && sellerData.pickupState && sellerData.pickupPincode?.length === 6;
        if (!isPickupValid) return false;
        return true;
      case 3: // Bank & Supplier Details
        const prodCatValid = sellerData.productCategory &&
          (sellerData.productCategory.startsWith('other:') ? sellerData.productCategory.length > 6 : true);
        return sellerData.bankAccountName &&
          sellerData.accountNumber &&
          sellerData.ifscCode &&
          sellerData.supplierName &&
          sellerData.businessType &&
          prodCatValid &&
          sellerData.contactEmail;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      setError('Please fill all required fields correctly');
      return;
    }
    setError('');
    if (step < 3) setStep(step + 1);
    else if (step === 3) handleSubmitApplication();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitApplication = async () => {
    if (!validateStep(3)) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build the full address from structured fields
      const fullAddress = [
        sellerData.buildingNumber,
        sellerData.streetLocality,
        sellerData.landmark,
        sellerData.city,
        sellerData.district,
        sellerData.state,
        sellerData.pincode
      ].filter(Boolean).join(', ');

      // Send seller data to backend using authenticated fetch
      const response = await authFetch('/auth/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerDetails: {
            ...sellerData,
            category: sellerData.shopCategory,
            address: fullAddress || sellerData.shopAddress || sellerData.buildingNumber
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Your seller application has been submitted successfully. Our team will review it shortly. You can now return to the seller landing page.');
        
        // Update local session to reflect pending status
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // We set status to PENDING but keep role as is (it will be updated by admin later)
            const updated = { ...userData, status: 'PENDING', sellerStatus: 'PENDING' };
            localStorage.setItem('user', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('userDataChanged', { detail: updated }));
          } catch (e) {
            console.error("Failed to update local user session:", e);
          }
        }
      } else {
        setError(result.message || 'Failed to submit application');
      }
    } catch (err) {
      setError('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PersonalInfoStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} />;
      case 2:
        return <BusinessInfoStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <VerificationStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} prevStep={prevStep} loading={loading} />;
      default:
        return <PersonalInfoStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} />;
    }
  };

  const steps = [
    { id: 1, name: 'Personal Details' },
    { id: 2, name: 'Business & Pickup' },
    { id: 3, name: 'Bank & Supplier' }
  ];

  return (
    <div className="min-h-screen relative bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* 1. Branding Side (Left 50% on desktop, top on mobile) */}
      <div
        className="lg:w-1/2 p-6 sm:p-10 lg:p-20 text-white flex flex-col justify-center relative z-10 min-h-[25vh] lg:min-h-screen"
        style={{ background: 'linear-gradient(135deg, #3B7CF1, #0D0070)' }}
      >
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 lg:mb-12 transition-colors text-sm">
            <ArrowLeft size={18} /> Back to Goodkart
          </Link>

          <div className="flex items-center gap-3 mb-4 lg:mb-12">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Seller Center</h3>
              <p className="text-white/60 text-xs lg:text-sm">Goodkart for Business</p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-6xl font-bold leading-tight mb-3 lg:mb-8">
            Grow your business with Goodkart
          </h1>
          <p className="hidden sm:block text-base lg:text-xl text-white/80 max-w-md mb-6 lg:mb-12">
            Reach millions of customers and scale your brand with powerful selling tools.
          </p>

          <div className="hidden sm:grid grid-cols-2 gap-3 lg:gap-4 max-w-md">
            {['Sales Analytics', 'Inventory Mgmt', 'Growth Insights', 'Fast Payouts'].map(feat => (
              <div key={feat} className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-xs lg:text-sm font-semibold">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Content Side (Right 50% on desktop, full on mobile) */}
      <div className="lg:w-1/2 flex flex-col bg-gray-50 min-h-[60vh] lg:h-screen lg:overflow-hidden">
        {/* Fixed Header with Progress */}
        <div className="z-20 pt-3 pb-3 md:pt-4 md:pb-4 px-3 md:px-6 bg-white border-b border-gray-100 flex flex-col gap-3 md:gap-4">
          <div className="flex items-center justify-start">
            <div className="flex items-center bg-gray-50 rounded-full p-1.5 border border-gray-100">
              {steps.map((stepItem, index) => (
                <React.Fragment key={stepItem.id}>
                  <div
                    className={`flex items-center px-2.5 py-1.5 md:px-4 md:py-2 rounded-full transition-all ${step === stepItem.id ? 'text-white font-semibold' :
                      step > stepItem.id ? 'text-white' : 'text-gray-400'
                      }`}
                    style={step >= stepItem.id ? { backgroundColor: '#3B7CF1' } : {}}
                  >
                    <span className="text-xs font-bold leading-none">
                      {step > stepItem.id ? '✓' : stepItem.id}
                    </span>
                    <span className="ml-2 text-[10px] hidden sm:block uppercase tracking-widest font-bold">
                      {stepItem.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 h-0.5 mx-1 ${step > stepItem.id ? 'bg-[#3B7CF1]' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={formRef}>
          <div className="w-full pb-12">
            <div className="bg-white p-4 md:p-6 border-b border-gray-100 min-h-[50vh] lg:min-h-screen">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {success ? (
                <div className="text-center py-10 px-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="text-green-600" size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
                  <p className="text-gray-600 mb-10 text-lg leading-relaxed">{success}</p>
                  <Link
                    to="/seller"
                    className="inline-flex items-center justify-center gap-2 bg-[#3B7CF1] text-white px-10 py-4 rounded-2xl font-bold hover:brightness-110 transition-all shadow-xl"
                  >
                    <ArrowLeft size={20} /> Back to Seller Page
                  </Link>
                </div>
              ) : (
                renderStep()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;





