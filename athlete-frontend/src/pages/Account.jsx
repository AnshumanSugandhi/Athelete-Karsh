// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'security'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Profile Data State
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', role: '', dob: '', blood_type: ''
  });
  
  // Image State
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // 2. Password State (Mapped to dj-rest-auth requirements)
  const [passwordData, setPasswordData] = useState({
    old_password: '', new_password1: '', new_password2: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('profile/'); // Update to your exact profile GET route
      const data = response.data;
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        role: data.role || '',
        dob: data.dob || '',
        blood_type: data.blood_type || ''
      });
      setAvatarPreview(data.avatar || null);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  };

  // --- PROGRESS BAR LOGIC ---
  const calculateProgress = () => {
    const fields = ['first_name', 'last_name', 'email', 'dob', 'blood_type'];
    let filled = 0;
    fields.forEach(f => { if (formData[f]) filled++; });
    if (avatarPreview || selectedFile) filled++; 
    return Math.round((filled / 6) * 100);
  };

  const progress = calculateProgress();

  // --- HANDLERS ---
  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccessMsg('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Show preview instantly
    }
  };

  // --- SUBMISSIONS ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      // Because we have an image, we MUST send as multipart/form-data
      const submitData = new FormData();
      submitData.append('first_name', formData.first_name);
      submitData.append('last_name', formData.last_name);
      submitData.append('email', formData.email);
      if (formData.dob) submitData.append('dob', formData.dob);
      if (formData.blood_type) submitData.append('blood_type', formData.blood_type);
      if (selectedFile) submitData.append('avatar', selectedFile);

      await api.patch('profile/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Profile details updated successfully!');
      setSelectedFile(null); // Clear pending file state
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password1 !== passwordData.new_password2) {
      return setErrorMsg("New passwords do not match!");
    }
    try {
      // Calling the dj-rest-auth password change endpoint
      await api.post('auth/password/change/', passwordData);
      setSuccessMsg('Password updated securely!');
      setPasswordData({ old_password: '', new_password1: '', new_password2: '' });
    } catch (error) {
      setErrorMsg(error.response?.data?.old_password?.[0] || 'Failed to update password.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Account Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR: Avatar & Progress */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center h-fit">
          <div className="relative mb-4 group cursor-pointer">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-200">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">👤</div>
              )}
            </div>
            {/* Hidden File Input */}
            <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleFileChange} />
            <label htmlFor="avatarUpload" className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow cursor-pointer hover:bg-emerald-700 transition">
              📷
            </label>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800">{formData.first_name || 'User'} {formData.last_name}</h2>
          <p className="text-emerald-600 font-bold text-sm mb-6 uppercase">{formData.role}</p>

          <div className="w-full">
            <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
              <span>Profile Completion</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Forms */}
        <div className="w-full md:w-2/3 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
          
          {/* Tabs */}
          <div className="flex border-b mb-6 space-x-6">
            <button 
              className={`pb-3 font-bold transition ${activeTab === 'details' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => { setActiveTab('details'); setSuccessMsg(''); setErrorMsg(''); }}
            >
              Personal Info
            </button>
            <button 
              className={`pb-3 font-bold transition ${activeTab === 'security' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => { setActiveTab('security'); setSuccessMsg(''); setErrorMsg(''); }}
            >
              Security
            </button>
          </div>

          {/* Alerts */}
          {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg font-medium border border-emerald-200">✓ {successMsg}</div>}
          {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg font-medium border border-red-200">⚠ {errorMsg}</div>}

          {/* TAB 1: DETAILS FORM */}
          {activeTab === 'details' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded bg-slate-50 focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Blood Type</label>
                  <select name="blood_type" value={formData.blood_type} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select Type...</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">Save Details</button>
            </form>
          )}

          {/* TAB 2: SECURITY FORM */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                <input type="password" name="old_password" value={passwordData.old_password} onChange={handlePasswordChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                <input type="password" name="new_password1" value={passwordData.new_password1} onChange={handlePasswordChange} required minLength="8" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" name="new_password2" value={passwordData.new_password2} onChange={handlePasswordChange} required minLength="8" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition">Update Password</button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}