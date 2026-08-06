// src/pages/ProfessionalPortal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

export default function ProfessionalPortal() {
  const username = localStorage.getItem('user_name');
  
  // State to hold the slots fetched from Django
  const [slots, setSlots] = useState([]);
  
  // State for the new slot form
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    session_type: 'OFFLINE',
    price: '1200.00' // Default price mapping to our Django model
  });

  // Fetch the slots as soon as the page loads
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await api.get('slots/');
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Post the new slot to Django
      await api.post('slots/', formData);
      
      // Refresh the list to show the newly added slot
      fetchSlots();
      alert('Availability Slot created successfully!');
    } catch (error) {
      console.error('Failed to create slot:', error.response?.data);
      alert('Error creating slot. Check the console.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Professional Portal</h1>
            <p className="text-slate-500">Manage your coaching availability, {username}.</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold">
            Status: Active
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Create Slot Form */}
          <div className="bg-white p-6 rounded-xl shadow border border-slate-100 h-fit">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Add Open Slot</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
                  <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">End Time</label>
                  <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Session Type</label>
                <select name="session_type" value={formData.session_type} onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500">
                  <option value="OFFLINE">Offline / In-Person</option>
                  <option value="ONLINE">Online Session</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded hover:bg-emerald-700 transition">
                Publish Slot
              </button>
            </form>
          </div>

          {/* Right Column: Existing Slots Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Your Schedule</h2>
            {slots.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
                You have not published any availability slots yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map(slot => (
                  <div key={slot.id} className="bg-white p-5 rounded-xl shadow border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">{slot.date}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${slot.is_booked ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {slot.is_booked ? 'BOOKED' : 'OPEN'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm">
                        {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                      </p>
                      <p className="text-slate-500 text-sm mt-1">Type: {slot.session_type}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-semibold text-slate-700">
                      ₹{slot.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}