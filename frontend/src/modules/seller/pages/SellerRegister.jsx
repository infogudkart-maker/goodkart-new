import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload, Camera, Store, User, Phone, CreditCard, Loader, ImagePlus, X } from 'lucide-react';
import { API_BASE } from '@/modules/shared/utils/api';

export const SellerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // 'upload' or 'manual'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.removeItem('sellerAadhaarData');
  }, []);

  // Only personal details handled in this step
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    aadhaarNumber: '',
    age: ''
  });

  // Aadhaar image upload state for manual entry
  const [aadhaarImageFile, setAadhaarImageFile] = useState(null);
  const [aadhaarImagePreview, setAadhaarImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAadhaarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('aadharImage', file);

      const response = await fetch(`${API_BASE}/auth/extract-aadhar`, {
        method: 'POST',
        body: data // FormData — browser sets Content-Type automatically
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Save to localStorage as a primary backup for the next page
        const extracted = {
          fullName: result.data.fullName || result.data.name || '',
          aadhaarNumber: (result.data.aadhaarNumber || result.data.aadharNumber || result.data.aadhaar_no || '').replace(/\D/g, ''),
          phoneNumber: (result.data.phoneNumber || result.data.phone || result.data.phoneNumber || '').replace(/\D/g, ''),
          age: result.data.age || '',
          shopAddress: result.data.address || '',
          aadhaarImageUrl: result.data.imageUrl || ''
        };
        localStorage.setItem('sellerAadhaarData', JSON.stringify(extracted));

        // Navigate immediately to onboarding page with extracted data
        navigate('/seller/onboarding', {
          state: { extractedData: extracted }
        });
      } else {
        setError(result.message || 'Failed to extract Aadhaar details. Please try again or enter manually.');
      }
    } catch (err) {
      console.error('Aadhaar Extration Error:', err);
      setError('An error occurred while connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    setStep('manual');
    setError('');
  };

  const handleAadhaarImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setAadhaarImageFile(file);
    setAadhaarImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const removeAadhaarImage = () => {
    setAadhaarImageFile(null);
    if (aadhaarImagePreview) {
      URL.revokeObjectURL(aadhaarImagePreview);
      setAadhaarImagePreview(null);
    }
  };

  const uploadAadhaarImage = async () => {
    if (!aadhaarImageFile) return null;

    const data = new FormData();
    data.append('image', aadhaarImageFile);

    const response = await fetch(`${API_BASE}/auth/upload-image`, {
      method: 'POST',
      body: data
    });

    const result = await response.json();
    if (result.success && result.url) {
      return result.url;
    }
    throw new Error(result.message || 'Failed to upload Aadhaar image');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName || !formData.phoneNumber || !formData.aadhaarNumber || !formData.age) {
      setError('Please fill in all personal details.');
      return;
    }

    if (!aadhaarImageFile) {
      setError('Aadhaar card image is mandatory. Please upload your Aadhaar card image.');
      return;
    }

    if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      let aadhaarImageUrl = '';

      // Upload Aadhaar image to Cloudinary if selected
      if (aadhaarImageFile) {
        setUploadingImage(true);
        aadhaarImageUrl = await uploadAadhaarImage();
        setUploadingImage(false);
      }

      // Navigate to onboarding page with manually entered data + image URL
      navigate('/seller/onboarding', {
        state: {
          extractedData: {
            ...formData,
            aadhaarImageUrl
          }
        }
      });
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.message || 'Failed to upload Aadhaar image. Please try again.');
      setUploadingImage(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Branding & Info */}
      <div className="lg:w-[45%] bg-brand p-8 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Abstract Circles Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] aspect-square rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10">
          <Link to="/seller" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-12 transition-colors">
            <ArrowLeft size={20} /> Back to Goodkart
          </Link>

          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Store size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Seller Center</h3>
              <p className="text-white/60 text-sm">Goodkart for Business</p>
            </div>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Grow your business with Goodkart
          </h1>
          <p className="text-xl text-white/80 max-w-md mb-12">
            Reach millions of customers and scale your brand with powerful selling tools.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-sm font-semibold">Sales Analytics</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-sm font-semibold">Inventory Mgmt</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-sm font-semibold">Growth Insights</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-sm font-semibold">Fast Payouts</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12">
          <p className="text-sm text-white/60">
            By logging in, you agree to Goodkart's Seller <Link to="#" className="underline">Terms of Service</Link>
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 p-8 lg:p-12 border border-gray-100 relative"
        >
          {step === 'upload' ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Identity</h2>
              <p className="text-gray-500 mb-10">Upload your Aadhaar card for quick verification and automatic field filling.</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <label className="block relative">
                  {loading && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
                      <Loader className="animate-spin text-brand mb-2" size={32} />
                      <p className="text-brand font-medium">Extracting Details...</p>
                    </div>
                  )}
                  <div className={`w-full h-48 rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center transition-all group ${!loading ? 'cursor-pointer hover:bg-blue-50' : ''}`}>
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-brand mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload size={28} />
                    </div>
                    <p className="font-bold text-brand">Upload Aadhaar Card</p>
                    <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, PDF</p>
                    <input type="file" className="hidden" onChange={handleAadhaarUpload} accept="image/*,application/pdf" disabled={loading} />
                  </div>
                </label>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-400">OR</span>
                  </div>
                </div>

                <button
                  onClick={handleManualEntry}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-brand py-4 font-bold text-brand hover:bg-brand/5 transition-all disabled:opacity-50"
                >
                  Enter Details Manually
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Details</h2>
                <p className="text-gray-500">Please enter your basic personal details manually to proceed.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleManualSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <User size={16} /> Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name as per Aadhaar"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <CreditCard size={16} /> Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter 12-digit Aadhaar number"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 text-right">{formData.aadhaarNumber.length}/12</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Phone size={16} /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                      placeholder="Enter 10-digit phone number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                    <p className="text-xs text-gray-500 text-right">{formData.phoneNumber.length}/10</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <User size={16} /> Age *
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Enter your age"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                </div>

                {/* Aadhaar Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <ImagePlus size={16} /> Aadhaar Card Image <span className="text-xs font-normal text-red-500">(Required *)</span>
                  </label>
                  {!aadhaarImagePreview ? (
                    <label className="block cursor-pointer">
                      <div className="w-full h-36 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center justify-center transition-all hover:bg-blue-50 hover:border-blue-300 group">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          <Camera size={22} />
                        </div>
                        <p className="text-sm font-semibold text-brand">Upload Aadhaar Image</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG • Max 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleAadhaarImageSelect}
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-50/30">
                      <img
                        src={aadhaarImagePreview}
                        alt="Aadhaar Preview"
                        className="w-full h-40 object-contain bg-gray-50 p-2"
                      />
                      <button
                        type="button"
                        onClick={removeAadhaarImage}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X size={16} />
                      </button>
                      <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle2 size={14} />
                        <span className="font-medium">Image selected — will be uploaded on submit</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-brand py-4 font-bold text-white shadow-xl shadow-brand/20 hover:bg-brand-hover transition-all active:scale-[0.98] mt-4 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      {uploadingImage ? 'Uploading Image...' : 'Processing...'}
                    </>
                  ) : (
                    'Continue to Onboarding'
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};


