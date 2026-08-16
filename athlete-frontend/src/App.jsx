// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Page Imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AthleteDashboard from './pages/AthleteDashboard';
import ProfessionalPortal from './pages/ProfessionalPortal';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import LearningHub from './pages/LearningHub';
import Chat from './pages/Chat';

// Component Imports
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Routes */}
        <Route path="/athlete" element={<AthleteDashboard />} />
        <Route path="/professional" element={<ProfessionalPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/learning" element={<LearningHub />} />
        <Route path="/chat" element={<Chat />} />
        
        {/* Account Route */}
        <Route path="/profile" element={<Profile />} />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </main>

      <Footer />
    </div>
  );
}