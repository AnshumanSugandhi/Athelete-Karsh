// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import our page components
import Login from './pages/Login';
import AthleteDashboard from './pages/AthleteDashboard';
import ProfessionalPortal from './pages/ProfessionalPortal';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Routes>
      {/* Default route redirects straight to the login page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* The Global Login Route */}
      <Route path="/login" element={<Login />} />
      
      {/* The Secure Dashboard Routes */}
      <Route path="/athlete" element={<AthleteDashboard />} />
      <Route path="/professional" element={<ProfessionalPortal />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;