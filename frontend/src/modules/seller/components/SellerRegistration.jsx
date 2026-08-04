import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, Store, User, Phone, CreditCard, MapPin, Tag, Loader } from 'lucide-react';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';
import { SELLER_CATEGORIES } from '@/modules/shared/config/categories';

export default function SellerRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', phoneNumber: '', aadhaarNumber: '', age: '',
    shopAddress: '', shopName: '', shopCategory: '', aadhaarImageUrl: ''
  });
  const [aadhaarPreview, setAadhaarPreview] = useState(null);

  const handleAadhaarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setAadhaarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    const formDataUpload = new FormData();
    formDataUpload.append('aadharImage', file);

    try {
      const response = await authFetch('/auth/extract-aadhar', {
        method: 'POST', body: formDataUpload
      });
      const result = await response.json();

      if (result.success) {
        const extractedData = {
          fullName: result.data.name || '',
          aadhaarNumber: result.data.aadharNumber || '',
          phoneNumber: result.data.phone || '',
          age: result.data.age || '',
          shopAddress: result.data.address || '',
          pincode: result.data.pincode || '',
          aadhaarImageUrl: result.data.imageUrl || ''
        };
        localStorage.setItem('sellerAadhaarData', JSON.stringify(extractedData));
        navigate('/seller/onboarding', { state: { extractedData } });
      } else {
        const detailedError = result.error ? ` (${result.error})` : '';
        setError((result.message || 'Extraction failed') + detailedError);
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Server connection failed. Make sure backend is running.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualEntry = () => navigate('/seller/onboarding');

  const handleSubmitSellerApplication = async (e) => {
    e.preventDefault();
    if (!formData.shopName || !formData.shopCategory) {
      setError('Please fill in shop name and category');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const firebaseUser = auth.currentUser;
      let payload = {};
      
      const sessionUserStr = localStorage.getItem('user');
      const sessionUser = sessionUserStr ? JSON.parse(sessionUserStr) : null;

      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        payload = { idToken };
      } else {
        if (!sessionUser?.uid) {
          setError('Session expired. Please login again.');
          setLoading(false);
          return;
        }
        payload = { uid: sessionUser.uid };
      }

      const response = await authFetch('/auth/apply-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sellerDetails: {
            phone: formData.phoneNumber, shopName: formData.shopName,
            category: formData.shopCategory, address: formData.shopAddress,
            fullName: formData.fullName, aadhaarNumber: formData.aadhaarNumber,
            age: formData.age, aadhaarImageUrl: formData.aadhaarImageUrl,
            extractedName: formData.fullName
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Application submitted successfully! Your account is now under review.');
        setTimeout(() => {}, 2000);
      } else {
        setError(result.message || 'Application submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      <div className="lg:w-1/2 p-6 sm:p-10 lg:p-20 text-white flex flex-col justify-center relative min-h-[25vh] lg:min-h-screen" style={{ background: 'linear-gradient(135deg, #3B7CF1 0%, #120085 50%, #0D0070 100%)' }}>
        <div className="relative z-10">
          <Link to="/seller" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 lg:mb-12 transition-colors text-sm">
            <ArrowLeft size={18} /> Back to Goodkart
          </Link>
          <div className="flex items-center gap-3 mb-4 lg:mb-12">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"><Store size={20} /></div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Seller Center</h3>
              <p className="text-white/60 text-xs lg:text-sm">Goodkart for Business</p>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-6xl font-bold leading-tight mb-3 lg:mb-8">Grow your business with Goodkart</h1>
          <p className="hidden sm:block text-base lg:text-xl text-white/80 max-w-md mb-6 lg:mb-12">Reach millions of customers and scale your brand with powerful selling tools.</p>
          <div className="hidden sm:grid grid-cols-2 gap-4">
            {['Sales Analytics', 'Inventory Mgmt', 'Growth Insights', 'Fast Payouts'].map(feat => (
              <div key={feat} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10"><p className="text-sm font-semibold">{feat}</p></div>
            ))}
          </div>
        </div>
        <div className="relative z-10 pt-4 lg:pt-12"><p className="text-xs text-white/60">By logging in, you agree to Goodkart's Seller <Link to="#" className="underline">Terms of Service</Link></p></div>
      </div>

      <div className="lg:w-1/2 bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto min-h-[60vh] lg:h-screen">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 lg:p-10 border border-gray-100 flex flex-col max-h-none lg:max-h-[90vh]">
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}
            {step === 'upload' ? (
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Verify Your Identity</h2>
                <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-10">Upload your Aadhaar card for quick verification and automatic field filling.</p>
                <div className="space-y-6">
                  <label className="block">
                    <div className="w-full h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group" style={{ borderColor: '#3B7CF1', backgroundColor: 'rgba(123, 77, 219, 0.05)' }}>
                      {isExtracting ? (
                        <div className="flex flex-col items-center"><Loader className="animate-spin mb-2" style={{ color: '#3B7CF1' }} size={32} /><p className="font-bold" style={{ color: '#3B7CF1' }}>Extracting...</p></div>
                      ) : (
                        <><div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform" style={{ color: '#3B7CF1' }}><Upload size={28} /></div><p className="font-bold" style={{ color: '#3B7CF1' }}>Upload Aadhaar Card</p><p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, PDF</p></>
                      )}
                      <input type="file" className="hidden" onChange={handleAadhaarUpload} accept="image/*" disabled={isExtracting} />
                    </div>
                  </label>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">OR</span></div></div>
                  <button onClick={handleManualEntry} disabled={isExtracting} style={{ borderColor: '#3B7CF1', color: '#3B7CF1' }} className="w-full rounded-2xl border-2 py-4 font-bold hover:bg-opacity-5 transition-all disabled:opacity-50">Enter Details Manually</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8"><h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2><p className="text-gray-500">Check your details and provide shop information below.</p></div>
                <form className="space-y-6" onSubmit={handleSubmitSellerApplication}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><User size={16} /> Full Name *</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 transition-all shadow-sm" style={{ '--tw-ring-color': '#3B7CF133' }} /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Phone size={16} /> Phone Number</label><input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="Enter phone number" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 transition-all shadow-sm" style={{ '--tw-ring-color': '#3B7CF133' }} /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><CreditCard size={16} /> Aadhaar Number (Locked)</label><input type="text" value={formData.aadhaarNumber} readOnly className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-gray-500 cursor-not-allowed" /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><User size={16} /> Age (Locked)</label><input type="text" value={formData.age} readOnly className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-gray-500 cursor-not-allowed" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><MapPin size={16} /> Shop Address (Required) *</label><textarea rows={3} value={formData.shopAddress} onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Store size={16} /> Shop Name *</label><input type="text" value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} placeholder="e.g. Rahul's Gadgets" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all" /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Tag size={16} /> Shop Category *</label><select value={formData.shopCategory} onChange={(e) => setFormData({ ...formData, shopCategory: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all bg-white"><option value="">Select Category</option>{SELLER_CATEGORIES.map(category => (<option key={category} value={category}>{category}</option>))}</select></div>
                  </div>
                  {aadhaarPreview && (
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Aadhaar Preview</label><div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[1.6/1]"><img src={aadhaarPreview} alt="Aadhaar Card Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><button onClick={() => { setAadhaarPreview(null); setStep('upload'); }} className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm"><Camera size={16} /> Retake Photo</button></div></div></div>
                  )}
                  <button type="submit" disabled={loading} style={{ backgroundColor: '#3B7CF1' }} className="w-full rounded-2xl py-4 font-bold text-white shadow-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4">
                    {loading ? <div className="flex items-center justify-center gap-2"><Loader className="animate-spin" size={20} />Submitting...</div> : 'Apply for Seller Account'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}





