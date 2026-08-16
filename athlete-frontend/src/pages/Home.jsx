import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-amber-500 selection:text-slate-900">
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Master your craft with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">DronaMeet.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-lg leading-relaxed">
            The premium platform connecting ambitious athletes and learners with world-class coaches. 
            Experience elite 1-on-1 mentorship and scalable group masterclasses, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="bg-amber-500 text-slate-900 font-bold px-8 py-4 rounded-full hover:bg-amber-400 transition transform hover:-translate-y-1 shadow-lg shadow-amber-500/30 text-lg"
            >
              Start Your Journey
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-slate-800 text-white font-bold px-8 py-4 rounded-full hover:bg-slate-700 transition border border-slate-700 text-lg"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Abstract Hero Image/Graphic */}
        <div className="md:w-1/2 mt-16 md:mt-0 relative flex justify-center z-10">
          <div className="absolute inset-0 bg-amber-500 blur-[120px] opacity-20 rounded-full w-3/4 h-3/4 mx-auto"></div>
          <div className="relative bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 w-full max-w-md backdrop-blur-sm bg-opacity-80">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 font-bold text-xl">D</div>
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">LIVE SESSION</span>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              <div className="h-32 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-center">
                <span className="text-4xl">🎥</span>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-slate-700 rounded-full w-8"></div>
                <div className="h-8 bg-slate-700 rounded-full w-8"></div>
                <div className="h-8 bg-slate-700 rounded-full w-8"></div>
                <div className="h-8 bg-slate-700 rounded-full w-8 flex items-center justify-center text-xs font-bold">+12</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-950 py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Elevate your coaching business.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to host, manage, and scale your expertise globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white">1-on-1 Mentorship</h3>
              <p className="text-slate-400 leading-relaxed">
                Offer exclusive private sessions. Set your price, define your availability, and let athletes book directly.
              </p>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">👥</div>
              <h3 className="text-xl font-bold mb-3 text-white">Group Masterclasses</h3>
              <p className="text-slate-400 leading-relaxed">
                Scale your income by hosting up to hundreds of learners in a single session. Perfect for webinars or team training.
              </p>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">🎥</div>
              <h3 className="text-xl font-bold mb-3 text-white">Native Video Rooms</h3>
              <p className="text-slate-400 leading-relaxed">
                No more sharing Zoom links. High-quality, secure video conferencing is built directly into DronaMeet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-8">Ready to meet your potential?</h2>
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of professionals and learners already using DronaMeet to bridge the gap between ambition and achievement.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-amber-500 text-slate-900 font-bold px-10 py-5 rounded-full hover:bg-amber-400 transition text-xl shadow-xl shadow-amber-500/20"
          >
            Create Your Account
          </button>
        </div>
      </section>

    </div>
  );
}
