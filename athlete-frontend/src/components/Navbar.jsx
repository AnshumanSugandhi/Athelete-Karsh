// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check auth state
  const token = sessionStorage.getItem('access_token');
  const role = sessionStorage.getItem('user_role');
  
  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // Dynamically determine where the "Dashboard" button should go based on role
  const getDashboardLink = () => {
    if (role === 'ATHLETE') return '/athlete';
    if (role === 'PROFESSIONAL') return '/professional';
    if (role === 'ADMIN') return '/admin';
    return '/'; // Fallback
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left Side: Brand Logo / Name */}
          <div className="flex items-center">
            <Link to={token ? getDashboardLink() : "/"} className="text-2xl font-bold text-amber-500 tracking-tight hover:text-amber-400 transition flex items-center gap-2">
              <span className="bg-amber-500 text-slate-900 w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm">D</span>
              DronaMeet
            </Link>
          </div>
          
          {/* Right Side: Navigation Links */}
          <div className="flex items-center space-x-6">
            {!token ? (
              <>
                <Link to="/login" className="text-slate-300 hover:text-amber-500 transition font-semibold text-sm">
                  Log In
                </Link>
                <Link to="/register" className="bg-amber-500 text-slate-900 hover:bg-amber-400 px-5 py-2 rounded-full text-sm font-bold transition shadow-md shadow-amber-500/20">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to={getDashboardLink()} className="text-slate-300 hover:text-amber-500 transition font-semibold text-sm">
                  Dashboard
                </Link>
                <Link to="/learning" className="text-slate-300 hover:text-amber-500 transition font-semibold text-sm">
                  Learning Hub
                </Link>
                <Link to="/chat" className="text-slate-300 hover:text-amber-500 transition font-semibold text-sm">
                  Messages
                </Link>
                {role === 'ADMIN' && (
                  <Link to="/admin" className="text-slate-300 hover:text-amber-500 transition font-semibold text-sm">
                    Control Center
                  </Link>
                )}
                <Link to="/profile" className="text-slate-300 hover:text-amber-500 transition font-semibold text-sm">
                  Account
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-full text-sm font-bold transition shadow-sm"
                >
                  Log Out
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}