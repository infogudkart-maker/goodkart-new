import React from 'react';
import { MapPin, CheckCircle2, FileText } from 'lucide-react';
import { validateGST, formatGST, cleanGST } from '@/modules/shared/utils/gstValidation';

export default function AddressStep({
    step,
    setStep,
    shippingAddress,
    handleAddressChange,
    errors,
    savedAddresses,
    selectedAddressIndex,
    setSelectedAddressIndex,
    setShippingAddress,
    addressMode,
    setAddressMode,
    saveAddressForFuture,
    setSaveAddressForFuture,
    setAsDefault,
    setSetAsDefault,
    fetchingSavedAddress,
    handleContinue,
    sameAsBilling,
    setSameAsBilling,
    validationError,
    billingAddress,
    handleBillingAddressChange,
    billingAddressMode,
    setBillingAddressMode,
    savedBillingAddresses,
    selectedBillingAddressIndex,
    setSelectedBillingAddressIndex,
    setBillingAddress,
    saveBillingForFuture,
    setSaveBillingForFuture,
    setBillingAsDefault,
    setSetBillingAsDefault,
    hasGST,
    setHasGST,
    gstNumber,
    setGstNumber,
    businessName,
    setBusinessName,
    gstError,
    setGstError
}) {
    return (
        <section className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all ${step > 1 ? 'opacity-80' : ''}`}>
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">1</div>
                    Shipping & Billing Information
                </h3>
                {step === 2 && (
                    <button
                        onClick={() => setStep(1)}
                        className="px-3 py-1.5 text-sm text-primary font-semibold hover:bg-primary/5 rounded-lg transition-all"
                    >
                        Edit
                    </button>
                )}
            </div>

            <div className="p-4">
                {/* Address Summary - Shows on Step 2 (Payment) */}
                {step === 2 && (
                    <div className="space-y-3">
                        {/* Shipping Address Display */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#3B7CF1] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-blue-900 mb-1">Delivery Address</h4>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {shippingAddress.firstName} {shippingAddress.lastName}
                                    </p>
                                    <p className="text-xs text-gray-700 mt-1">
                                        {shippingAddress.addressLine}
                                    </p>
                                    <p className="text-xs text-gray-700">
                                        {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                                    </p>
                                    {shippingAddress.phone && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            Phone: {shippingAddress.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Billing Address Display */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">Billing Address</h4>
                                    {sameAsBilling ? (
                                        <>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {shippingAddress.firstName} {shippingAddress.lastName}
                                            </p>
                                            <p className="text-xs text-gray-700 mt-1">
                                                {shippingAddress.addressLine}
                                            </p>
                                            <p className="text-xs text-gray-700">
                                                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                                            </p>
                                            {shippingAddress.phone && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Phone: {shippingAddress.phone}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {billingAddress.firstName} {billingAddress.lastName}
                                            </p>
                                            <p className="text-xs text-gray-700 mt-1">
                                                {billingAddress.addressLine}
                                            </p>
                                            <p className="text-xs text-gray-700">
                                                {billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}
                                            </p>
                                            {billingAddress.phone && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Phone: {billingAddress.phone}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* GST Details - Show if GST is provided */}
                                    {hasGST && gstNumber && (
                                        <div className="mt-2 pt-2 border-t border-gray-300">
                                            <p className="text-xs font-semibold text-gray-900">
                                                GST: {gstNumber}
                                            </p>
                                            {businessName && (
                                                <p className="text-xs text-gray-700 mt-0.5">
                                                    <span className="font-semibold">Business:</span> {businessName}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Shipping Address Section - With border like Billing */}
                {step === 1 && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-3">
                        {/* Shipping Address Header - Always visible */}
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <h4 className="text-sm font-bold text-gray-900">Shipping Address</h4>
                        </div>
                        
                        {/* Saved Address / New Address Toggle */}
                        {savedAddresses.length > 0 && (
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => {
                                        setAddressMode('saved');
                                        if (selectedAddressIndex !== null) {
                                            setShippingAddress(savedAddresses[selectedAddressIndex]);
                                        }
                                    }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${addressMode === 'saved'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Saved Address
                                </button>
                                <button
                                    onClick={() => {
                                        setAddressMode('new');
                                        setShippingAddress({
                                            firstName: '',
                                            lastName: '',
                                            addressLine: '',
                                            city: '',
                                            state: '',
                                            pincode: '',
                                            phone: '',
                                            type: 'shipping'
                                        });
                                    }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${addressMode === 'new'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    New Address
                                </button>
                            </div>
                        )}

                        {addressMode === 'saved' && savedAddresses.length > 0 ? (
                            <div className="space-y-2">
                                <select
                                    value={selectedAddressIndex !== null ? selectedAddressIndex : ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '') {
                                            setSelectedAddressIndex(null);
                                            setShippingAddress({
                                                firstName: '',
                                                lastName: '',
                                                addressLine: '',
                                                city: '',
                                                state: '',
                                                pincode: '',
                                                phone: '',
                                                type: 'shipping'
                                            });
                                        } else {
                                            const index = parseInt(value);
                                            setSelectedAddressIndex(index);
                                            setShippingAddress(savedAddresses[index]);
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                >
                                    <option value="" disabled hidden>Choose a shipping address</option>
                                    {savedAddresses
                                        .filter(addr => !addr.type || addr.type === 'shipping')
                                        .map((addr, index) => {
                                            const originalIndex = savedAddresses.indexOf(addr);
                                            return (
                                                <option key={originalIndex} value={originalIndex}>
                                                    {addr.firstName} {addr.lastName}, {addr.city}
                                                    {addr.isDefault ? ' (Default)' : ''}
                                                </option>
                                            );
                                        })}
                                </select>

                                {selectedAddressIndex !== null && savedAddresses[selectedAddressIndex] && (
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <div className="flex-1 text-xs">
                                                <p className="font-semibold text-gray-900">
                                                    {savedAddresses[selectedAddressIndex].firstName} {savedAddresses[selectedAddressIndex].lastName}
                                                </p>
                                                <p className="text-gray-600 mt-0.5">
                                                    {savedAddresses[selectedAddressIndex].addressLine}, {savedAddresses[selectedAddressIndex].city}, {savedAddresses[selectedAddressIndex].state} {savedAddresses[selectedAddressIndex].pincode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <input type="text" name="firstName" value={shippingAddress.firstName} onChange={handleAddressChange} placeholder="First Name"
                                        className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.firstName ? 'ring-2 ring-red-500/20' : ''}`}
                                        readOnly={step === 2} />
                                </div>
                                <div>
                                    <input type="text" name="lastName" value={shippingAddress.lastName} onChange={handleAddressChange} placeholder="Last Name"
                                        className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.lastName ? 'ring-2 ring-red-500/20' : ''}`}
                                        readOnly={step === 2} />
                                </div>
                                <div className="col-span-2">
                                    <input type="text" name="addressLine" value={shippingAddress.addressLine} onChange={handleAddressChange} placeholder="Street, Building, Flat"
                                        className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.addressLine ? 'ring-2 ring-red-500/20' : ''}`}
                                        readOnly={step === 2} />
                                </div>
                                <div>
                                    <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange} placeholder="City"
                                        className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.city ? 'ring-2 ring-red-500/20' : ''}`}
                                        readOnly={step === 2} />
                                </div>
                                <div>
                                    <input type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange} placeholder="State"
                                        className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.state ? 'ring-2 ring-red-500/20' : ''}`}
                                        readOnly={step === 2} />
                                </div>
                                <div className="col-span-2">
                                    <input type="text" name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange} placeholder="Pincode (6 digits)" maxLength={6}
                                        className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.pincode ? 'ring-2 ring-red-500/20' : ''}`}
                                        readOnly={step === 2} />
                                </div>
                            </div>
                        )}
                        
                        {/* Save shipping address checkbox - Only for new address when all fields filled */}
                        {addressMode === 'new' && 
                         shippingAddress.firstName && 
                         shippingAddress.lastName && 
                         shippingAddress.addressLine && 
                         shippingAddress.city && 
                         shippingAddress.state && 
                         shippingAddress.pincode && 
                         shippingAddress.pincode.length === 6 && (
                            <div className="pt-2 border-t border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={saveAddressForFuture} onChange={(e) => setSaveAddressForFuture(e.target.checked)} 
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-xs font-medium text-gray-600">Save this shipping address for future orders</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {step === 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {/* Validation Error Message */}
                        {validationError && (
                            <div id="validation-error" className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{validationError}</p>
                            </div>
                        )}
                        
                        {/* Billing Address Checkbox */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} 
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5" />
                            <div className="flex-1">
                                <span className="text-xs font-medium text-gray-600">Use this address for billing too</span>
                                <p className="text-[10px] text-gray-500 mt-0.5">(Uncheck to add a different billing address)</p>
                            </div>
                        </label>
                        
                        {/* Billing Address Form - Shows when checkbox is unchecked */}
                        {!sameAsBilling && (
                            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h4 className="text-sm font-bold text-gray-900">Billing Address</h4>
                                </div>
                                
                                {/* Saved/New Address Toggle for Billing - Show if user has any addresses */}
                                {savedAddresses.length > 0 && (
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={() => {
                                                setBillingAddressMode('saved');
                                                // Don't auto-select, let user choose from dropdown
                                            }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${billingAddressMode === 'saved'
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Saved Address
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBillingAddressMode('new');
                                                setSelectedBillingAddressIndex(null);
                                                setBillingAddress({
                                                    firstName: '',
                                                    lastName: '',
                                                    addressLine: '',
                                                    city: '',
                                                    state: '',
                                                    pincode: '',
                                                    phone: '',
                                                    type: 'billing'
                                                });
                                            }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${billingAddressMode === 'new'
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            New Address
                                        </button>
                                    </div>
                                )}
                                
                                {/* Saved Billing Address Selector */}
                                {billingAddressMode === 'saved' && savedAddresses.length > 0 ? (
                                    <div className="space-y-2">
                                        <select
                                            value={selectedBillingAddressIndex !== null ? selectedBillingAddressIndex : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '') {
                                                    setSelectedBillingAddressIndex(null);
                                                    setBillingAddress({
                                                        firstName: '',
                                                        lastName: '',
                                                        addressLine: '',
                                                        city: '',
                                                        state: '',
                                                        pincode: '',
                                                        phone: '',
                                                        type: 'billing'
                                                    });
                                                } else {
                                                    const index = parseInt(value);
                                                    setSelectedBillingAddressIndex(index);
                                                    setBillingAddress(savedAddresses[index]);
                                                }
                                            }}
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                        >
                                            <option value="" disabled hidden>Select a billing address</option>
                                            {savedBillingAddresses.map((addr, index) => {
                                                const originalIndex = savedAddresses.indexOf(addr);
                                                return (
                                                    <option key={originalIndex} value={originalIndex}>
                                                        {addr.firstName} {addr.lastName}, {addr.city}
                                                        {addr.isDefault ? ' (Default)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        
                                        {selectedBillingAddressIndex !== null && savedAddresses[selectedBillingAddressIndex] && (
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <div className="flex-1 text-xs">
                                                        <p className="font-semibold text-gray-900">
                                                            {savedAddresses[selectedBillingAddressIndex].firstName} {savedAddresses[selectedBillingAddressIndex].lastName}
                                                        </p>
                                                        <p className="text-gray-600 mt-0.5">
                                                            {savedAddresses[selectedBillingAddressIndex].addressLine}, {savedAddresses[selectedBillingAddressIndex].city}, {savedAddresses[selectedBillingAddressIndex].state} {savedAddresses[selectedBillingAddressIndex].pincode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <input 
                                                type="text" 
                                                name="firstName" 
                                                value={billingAddress.firstName}
                                                onChange={handleBillingAddressChange}
                                                placeholder="First Name"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                name="lastName" 
                                                value={billingAddress.lastName}
                                                onChange={handleBillingAddressChange}
                                                placeholder="Last Name"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="text" 
                                                name="addressLine" 
                                                value={billingAddress.addressLine}
                                                onChange={handleBillingAddressChange}
                                                placeholder="Street, Building, Flat"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                name="city" 
                                                value={billingAddress.city}
                                                onChange={handleBillingAddressChange}
                                                placeholder="City"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                name="state" 
                                                value={billingAddress.state}
                                                onChange={handleBillingAddressChange}
                                                placeholder="State"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="text" 
                                                name="pincode" 
                                                value={billingAddress.pincode}
                                                onChange={handleBillingAddressChange}
                                                placeholder="Pincode (6 digits)" 
                                                maxLength={6}
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {/* Save billing address for future - Only show when all fields filled */}
                                {billingAddressMode === 'new' && 
                                 billingAddress.firstName && 
                                 billingAddress.lastName && 
                                 billingAddress.addressLine && 
                                 billingAddress.city && 
                                 billingAddress.state && 
                                 billingAddress.pincode && 
                                 billingAddress.pincode.length === 6 && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={saveBillingForFuture} 
                                                onChange={(e) => setSaveBillingForFuture(e.target.checked)} 
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                                            />
                                            <span className="text-xs font-medium text-gray-600">Save this billing address for future orders</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* GST Number Section */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-[#3B7CF1] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={hasGST} 
                                                onChange={(e) => {
                                                    setHasGST(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setGstNumber('');
                                                        setGstError('');
                                                    }
                                                }} 
                                                className="w-4 h-4 rounded border-gray-300 text-[#3B7CF1] focus:ring-blue-500" 
                                            />
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-[#3B7CF1] transition-colors">
                                                I have a GST Number
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-600 mt-1 ml-6">
                                            Ensure GST details match your billing address
                                        </p>
                                        
                                        {hasGST && (
                                            <div className="mt-3 ml-6 space-y-3">
                                                {/* GST Number Field - FIRST */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                        GST Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={gstNumber}
                                                        onChange={(e) => {
                                                            const value = e.target.value.toUpperCase().replace(/\s/g, '');
                                                            setGstNumber(value);
                                                            if (value && !validateGST(value)) {
                                                                setGstError('Invalid GST format. Example: 29ABCDE1234F1Z5');
                                                            } else {
                                                                setGstError('');
                                                            }
                                                        }}
                                                        placeholder="Enter GST Number (e.g., 29ABCDE1234F1Z5)"
                                                        className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm font-medium focus:ring-2 transition-all outline-none ${
                                                            gstError 
                                                                ? 'border-red-300 focus:ring-red-200' 
                                                                : gstNumber && validateGST(gstNumber)
                                                                ? 'border-green-300 focus:ring-green-200'
                                                                : 'border-gray-300 focus:ring-blue-200'
                                                        }`}
                                                        maxLength={15}
                                                    />
                                                    {gstError && (
                                                        <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {gstError}
                                                        </p>
                                                    )}
                                                    {gstNumber && validateGST(gstNumber) && (
                                                        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Valid GST Number
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Business/Company Name Field - SECOND */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                        Business/Company Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={businessName}
                                                        onChange={(e) => setBusinessName(e.target.value)}
                                                        placeholder="Enter your business or company name"
                                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all text-sm mt-4"
                            onClick={handleContinue}
                            disabled={fetchingSavedAddress}
                        >
                            {fetchingSavedAddress ? 'Loading...' : 'Continue to Payment'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}




