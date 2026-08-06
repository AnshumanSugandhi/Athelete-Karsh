// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  // State to hold the form inputs and errors
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  // React Router hook to programmatically change pages
  const navigate = useNavigate();

  // Handle typing in the input fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // src/pages/Login.jsx

  // src/pages/Login.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // FIX: Destroy any old, expired tokens sitting in the browser
    // so they don't sabotage the new login request!
    localStorage.clear();

    try {
      const response = await api.post('auth/login/', formData);
      
      console.log("API Response Data:", response.data);
      
      // ... (keep the rest of the code exactly the same)
      
      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('user_name', user.username);

      // Role-Based Redirection
      if (user.role === 'ATHLETE') {
        navigate('/athlete');
      } else if (user.role === 'PROFESSIONAL') {
        navigate('/professional');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        // 2. If the role is missing or misspelled, warn us!
        alert(`Login successful, but unknown role: ${user.role}`);
      }
      
    } catch (err) {
      // 1. Log the EXACT error message the Django backend sent us
      console.error('Django Error Response:', err.response?.data);
      
      // 2. Temporarily show the exact backend error in the alert box
      alert(JSON.stringify(err.response?.data));
      
      setError('Invalid credentials. Check the console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-6">Karsh Login</h2>
        
        {/* Display error message if the API rejects the credentials */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-2 rounded hover:bg-emerald-700 transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}