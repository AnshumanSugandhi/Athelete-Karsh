// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const username = sessionStorage.getItem('user_name'); // Updated to sessionStorage
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'users'
  const [loading, setLoading] = useState(true);

  // Metrics State
  const [data, setData] = useState({ metrics: { total_athletes: 0, total_professionals: 0, total_revenue: 0 }, recent_transactions: [] });
  
  // Users State
  const [users, setUsers] = useState([]);
  
  // Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [profData, setProfData] = useState({ username: '', email: '', password: '', sportId: '', specialtyId: '' });
  const [genStatus, setGenStatus] = useState({ type: '', message: '' });
  const [sportsList, setSportsList] = useState([]);
  const [specialtiesList, setSpecialtiesList] = useState([]);

  useEffect(() => {
    fetchAdminData();
    fetchUsers();
    fetchSports();
    fetchSpecialties();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await api.get('sports/');
      // Depending on pagination, it might be response.data.results or response.data
      setSportsList(response.data.results || response.data);
    } catch (error) { console.error('Failed to fetch sports', error); }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await api.get('specialties/');
      setSpecialtiesList(response.data.results || response.data);
    } catch (error) { console.error('Failed to fetch specialties', error); }
  };

  const fetchAdminData = async () => {
    try {
      const response = await api.get('bookings/admin_metrics/');
      setData(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Unauthorized.");
        navigate('/login');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('admin/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  // --- Handlers ---
  const handleProfChange = (e) => {
    setProfData({ ...profData, [e.target.name]: e.target.value });
    setGenStatus({ type: '', message: '' });
  };

  const handleGenerateProfessional = async (e) => {
    e.preventDefault();
    setGenStatus({ type: 'loading', message: 'Generating credentials...' });
    try {
      await api.post('auth/registration/', {
        username: profData.username, 
        email: profData.email, 
        password1: profData.password, 
        password2: profData.password, 
        role: 'PROFESSIONAL',
        speciality_id: profData.specialtyId || null
      });
      setGenStatus({ type: 'success', message: `Success! Account created.` });
      setProfData({ username: '', email: '', password: '', sportId: '', specialtyId: '' });
      fetchAdminData();
      fetchUsers();
    } catch (error) {
      setGenStatus({ type: 'error', message: 'Failed to generate account. Check inputs.' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`admin/users/${userId}/`, { role: newRole });
      alert(`User role updated to ${newRole}`);
      fetchUsers(); // Refresh list
      fetchAdminData(); // Refresh metrics
    } catch (error) {
      alert('Failed to update role.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading operational data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Platform Control Center</h1>
            <p className="text-slate-500">Welcome back, {username}.</p>
          </div>
          
          <button onClick={() => setShowGenerator(!showGenerator)} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-md">
            {showGenerator ? '✕ Close Generator' : '＋ Generate Professional Account'}
          </button>
        </header>

        {/* Dynamic Professional Generator UI */}
        {showGenerator && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-amber-200 border-l-4 border-l-amber-600">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Provision Professional Credentials</h2>
            {genStatus.message && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-bold ${genStatus.type === 'success' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                {genStatus.message}
              </div>
            )}
            <form onSubmit={handleGenerateProfessional} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">USERNAME</label>
                <input type="text" name="username" value={profData.username} onChange={handleProfChange} required className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL</label>
                <input type="email" name="email" value={profData.email} onChange={handleProfChange} required className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TEMP PASSWORD</label>
                <input type="password" name="password" value={profData.password} onChange={handleProfChange} required minLength="8" className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">SPORT</label>
                <select name="sportId" value={profData.sportId} onChange={handleProfChange} required className="w-full px-3 py-2 border rounded">
                  <option value="">Select Sport</option>
                  {sportsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="cross">Cross-Sport Roles</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">SPECIALTY</label>
                <select name="specialtyId" value={profData.specialtyId} onChange={handleProfChange} required className="w-full px-3 py-2 border rounded" disabled={!profData.sportId}>
                  <option value="">Select Specialty</option>
                  {specialtiesList
                    .filter(sp => profData.sportId === 'cross' ? sp.is_cross_sport : (sp.sport === parseInt(profData.sportId) && !sp.is_cross_sport))
                    .map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-amber-600 text-white font-bold py-2 rounded md:col-span-3">Create Account</button>
            </form>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b mb-6 space-x-6">
          <button className={`pb-3 font-bold ${activeTab === 'metrics' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-slate-400'}`} onClick={() => setActiveTab('metrics')}>
            Financial Metrics
          </button>
          <button className={`pb-3 font-bold ${activeTab === 'users' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-slate-400'}`} onClick={() => setActiveTab('users')}>
            User Directory
          </button>
        </div>

        {/* TAB 1: METRICS */}
        {activeTab === 'metrics' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Registered Athletes</h3>
                <p className="text-3xl font-bold text-slate-800">{data.metrics.total_athletes}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Active Professionals</h3>
                <p className="text-3xl font-bold text-slate-800">{data.metrics.total_professionals}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Total Gross Revenue</h3>
                <p className="text-3xl font-bold text-amber-600">₹{data.metrics.total_revenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 border-b"><h2 className="text-lg font-bold text-slate-700">Recent Transactions</h2></div>
              <div className="overflow-x-auto p-4">
                 {/* Transaction Table Code (Remains the same as before) */}
                 <p className="text-sm text-slate-500">Currently showing {data.recent_transactions.length} recent transactions.</p>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-700">Platform Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                    <th className="px-6 py-3 font-semibold">Username</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Current Role</th>
                    <th className="px-6 py-3 font-semibold">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{u.username}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'PROFESSIONAL' ? 'bg-purple-100 text-purple-800' : u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 border rounded text-xs font-bold bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="ATHLETE">Make Athlete</option>
                          <option value="PROFESSIONAL">Make Professional</option>
                          <option value="ADMIN">Make Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}