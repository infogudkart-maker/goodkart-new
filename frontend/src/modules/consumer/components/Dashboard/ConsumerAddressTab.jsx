import { MapPin, CheckCircle2, Package, FileText } from 'lucide-react';

export default function ConsumerAddressTab({ addresses, editingAddress, setEditingAddress, onSaveAddress, onDeleteAddress, onSetDefault }) {
    // Separate addresses by type
    const shippingAddresses = addresses.filter(addr => !addr.type || addr.type === 'shipping');
    const billingAddresses = addresses.filter(addr => addr.type === 'billing');
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Address Book</h2>
                <button onClick={() => setEditingAddress({ label: 'Home', firstName: '', lastName: '', addressLine: '', city: '', state: '', pincode: '', phone: '', type: 'shipping' })}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#120085] transition-colors">
                    Add New Address
                </button>
            </div>
            <div className="p-6">
                {editingAddress && (
                    <div className="mb-6 p-6 border-2 border-primary rounded-lg bg-blue-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">{editingAddress.id !== undefined ? 'Edit Address' : 'New Address'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                                <select value={editingAddress.type || 'shipping'} onChange={(e) => setEditingAddress({ ...editingAddress, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="shipping">Shipping Address</option>
                                    <option value="billing">Billing Address</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                                <select value={editingAddress.label} onChange={(e) => setEditingAddress({ ...editingAddress, label: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input type="text" value={editingAddress.firstName || ''} onChange={(e) => setEditingAddress({ ...editingAddress, firstName: e.target.value })}
                                    placeholder="John" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input type="text" value={editingAddress.lastName || ''} onChange={(e) => setEditingAddress({ ...editingAddress, lastName: e.target.value })}
                                    placeholder="Doe" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                                <input type="text" value={editingAddress.addressLine || ''} onChange={(e) => setEditingAddress({ ...editingAddress, addressLine: e.target.value })}
                                    placeholder="123 Main Street, Apt 4B" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input type="text" value={editingAddress.city || ''} onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                                    placeholder="Bangalore" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input type="text" value={editingAddress.state || ''} onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                                    placeholder="Karnataka" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                <input type="text" value={editingAddress.pincode || ''} onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    placeholder="560001" maxLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" value={editingAddress.phone || ''} onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    placeholder="9876543210" maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={onSaveAddress} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#120085] transition-colors">Save Address</button>
                            <button onClick={() => setEditingAddress(null)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {addresses.length === 0 && !editingAddress ? (
                    <div className="text-center py-12">
                        <MapPin size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No saved addresses</p>
                        <button onClick={() => setEditingAddress({ label: 'Home', firstName: '', lastName: '', addressLine: '', city: '', state: '', pincode: '', phone: '', type: 'shipping' })}
                            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#120085] transition-colors">
                            Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Shipping Addresses Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Package size={20} className="text-[#3B7CF1]" />
                                <h3 className="text-base font-bold text-gray-900">Shipping Addresses</h3>
                                <span className="text-xs text-gray-500">({shippingAddresses.length})</span>
                            </div>
                            {shippingAddresses.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <Package size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No shipping addresses saved</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {shippingAddresses.map((address) => {
                                        const index = addresses.indexOf(address);
                                        return (
                                            <div key={index} className={`border rounded-lg p-4 transition-colors ${address.isDefault ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-primary'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Package size={16} className="text-[#3B7CF1]" /></div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900">{address.label}</span>
                                                            {address.isDefault && (
                                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                                    <CheckCircle2 size={12} /> Default
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingAddress({ ...address, id: index })} className="text-primary hover:text-blue-700 text-sm font-medium">Edit</button>
                                                        <button onClick={() => onDeleteAddress(address.id || index)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-700 space-y-1 mb-3">
                                                    <p className="font-medium">{address.firstName} {address.lastName}</p>
                                                    <p>{address.addressLine}</p>
                                                    <p>{address.city}, {address.state} {address.pincode}</p>
                                                    <p className="text-gray-500">Phone: {address.phone}</p>
                                                </div>
                                                {!address.isDefault && (
                                                    <button onClick={() => onSetDefault(index)}
                                                        className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={14} /> Set as Default
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Billing Addresses Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={20} className="text-gray-600" />
                                <h3 className="text-base font-bold text-gray-900">Billing Addresses</h3>
                                <span className="text-xs text-gray-500">({billingAddresses.length})</span>
                            </div>
                            {billingAddresses.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No billing addresses saved</p>
                                    <p className="text-xs text-gray-400 mt-1">Billing addresses are saved when you uncheck "Use this address for billing too" during checkout</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {billingAddresses.map((address) => {
                                        const index = addresses.indexOf(address);
                                        return (
                                            <div key={index} className={`border rounded-lg p-4 transition-colors ${address.isDefault ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-primary'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><FileText size={16} className="text-gray-600" /></div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900">{address.label}</span>
                                                            {address.isDefault && (
                                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                                    <CheckCircle2 size={12} /> Default
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingAddress({ ...address, id: index })} className="text-primary hover:text-blue-700 text-sm font-medium">Edit</button>
                                                        <button onClick={() => onDeleteAddress(address.id || index)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-700 space-y-1 mb-3">
                                                    <p className="font-medium">{address.firstName} {address.lastName}</p>
                                                    <p>{address.addressLine}</p>
                                                    <p>{address.city}, {address.state} {address.pincode}</p>
                                                    <p className="text-gray-500">Phone: {address.phone}</p>
                                                </div>
                                                {!address.isDefault && (
                                                    <button onClick={() => onSetDefault(index)}
                                                        className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={14} /> Set as Default
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


