// src/pages/ProfessionalPortal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api';

export default function ProfessionalPortal() {
  const username = sessionStorage.getItem('user_name');
  const navigate = useNavigate();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' or 'bookings'

  // Schedule State
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    date: '', start_time: '', end_time: '', session_type: 'OFFLINE', price: '1200.00', max_capacity: 1
  });

  const [bookings, setBookings] = useState([]);
  const [linkInputs, setLinkInputs] = useState({}); // Stores the meeting links being typed

  // Performance View State
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [selectedAthleteLogs, setSelectedAthleteLogs] = useState([]);
  const [selectedAthleteName, setSelectedAthleteName] = useState('');

  // Reschedule State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', start_time: '', end_time: '' });
  
  // UI State
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchSlots();
    fetchBookings();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('auth/user/');
      setMyProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await api.get('slots/');
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('bookings/');
      setBookings(response.data);
      
      // Pre-fill the input boxes if a meeting link already exists in the database
      const initialLinks = {};
      response.data.forEach(b => {
        if (b.meeting_link_or_address) {
          initialLinks[b.id] = b.meeting_link_or_address;
        }
      });
      setLinkInputs(initialLinks);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // --- Schedule Handlers ---
  const handleSlotChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('slots/', formData);
      fetchSlots();
      alert('Availability Slot created successfully!');
    } catch (error) {
      console.error('Failed to create slot:', error);
    }
  };

  const handleUpdateDetails = async (bookingId) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      await api.patch(`slots/${booking.slot}/`, {
        meeting_link_or_address: linkInputs[bookingId]
      });
      alert('Details successfully updated!');
      fetchBookings();
      fetchSlots();
    } catch (error) {
      console.error('Failed to update details:', error);
      alert('Failed to save details.');
    }
  };

  const handleViewPerformance = async (athleteId, athleteName) => {
    try {
      const response = await api.get(`performance/?athlete_id=${athleteId}`);
      setSelectedAthleteLogs(response.data.reverse());
      setSelectedAthleteName(athleteName);
      setPerformanceModalOpen(true);
    } catch (error) {
      alert("Failed to fetch athlete performance.");
    }
  };

  const handleGenerateMeet = async (slotId) => {
    try {
      const response = await api.post(`slots/${slotId}/generate_meet/`);
      alert('Google Meet Link successfully generated!');
      fetchBookings();
      fetchSlots();
    } catch (error) {
      console.error('Failed to generate meet link:', error);
      const msg = error.response?.data?.error || 'Failed to generate link. Try logging out and back in with Google.';
      alert(msg);
    }
  };

  const handleCancelSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to cancel this session? All athletes will be automatically refunded.")) return;
    try {
      await api.post(`slots/${slotId}/cancel/`);
      alert('Session cancelled and refunds initiated.');
      fetchSlots();
      fetchBookings();
    } catch (error) {
      alert('Failed to cancel session.');
    }
  };

  const openRescheduleModal = (slot) => {
    setSelectedSlot(slot);
    setRescheduleData({ date: slot.date, start_time: slot.start_time, end_time: slot.end_time });
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`slots/${selectedSlot.id}/reschedule/`, rescheduleData);
      alert('Session rescheduled successfully!');
      setRescheduleModalOpen(false);
      fetchSlots();
      fetchBookings();
    } catch (error) {
      alert('Failed to reschedule session.');
    }
  };

  const getAverageRating = () => {
    if (slots.length > 0 && slots[0].professional_rating) {
      return `⭐ ${slots[0].professional_rating} (${slots[0].reviews_count} Reviews)`;
    }
    return '⭐ New (No Reviews Yet)';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Professional Portal</h1>
            <p className="text-slate-500 mt-1 flex items-center">
              Welcome back, {username} 
              {myProfile?.professional_profile?.speciality?.name && (
                <span className="ml-2 text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                  {myProfile.professional_profile.speciality.name}
                </span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block">
              {getAverageRating()}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'schedule' ? 'bg-white shadow text-amber-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              My Schedule
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'bookings' ? 'bg-white shadow text-amber-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Client Roster
            </button>
          </div>
        </header>

        {/* TAB 1: SCHEDULE MANAGEMENT */}
        {activeTab === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-fit">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Add Open Slot</h2>
              <form onSubmit={handleSlotSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleSlotChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Start</label>
                    <input type="time" name="start_time" value={formData.start_time} onChange={handleSlotChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">End</label>
                    <input type="time" name="end_time" value={formData.end_time} onChange={handleSlotChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                  <select name="session_type" value={formData.session_type} onChange={handleSlotChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500">
                    <option value="OFFLINE">Offline / In-Person</option>
                    <option value="ONLINE">Online Session</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Capacity</label>
                  <input type="number" name="max_capacity" min="1" value={formData.max_capacity} onChange={handleSlotChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-slate-500" required />
                  <p className="text-xs text-slate-500 mt-1">Set to 1 for private sessions.</p>
                </div>
                <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition">Publish Availability</button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Your Slots</h2>
              {slots.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">No slots published yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots.map(slot => (
                    <div key={slot.id} className="bg-white p-5 rounded-xl shadow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-slate-800">{slot.date}</span>
                          {slot.is_cancelled ? (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">CANCELLED</span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">PUBLISHED</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</p>
                        <p className="font-semibold mt-2 text-sm text-indigo-700">
                          👥 {slot.current_enrollments || 0} / {slot.max_capacity} Enrolled
                        </p>
                        {slot.session_type === 'ONLINE' && !slot.is_cancelled && (
                          <button 
                            onClick={() => {
                              if (slot.meeting_link_or_address) {
                                window.open(slot.meeting_link_or_address, '_blank');
                              } else {
                                alert("You have not provided a Google Meet link for this session yet. Please add one in the Client Roster tab.");
                              }
                            }}
                            className="mt-3 w-full bg-indigo-600 text-white font-bold py-1.5 rounded text-sm hover:bg-indigo-700 transition"
                          >
                            🎥 Host Video Session
                          </button>
                        )}
                        {!slot.is_cancelled && (
                          <div className="flex space-x-2 mt-3">
                            <button onClick={() => openRescheduleModal(slot)} className="flex-1 bg-amber-100 text-amber-700 font-bold py-1.5 rounded text-sm hover:bg-amber-200 transition">
                              Reschedule
                            </button>
                            <button onClick={() => handleCancelSlot(slot.id)} className="flex-1 bg-red-100 text-red-700 font-bold py-1.5 rounded text-sm hover:bg-red-200 transition">
                              Cancel
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => setExpandedSlot(expandedSlot === slot.id ? null : slot.id)}
                          className="mt-3 w-full border border-slate-300 text-slate-600 font-bold py-1.5 rounded text-sm hover:bg-slate-50 transition"
                        >
                          {expandedSlot === slot.id ? 'Hide Details' : 'View Details & Athletes'}
                        </button>
                        
                        {expandedSlot === slot.id && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-slate-700 text-sm mb-2">Enrolled Athletes:</h4>
                            {bookings.filter(b => b.slot === slot.id && b.payment_status === 'PAID').length === 0 ? (
                              <p className="text-slate-500 text-sm">No one has enrolled yet.</p>
                            ) : (
                              <ul className="space-y-1">
                                {bookings.filter(b => b.slot === slot.id && b.payment_status === 'PAID').map(b => (
                                  <li key={b.id} className="text-sm bg-slate-50 p-2 rounded text-slate-700 font-medium">
                                    • {b.athlete_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT ROSTER */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Client Roster & Fulfillment</h2>
            {bookings.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
                You do not have any booked sessions yet.
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map(booking => (
                  <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                    
                    {/* Left Column: Session Info & Athlete Notes */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-xl text-slate-800">Athlete: {booking.athlete_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.payment_status === 'PAID' ? 'bg-amber-100 text-amber-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium text-slate-600 mb-4">
                        <span className="mr-4">📅 {booking.slot_details.date}</span>
                        <span>⏰ {booking.slot_details.start_time.substring(0,5)} - {booking.slot_details.end_time.substring(0,5)}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Current Goal</p>
                          <p className="text-sm text-slate-700">{booking.current_goal}</p>
                        </div>
                        {booking.past_injury && (
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Past Injuries</p>
                            <p className="text-sm text-amber-700">{booking.past_injury}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Provide Meeting Details */}
                    <div className="md:w-1/3 bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col justify-center">
                      {booking.slot_details.session_type === 'ONLINE' && (
                        <div className="flex gap-2 mb-2">
                          <button 
                            onClick={() => {
                              if (booking.slot_details.meeting_link_or_address) {
                                window.open(booking.slot_details.meeting_link_or_address, '_blank');
                              } else {
                                alert("You have not provided a Google Meet link for this session yet. Please paste one in the input box below and save.");
                              }
                            }}
                            className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded transition hover:bg-indigo-700 shadow-sm text-sm"
                          >
                            🎥 Host Video Session
                          </button>
                          <button
                            onClick={() => handleGenerateMeet(booking.slot_details.id)}
                            title="Generate New Google Meet"
                            className="bg-emerald-600 text-white font-bold py-2 px-3 rounded transition hover:bg-emerald-700 shadow-sm text-sm whitespace-nowrap"
                          >
                            ✨ Generate Meet
                          </button>
                        </div>
                      )}
                      <div className="mb-4 space-y-2 border-t pt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          {booking.slot_details.session_type === 'ONLINE' ? 'Update Meeting Link' : 'Update Meeting Address'}
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={linkInputs[booking.id] || ''}
                            onChange={(e) => setLinkInputs({...linkInputs, [booking.id]: e.target.value})}
                            placeholder={booking.slot_details.session_type === 'ONLINE' ? "Paste Google Meet Link..." : "e.g., Stadium Track 3"}
                            className="flex-1 px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-slate-500"
                          />
                          <button 
                            onClick={() => handleUpdateDetails(booking.id)}
                            className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-amber-700 transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* View Performance Button */}
                      <button 
                        onClick={() => handleViewPerformance(booking.athlete, booking.athlete_name)}
                        className="w-full bg-slate-800 text-white font-bold py-2 rounded transition hover:bg-slate-900 mb-2"
                      >
                        View Performance
                      </button>

                      {/* Chat Button */}
                      <button 
                        onClick={async () => {
                          try {
                            const response = await api.post('conversations/', { athlete_id: booking.athlete });
                            navigate(`/chat?conversationId=${response.data.id}`);
                          } catch (e) {
                            alert("Could not start chat. Ensure the athlete is valid.");
                          }
                        }}
                        className="w-full bg-white border-2 border-slate-300 text-slate-700 font-bold py-2 rounded transition hover:bg-slate-50"
                      >
                        Message Athlete
                      </button>

                      {booking.payment_status !== 'PAID' && (
                        <p className="text-xs text-center text-slate-500 mt-2">Cannot provide details until payment clears.</p>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PERFORMANCE MODAL */}
        {performanceModalOpen && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative h-[80vh] flex flex-col">
              <button 
                onClick={() => setPerformanceModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{selectedAthleteName}'s Performance</h2>
              
              {selectedAthleteLogs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  This athlete has not logged any performance metrics yet.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6">
                  <div className="h-64 border border-slate-100 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-2">Fatigue vs Exertion (RPE)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedAthleteLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                        <Line type="monotone" dataKey="fatigue_level" stroke="#f59e0b" name="Fatigue (1-10)" strokeWidth={2} />
                        <Line type="monotone" dataKey="perceived_exertion" stroke="#ef4444" name="Exertion (1-10)" strokeWidth={2} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-64 border border-slate-100 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-2">Sleep vs Training Volume</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedAthleteLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
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
                  </div>

                  <div className="h-64 border border-slate-100 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-2">Recovery: Soreness, Stress & Fatigue</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedAthleteLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 border border-slate-100 rounded-xl p-4 shadow-sm">
                      <h3 className="font-bold text-slate-700 mb-2">Resting Heart Rate</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedAthleteLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                          <Line type="monotone" dataKey="resting_heart_rate" stroke="#ec4899" name="RHR (BPM)" strokeWidth={2} />
                          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                          <XAxis dataKey="date" />
                          <YAxis domain={['auto', 'auto']} />
                          <Tooltip />
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64 border border-slate-100 rounded-xl p-4 shadow-sm">
                      <h3 className="font-bold text-slate-700 mb-2">Nutrition & Hydration</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedAthleteLogs} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
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
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-700 mb-2">Recent Notes</h3>
                    <div className="space-y-3">
                      {selectedAthleteLogs.slice(-5).reverse().map(log => log.notes && (
                        <div key={log.id} className="bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                          <span className="font-bold text-slate-500 mr-2">{log.date}:</span>
                          {log.notes}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* RESCHEDULE MODAL */}
      {rescheduleModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setRescheduleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Reschedule Session</h2>
            <p className="text-slate-600 mb-4">Athletes will be automatically notified of this change.</p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">New Date</label>
                <input type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">New Start</label>
                  <input type="time" value={rescheduleData.start_time} onChange={(e) => setRescheduleData({...rescheduleData, start_time: e.target.value})} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">New End</label>
                  <input type="time" value={rescheduleData.end_time} onChange={(e) => setRescheduleData({...rescheduleData, end_time: e.target.value})} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-amber-600 text-white font-bold py-3 rounded-lg hover:bg-amber-700 transition">Confirm Reschedule</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

