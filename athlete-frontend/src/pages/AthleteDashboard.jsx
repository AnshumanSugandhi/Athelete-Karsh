// src/pages/AthleteDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AthleteDashboard() {
  const username = localStorage.getItem('user_name');
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [bookingForm, setBookingForm] = useState({
    current_goal: '',
    past_injury: ''
  });

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get('slots/');
      setSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

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

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Create the Pending Booking in Django
      const response = await api.post('bookings/', {
        slot: selectedSlot.id,
        current_goal: bookingForm.current_goal,
        past_injury: bookingForm.past_injury
      });

      const bookingData = response.data;
      
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const options = {
        key: 'rzp_test_TM6rgOQha0dARS', // IMPORTANT: Keep your Test Key ID here
        amount: selectedSlot.price * 100, 
        currency: 'INR',
        name: 'Karsh Athlete Platform',
        description: `Coaching Session with ${selectedSlot.professional_name}`,
        order_id: bookingData.razorpay_order_id, 
        
        handler: async function (paymentResponse) {
          // This block runs ONLY when the payment is 100% successful
          alert(`Payment Successful! Payment ID: ${paymentResponse.razorpay_payment_id}`);
          
          try {
            // A. Tell Django the payment was successful
            await api.patch(`bookings/${bookingData.id}/`, {
              payment_status: 'PAID',
              razorpay_payment_id: paymentResponse.razorpay_payment_id
            });

            // B. Tell Django to mark the Professional's slot as BOOKED
            await api.patch(`slots/${selectedSlot.id}/`, {
              is_booked: true
            });
            
          } catch (patchError) {
            console.error("Failed to update database status:", patchError);
          }
          
          // C. Reset the UI and refresh the grid (the booked slot will now vanish!)
          setSelectedSlot(null);
          setBookingForm({ current_goal: '', past_injury: '' });
          fetchAvailableSlots();
        },
        prefill: {
          name: username,
          email: 'athlete@karsh.com', // FIX: Adding an email forces Razorpay to show UPI & Wallets
          contact: '9999999999'
        },
        theme: {
          color: '#059669' 
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Booking failed:', error.response?.data);
      alert('Failed to initialize booking.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Athlete Dashboard</h1>
          <p className="text-slate-500">Welcome back, {username}. Find and book your next coaching session.</p>
        </header>

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
      </div>
    </div>
  );
}