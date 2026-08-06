// src/pages/AthleteDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AthleteDashboard() {
  const username = localStorage.getItem('user_name');
  
  // State for tabs and data
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'bookings'
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Intake form state
  const [bookingForm, setBookingForm] = useState({
    current_goal: '',
    past_injury: ''
  });

  // Fetch available slots and user's bookings on load
  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
  }, []);

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
      
      // 2. Load Razorpay
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 3. Configure the Razorpay Popup
      const options = {
        key: 'rzp_test_your_actual_key_here', // IMPORTANT: Replace with your actual Test Key ID
        amount: selectedSlot.price * 100, // Amount in paise
        currency: 'INR',
        name: 'Karsh Athlete Platform',
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
      alert('Failed to initialize booking. It may have already been booked.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Athlete Dashboard</h1>
            <p className="text-slate-500">Welcome back, {username}.</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => {setActiveTab('explore'); setSelectedSlot(null);}}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'explore' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Find Sessions
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'bookings' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              My Bookings
            </button>
          </div>
        </header>

        {/* TAB 1: MY BOOKINGS */}
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
                          booking.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </div>
                      
                      <div className="text-slate-700 font-medium space-y-1 mb-4 bg-slate-50 p-3 rounded">
                        <p>📅 {booking.slot_details.date}</p>
                        <p>⏰ {booking.slot_details.start_time.substring(0,5)} - {booking.slot_details.end_time.substring(0,5)}</p>
                      </div>
                    </div>

                    {/* Show meeting details only if they successfully paid! */}
                    {booking.payment_status === 'PAID' && (
                       <div className="border-t pt-4">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Fulfillment Details</p>
                          <p className="text-sm text-slate-800">
                            {booking.meeting_link_or_address || "Your coach will update the meeting link/address soon."}
                          </p>
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
                  className="text-emerald-600 font-semibold mb-6 hover:underline"
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
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-emerald-500"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition shadow-lg"
                  >
                    Proceed to Payment (₹{selectedSlot.price})
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-slate-700 mb-4">Available Coaching Slots</h2>
                {slots.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
                    No slots are currently available. Please check back later!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slots.map(slot => (
                      <div key={slot.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800">{slot.professional_name}</h3>
                            <p className="text-emerald-600 font-medium text-sm">{slot.session_type} Session</p>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                            ₹{slot.price}
                          </span>
                        </div>
                        
                        <div className="text-slate-600 mb-6 space-y-1">
                          <p>📅 {slot.date}</p>
                          <p>⏰ {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</p>
                        </div>

                        <button 
                          onClick={() => setSelectedSlot(slot)}
                          className="w-full border-2 border-emerald-600 text-emerald-700 font-bold py-2 rounded hover:bg-emerald-50 transition"
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

      </div>
    </div>
  );
}