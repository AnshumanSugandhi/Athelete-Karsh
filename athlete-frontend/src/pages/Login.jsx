// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api';

export default function Login() {
  // State to hold the form inputs and errors
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  // React Router hook to programmatically change pages
  const navigate = useNavigate();

  // Handle Google Login Success via Code Flow
  const handleGoogleSuccess = async (codeResponse) => {
    try {
      // Send the authorization code to our Django backend
      // dj-rest-auth will securely exchange this for the real user data
      const response = await api.post('auth/google/', {
        code: codeResponse.code, 
      });

      const { access, refresh, user } = response.data;

      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
      sessionStorage.setItem('user_role', user.role || 'ATHLETE'); 
      sessionStorage.setItem('user_name', user.username);

      if (user.role === 'ATHLETE') {
        navigate('/athlete');
      } else if (user.role === 'PROFESSIONAL') {
        navigate('/professional');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/athlete'); // Default fallback
      }
    } catch (err) {
      console.error('Google Auth Error:', err.response?.data);
      setError('Google Sign-In failed. Please check your credentials or try again.');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-In was unsuccessful.'),
    flow: 'auth-code',
  });

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

      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
      sessionStorage.setItem('user_role', user.role);
      sessionStorage.setItem('user_name', user.username);

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
        <div className="flex justify-center mb-6">
          <div className="bg-amber-500 text-slate-900 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/20">D</div>
        </div>
        <h2 className="text-3xl font-bold text-white text-center mb-6 tracking-tight">Log in to DronaMeet</h2>
        
        {/* Display error message if the API rejects the credentials */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1 text-sm">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <div className="border-t border-slate-800 flex-grow"></div>
          <span className="px-4 text-slate-500 text-sm font-medium">or continue with</span>
          <div className="border-t border-slate-800 flex-grow"></div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-100 transition shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-500 hover:text-amber-400 font-bold transition">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}