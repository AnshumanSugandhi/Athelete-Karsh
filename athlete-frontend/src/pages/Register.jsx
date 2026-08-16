// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '', // Kept for the UI input field
    role: 'ATHLETE' // Default to athlete
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // dj-rest-auth expects 'password1' and 'password2' 
      const payload = {
        username: formData.username,
        email: formData.email,
        password1: formData.password,
        password2: formData.password,
        role: formData.role
      };
      
      // Adjust this endpoint if your custom registration URL is different
      await api.post('auth/registration/', payload);
      alert('Account created successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    }
  };

  // Handle Google Login/Signup Success via Code Flow
  const handleGoogleSuccess = async (codeResponse) => {
    try {
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
      setError('Google Sign-Up failed. Please try again.');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-Up was unsuccessful.'),
    flow: 'auth-code',
  });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-amber-500 text-slate-900 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/20">D</div>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Create an Account</h2>
          <p className="text-slate-400 mt-2">Join the DronaMeet Platform</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input type="text" name="username" onChange={handleChange} required className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input type="email" name="email" onChange={handleChange} required className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" name="password" onChange={handleChange} required minLength="8" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
          </div>
          
          <button type="submit" className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 mt-4">
            Sign Up
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
            Sign up with Google
          </button>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-amber-500 font-bold hover:text-amber-400 transition">Log in here</Link>
        </p>
      
      </div>
    </div>
  );
}