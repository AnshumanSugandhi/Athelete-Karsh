// src/pages/ProfessionalPortal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

export default function ProfessionalPortal() {
  const username = localStorage.getItem('user_name');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' or 'bookings'

  // Schedule State
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    date: '', start_time: '', end_time: '', session_type: 'OFFLINE', price: '1200.00'
  });

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [linkInputs, setLinkInputs] = useState({}); // Stores the meeting links being typed

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, []);

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

  // --- Booking Handlers ---
  const handleLinkChange = (bookingId, value) => {
    setLinkInputs({ ...linkInputs, [bookingId]: value });
  };

  const handleUpdateFulfillment = async (bookingId) => {
    try {
      // Send a PATCH request to update ONLY the meeting link field
      await api.patch(`bookings/${bookingId}/`, {
        meeting_link_or_address: linkInputs[bookingId]
      });
      alert('Meeting details successfully sent to the athlete!');
      fetchBookings();
    } catch (error) {
      console.error('Failed to update details:', error);
      alert('Failed to save details.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Professional Portal</h1>
            <p className="text-slate-500">Manage your schedule and clients, {username}.</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'schedule' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              My Schedule
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'bookings' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-800'}`}
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
                  <input type="date" name="date" value={formData.date} onChange={handleSlotChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Start</label>
                    <input type="time" name="start_time" value={formData.start_time} onChange={handleSlotChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">End</label>
                    <input type="time" name="end_time" value={formData.end_time} onChange={handleSlotChange} required className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                  <select name="session_type" value={formData.session_type} onChange={handleSlotChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500">
                    <option value="OFFLINE">Offline / In-Person</option>
                    <option value="ONLINE">Online Session</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded hover:bg-emerald-700 transition">Publish Slot</button>
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
                          <span className="font-bold">{slot.date}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${slot.is_booked ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {slot.is_booked ? 'BOOKED' : 'OPEN'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</p>
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
                          booking.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        {booking.slot_details.session_type === 'ONLINE' ? 'Provide Meeting Link' : 'Provide Physical Address'}
                      </label>
                      <textarea
                        rows="3"
                        placeholder="e.g., Google Meet Link or Stadium Address..."
                        value={linkInputs[booking.id] || ''}
                        onChange={(e) => handleLinkChange(booking.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm mb-3 focus:ring-2 focus:ring-emerald-500"
                        disabled={booking.payment_status !== 'PAID'}
                      ></textarea>
                      <button 
                        onClick={() => handleUpdateFulfillment(booking.id)}
                        disabled={booking.payment_status !== 'PAID'}
                        className={`w-full font-bold py-2 rounded transition ${
                          booking.payment_status === 'PAID' 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Send to Athlete
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

      </div>
    </div>
  );
}