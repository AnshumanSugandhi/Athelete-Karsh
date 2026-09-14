// src/pages/AthleteDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api';

export default function AthleteDashboard() {
  const username = sessionStorage.getItem('user_name');
  const navigate = useNavigate();
  
  // State for tabs and data
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'bookings'
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dbSpecialties, setDbSpecialties] = useState([]);
  
  // Marketplace Filters
  const [filterType, setFilterType] = useState('ALL');
  const [filterSpecialty, setFilterSpecialty] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('DATE_ASC');
  
  // Intake form state
  const [bookingForm, setBookingForm] = useState({
    current_goal: '',
    past_injury: ''
  });

  // Performance State
  const [performanceLogs, setPerformanceLogs] = useState([]);
  const [performanceForm, setPerformanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    sleep_hours: '8.0',
    fatigue_level: '5',
    training_duration_mins: '60',
    perceived_exertion: '5',
    muscle_soreness: '1',
    stress_level: '1',
    resting_heart_rate: '',
    weight_kg: '',
    diet_quality: '5',
    hydration_liters: '2.0',
    notes: ''
  });

  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });

  // Derived Marketplace Slots
  const specialties = ['ALL', ...new Set(slots.map(s => s.professional_specialty).filter(Boolean))];
  
  const filteredSlots = slots.filter(slot => {
    if (filterType !== 'ALL' && slot.session_type !== filterType) return false;
    if (filterSpecialty !== 'ALL' && slot.professional_specialty !== filterSpecialty) return false;
    if (parseFloat(slot.price) > maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'PRICE_ASC') return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'PRICE_DESC') return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === 'RATING_DESC') return (b.professional_rating || 0) - (a.professional_rating || 0);
    // Default DATE_ASC
    const dateA = new Date(`${a.date}T${a.start_time}`);
    const dateB = new Date(`${b.date}T${b.start_time}`);
    return dateA - dateB;
  });

  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
    fetchPerformanceLogs();
    fetchNotifications();
    fetchSpecialties();

    // Poll for notifications every 10 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchMyBookings(); // Also keep bookings fresh
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await api.get('specialties/');
      // Extract just the specialty names
      setDbSpecialties(response.data.map(s => s.name));
    } catch (error) {
      console.error('Failed to fetch specialties:', error);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await api.post('notifications/mark_all_read/');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  const fetchPerformanceLogs = async () => {
    try {
      const response = await api.get('performance/');
      // Reverse array so chronological order works for Recharts
      setPerformanceLogs(response.data.reverse());
    } catch (error) {
      console.error('Failed to fetch performance logs:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get('slots/');
      setSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('bookings/');
      setMyBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  // Utility to load the Razorpay SDK script into the browser
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleFormChange = (e) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const handlePerfChange = (e) => {
    setPerformanceForm({ ...performanceForm, [e.target.name]: e.target.value });
  };

  const handlePerfSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('performance/', performanceForm);
      alert('Performance logged successfully!');
      fetchPerformanceLogs();
      setPerformanceForm({ ...performanceForm, notes: '' });
    } catch (error) {
      alert('Failed to log performance (you may have already logged today).');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('reviews/', {
        booking: selectedBookingForReview.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      alert('Review submitted! Thank you.');
      setReviewModalOpen(false);
      fetchMyBookings(); // Refresh bookings to update has_reviewed flag
    } catch (error) {
      alert('Failed to submit review.');
    }
  };

  // The Core Booking & Payment Engine
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Submit the booking to our Django backend
      const response = await api.post('bookings/', {
        slot: selectedSlot.id,
        current_goal: bookingForm.current_goal,
        past_injury: bookingForm.past_injury
      });

      const bookingData = response.data;
      console.log("Booking Data:", bookingData);
      
      // 2. Load Razorpay
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 3. Configure the Razorpay Popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use real key from .env
        amount: selectedSlot.price * 100, // Amount in paise
        currency: 'INR',
        name: 'DronaMeet Athlete Platform',
        description: `Coaching Session with ${selectedSlot.professional_name}`,
        order_id: bookingData.razorpay_order_id, // The ID generated securely by Django
        
        handler: async function (paymentResponse) {
          try {
            // A. Send the exact payload from Razorpay to our Django verification endpoint
            await api.post(`bookings/${bookingData.id}/verify_payment/`, {
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            // B. Alert the user of absolute success
            alert(`Session Booked! Payment ID: ${paymentResponse.razorpay_payment_id}`);
            
            // C. Reset the UI and refresh data
            setSelectedSlot(null);
            setBookingForm({ current_goal: '', past_injury: '' });
            fetchAvailableSlots();
            fetchMyBookings(); // Refresh bookings to show the new PAID session
            setActiveTab('bookings'); // Auto-switch to bookings tab
            
          } catch (error) {
            console.error("Verification failed:", error);
            alert("Payment went through, but security verification failed. Please contact support.");
          }
        },
        prefill: {
          name: username,
          contact: '9999999999' // Hardcoded for test environment
        },
        theme: {
          color: '#059669' // Tailwind Emerald 600
        }
      };

      // 4. Launch the popup
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Booking failed:', error.response?.data);
      const errorMessage = error.response?.data?.slot || 'Failed to initialize booking. It may have already been booked.';
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Athlete Dashboard</h1>
              <p className="text-slate-500">Welcome back, {username}.</p>
            </div>
            
            {/* Notification Bell */}
            <div className="relative ml-auto">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (notifications.some(n => !n.is_read)) markNotificationsRead();
                }}
                className="relative p-2 text-slate-600 hover:text-amber-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-50"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No new notifications.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-slate-50 text-sm ${n.is_read ? 'opacity-60' : 'bg-amber-50/30'}`}>
                          <div className="font-bold text-slate-700">{n.title}</div>
                          <div className="text-slate-600 mt-1">{n.message}</div>
                          <div className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => {setActiveTab('explore'); setSelectedSlot(null);}}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'explore' ? 'bg-white shadow text-amber-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Find Sessions
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'bookings' ? 'bg-white shadow text-amber-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              My Bookings
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'performance' ? 'bg-white shadow text-amber-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Performance
            </button>
          </div>
        </header>

        {/* TAB 1: MY BOOKINGS */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Data Entry Form */}
            <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Log Daily Metrics</h2>
              <form onSubmit={handlePerfSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" name="date" value={performanceForm.date} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Sleep (Hrs)</label>
                    <input type="number" step="0.1" name="sleep_hours" value={performanceForm.sleep_hours} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Training (Mins)</label>
                    <input type="number" name="training_duration_mins" value={performanceForm.training_duration_mins} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Fatigue (1-10)</label>
                    <input type="number" min="1" max="10" name="fatigue_level" value={performanceForm.fatigue_level} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Muscle Soreness (1-10)</label>
                    <input type="number" min="1" max="10" name="muscle_soreness" value={performanceForm.muscle_soreness} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Stress Level (1-10)</label>
                    <input type="number" min="1" max="10" name="stress_level" value={performanceForm.stress_level} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Resting HR (BPM)</label>
                    <input type="number" min="30" max="200" name="resting_heart_rate" value={performanceForm.resting_heart_rate} onChange={handlePerfChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" placeholder="e.g. 55" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Weight (kg)</label>
                    <input type="number" step="0.1" name="weight_kg" value={performanceForm.weight_kg} onChange={handlePerfChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" placeholder="e.g. 75.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">RPE / Exertion (1-10)</label>
                    <input type="number" min="1" max="10" name="perceived_exertion" value={performanceForm.perceived_exertion} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Diet Quality (1-10)</label>
                    <input type="number" min="1" max="10" name="diet_quality" value={performanceForm.diet_quality} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Hydration (Liters)</label>
                    <input type="number" step="0.1" name="hydration_liters" value={performanceForm.hydration_liters} onChange={handlePerfChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                  <textarea name="notes" value={performanceForm.notes} onChange={handlePerfChange} rows="2" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" placeholder="Felt sluggish, tweaked knee..."></textarea>
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white font-bold py-2 rounded hover:bg-amber-700 transition">Save Metrics</button>
              </form>
            </div>

            {/* Right: Charts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* AI Analysis Link */}
              <div className="bg-gradient-to-r from-slate-900 to-black p-6 rounded-xl shadow-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 14l-10-5v2l10 5 10-5v-2l-10 5zm0 4l-10-5v2l10 5 10-5v-2l-10 5z"/></svg>
                    AI Performance Analysis
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Get custom diet, exercise, and recovery plans based on your logs.</p>
                </div>
                <button
                  onClick={() => navigate('/performance')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition shadow-lg shadow-orange-500/20 whitespace-nowrap"
                >
                  Generate Plan
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-80">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Fatigue vs Exertion (RPE)</h2>
                {performanceLogs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                      <Line type="monotone" dataKey="fatigue_level" stroke="#f59e0b" name="Fatigue (1-10)" strokeWidth={2} />
                      <Line type="monotone" dataKey="perceived_exertion" stroke="#ef4444" name="Exertion (1-10)" strokeWidth={2} />
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Log some data to see your charts.</div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-80">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Sleep vs Training Volume</h2>
                {performanceLogs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                      <Line type="monotone" dataKey="sleep_hours" stroke="#3b82f6" name="Sleep (Hrs)" strokeWidth={2} />
                      <Line type="monotone" dataKey="training_duration_mins" stroke="#10b981" name="Training (Mins)" strokeWidth={2} />
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Log some data to see your charts.</div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-80">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Recovery: Soreness, Stress & Fatigue</h2>
                {performanceLogs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                      <Line type="monotone" dataKey="fatigue_level" stroke="#f59e0b" name="Fatigue" strokeWidth={2} />
                      <Line type="monotone" dataKey="muscle_soreness" stroke="#ef4444" name="Soreness" strokeWidth={2} />
                      <Line type="monotone" dataKey="stress_level" stroke="#8b5cf6" name="Stress" strokeWidth={2} />
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Log some data to see your charts.</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-80">
                  <h2 className="text-xl font-bold text-slate-700 mb-4">Resting Heart Rate</h2>
                  {performanceLogs.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                        <Line type="monotone" dataKey="resting_heart_rate" stroke="#ec4899" name="RHR (BPM)" strokeWidth={2} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="date" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">Log some data to see your charts.</div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-80">
                  <h2 className="text-xl font-bold text-slate-700 mb-4">Nutrition & Hydration</h2>
                  {performanceLogs.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                        <Line type="monotone" dataKey="diet_quality" stroke="#14b8a6" name="Diet (1-10)" strokeWidth={2} />
                        <Line type="monotone" dataKey="hydration_liters" stroke="#0ea5e9" name="Hydration (L)" strokeWidth={2} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" domain={[0, 10]} />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">Log some data to see your charts.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Your Upcoming Sessions</h2>
            {myBookings.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
                You haven't booked any sessions yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myBookings.map(booking => (
                  <div key={booking.id} className="bg-white p-6 rounded-xl shadow border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-800">{booking.slot_details.professional_name}</h3>
                          <p className="text-slate-500 text-sm">{booking.slot_details.session_type} Session</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.payment_status === 'PAID' ? 'bg-amber-100 text-amber-800' : 
                          booking.payment_status === 'REFUNDED' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {booking.slot_details.is_cancelled ? 'CANCELLED & REFUNDED' : booking.payment_status}
                        </span>
                      </div>
                      
                      <div className="text-slate-700 font-medium space-y-1 mb-4 bg-slate-50 p-3 rounded">
                        <p className={booking.slot_details.is_cancelled ? "line-through text-slate-400" : ""}>📅 {booking.slot_details.date}</p>
                        <p className={booking.slot_details.is_cancelled ? "line-through text-slate-400" : ""}>⏰ {booking.slot_details.start_time.substring(0,5)} - {booking.slot_details.end_time.substring(0,5)}</p>
                        
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Your Details</p>
                          <p className="text-sm"><span className="font-semibold">Goal:</span> {booking.current_goal || 'None provided'}</p>
                          <p className="text-sm"><span className="font-semibold">Injury:</span> {booking.past_injury || 'None provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Show meeting details only if they successfully paid! */}
                    {booking.payment_status === 'PAID' && !booking.slot_details.is_cancelled && (
                       <div className="border-t pt-4">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Fulfillment Details</p>
                          {booking.slot_details.session_type === 'ONLINE' ? (
                            <button 
                              onClick={() => {
                                if (booking.slot_details.meeting_link_or_address) {
                                  window.open(booking.slot_details.meeting_link_or_address, '_blank');
                                } else {
                                  alert("Your coach has not provided the Google Meet link yet. Please check back closer to the session time or message them.");
                                }
                              }}
                              className="w-full bg-indigo-600 text-white font-bold py-2 rounded text-sm hover:bg-indigo-700 transition shadow-sm mb-2"
                            >
                              🎥 Join Video Session
                            </button>
                          ) : (
                            <p className="text-sm text-slate-800 mb-3">
                              {booking.meeting_link_or_address || "Your coach will update the address soon."}
                            </p>
                          )}
                          
                          {!booking.has_reviewed ? (
                            <button 
                              onClick={() => {
                                setSelectedBookingForReview(booking);
                                setReviewModalOpen(true);
                              }}
                              className="w-full border-2 border-amber-600 text-amber-700 font-bold py-1.5 rounded text-sm hover:bg-amber-50 transition"
                            >
                              Leave a Review
                            </button>
                          ) : (
                            <div className="w-full bg-slate-100 text-slate-500 font-bold py-1.5 rounded text-sm text-center">
                              You reviewed this session
                            </div>
                          )}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPLORE SESSIONS */}
        {activeTab === 'explore' && (
           <>
            {selectedSlot ? (
              <div className="bg-white p-8 rounded-xl shadow max-w-2xl mx-auto border border-slate-100">
                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="text-amber-600 font-semibold mb-6 hover:underline"
                >
                  &larr; Back to Calendar
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Booking</h2>
                <p className="text-slate-600 mb-6">
                  Booking a session on {selectedSlot.date} with <strong>{selectedSlot.professional_name}</strong> for ₹{selectedSlot.price}.
                </p>

                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Goal</label>
                    <input 
                      type="text" 
                      name="current_goal" 
                      value={bookingForm.current_goal} 
                      onChange={handleFormChange} 
                      placeholder="e.g., Preparing for state selections, improving stamina"
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Past Injuries (Optional)</label>
                    <textarea 
                      name="past_injury" 
                      value={bookingForm.past_injury} 
                      onChange={handleFormChange} 
                      rows="3"
                      placeholder="Shared securely with your professional before the session..."
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-amber-500"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-amber-600 text-white font-bold py-3 rounded-lg hover:bg-amber-700 transition shadow-lg mb-3"
                  >
                    Proceed to Payment (₹{selectedSlot.price})
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const response = await api.post('conversations/', { professional_id: selectedSlot.professional });
                        navigate(`/chat?conversationId=${response.data.id}`);
                      } catch (e) {
                        alert("Could not start chat.");
                      }
                    }}
                    className="w-full bg-white border-2 border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition shadow-sm"
                  >
                    Message Coach
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold text-slate-700">Marketplace</h2>
                  <div className="flex flex-wrap gap-3">
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                    >
                      <option value="DATE_ASC">Sort: Soonest</option>
                      <option value="PRICE_ASC">Sort: Price (Low to High)</option>
                      <option value="PRICE_DESC">Sort: Price (High to Low)</option>
                      <option value="RATING_DESC">Sort: Top Rated</option>
                    </select>

                    <select 
                      value={filterType} 
                      onChange={e => setFilterType(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                    >
                      <option value="ALL">All Types</option>
                      <option value="ONLINE">Online Only</option>
                      <option value="OFFLINE">Offline Only</option>
                    </select>

                    <select 
                      value={filterSpecialty} 
                      onChange={e => setFilterSpecialty(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white max-w-[150px]"
                    >
                      <option value="ALL">All Specialties</option>
                      {dbSpecialties.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                    
                    <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded-lg">
                      <label className="text-sm text-slate-600">Max ₹{maxPrice}</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="10000" 
                        step="500"
                        value={maxPrice} 
                        onChange={e => setMaxPrice(e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>

                {filteredSlots.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
                    No slots match your filters. Please try broadening your search!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSlots.map(slot => (
                      <div key={slot.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center">
                              {slot.professional_name}
                              <span className="ml-2 text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                ⭐ {slot.professional_rating || 'New'} ({slot.reviews_count || 0})
                              </span>
                            </h3>
                            <p className="text-amber-600 font-medium text-sm">{slot.session_type} Session</p>
                            <p className="text-slate-500 text-xs mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded uppercase font-semibold">
                              {slot.professional_specialty || 'Coach'}
                            </p>
                          </div>
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                            ₹{slot.price}
                          </span>
                        </div>
                        
                        <div className="text-slate-600 mb-6 space-y-1">
                          <p>📅 {slot.date}</p>
                          <p>⏰ {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</p>
                          <p className="font-semibold text-indigo-700">
                            👥 {slot.max_capacity - slot.current_enrollments} Spots Left (Max {slot.max_capacity})
                          </p>
                        </div>

                        <button 
                          onClick={() => setSelectedSlot(slot)}
                          className="w-full border-2 border-amber-600 text-amber-700 font-bold py-2 rounded hover:bg-amber-50 transition"
                        >
                          Book Session
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
           </>
        )}

        {/* REVIEW MODAL */}
        {reviewModalOpen && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
              <button 
                onClick={() => setReviewModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Rate Your Session</h2>
              <p className="text-sm text-slate-500 mb-4">
                Leave a review for {selectedBookingForReview?.slot_details.professional_name}
              </p>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Rating (1-5)</label>
                  <select 
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                    <option value="4">⭐⭐⭐⭐ - Good</option>
                    <option value="3">⭐⭐⭐ - Average</option>
                    <option value="2">⭐⭐ - Poor</option>
                    <option value="1">⭐ - Terrible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Written Review</label>
                  <textarea 
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500"
                    placeholder="Tell others about your experience..."
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white font-bold py-2 rounded hover:bg-amber-700 transition">
                  Submit Review
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}