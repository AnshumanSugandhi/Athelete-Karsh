// src/pages/AdminDashboard.jsx
import React from 'react';

export default function AdminDashboard() {
  const username = localStorage.getItem('user_name');
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-700">Admin Dashboard</h1>
      <p className="mt-4 text-slate-600">Welcome back, Admin {username}!</p>
    </div>
  );
}