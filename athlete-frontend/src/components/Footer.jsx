import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="text-2xl font-bold text-amber-500 tracking-tight">
            DronaMeet
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            Master your craft with the world's leading coaches and experts. The ultimate platform for 1-on-1 mentorship and scalable group masterclasses.
          </p>
        </div>
        
        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Platform</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-amber-500 transition">Find a Coach</Link></li>
            <li><Link to="/login" className="hover:text-amber-500 transition">Host a Masterclass</Link></li>
            <li><Link to="/learning" className="hover:text-amber-500 transition">Learning Hub</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-amber-500 transition">About Us</a></li>
            <li><a href="#" className="hover:text-amber-500 transition">Careers</a></li>
            <li><a href="#" className="hover:text-amber-500 transition">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-amber-500 transition">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-amber-500 transition">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
        &copy; {new Date().getFullYear()} DronaMeet Inc. All rights reserved.
      </div>
    </footer>
  );
}
