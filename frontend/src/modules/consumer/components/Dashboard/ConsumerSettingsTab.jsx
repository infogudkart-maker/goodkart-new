const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

export default function ConsumerSettingsTab({
    user, userName, profileData, setProfileData,
    editingProfile, setEditingProfile,
    savingProfile, onSaveProfile,
    uploadingImage, onProfilePictureUpload,
    onDeleteAccount
}) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
                {!editingProfile ? (
                    <button onClick={() => setEditingProfile(true)}
                        className="px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors">
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => {
                            setEditingProfile(false);
                            setProfileData({ displayName: userName, email: user?.email || '', phone: profileData.phone });
                        }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button onClick={onSaveProfile} disabled={savingProfile}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-[#120085] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
            <div className="p-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                        <input type="text" value={profileData.fullName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                            readOnly={!editingProfile}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${editingProfile ? 'bg-white' : 'bg-gray-50 text-gray-600'} focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                            placeholder="Enter your full name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input type="email" value={profileData.email} readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input type="tel" value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            readOnly={!editingProfile}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${editingProfile ? 'bg-white' : 'bg-gray-50 text-gray-600'} focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                            placeholder="Enter your phone number" />
                    </div>
                    {(() => {
                        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const dob = localUser.dateOfBirth;
                        const age = calculateAge(dob);
                        return age ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                <input type="text" value={age} readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                            </div>
                        ) : null;
                    })()}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                        <input type="text" value={user?.uid || ''} readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm" />
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Account Actions</h3>
                        <div className="space-y-2">
                            <div className="relative">
                                <input type="file" accept="image/*" id="profile-upload" className="hidden"
                                    onChange={onProfilePictureUpload} disabled={uploadingImage} />
                                <label htmlFor="profile-upload"
                                    className={`w-full block px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'}`}>
                                    {uploadingImage ? 'Uploading...' : 'Update Profile Picture'}
                                </label>
                            </div>
                            <button onClick={onDeleteAccount}
                                className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors text-left">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

