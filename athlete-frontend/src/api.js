// src/api.js
import axios from 'axios';

// 1. Create a core instance pointing to our Django server
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// 2. Add a Request Interceptor
// This pauses every outgoing API request and checks if we have a saved login token.
// If we do, it securely attaches it to the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      // The dj-rest-auth package expects the word "Bearer" before the token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Add a Response Interceptor
// This catches any incoming responses from the Django backend.
// If the backend returns a 401 Unauthorized (invalid or expired token),
// it automatically logs the user out and redirects them to the login page.
api.interceptors.response.use(
  (response) => {
    return response; // If everything is okay, just pass it through
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear out the stale tokens and user data
      sessionStorage.clear();
      localStorage.clear();
      
      // Only redirect if they aren't already on the login or register page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;