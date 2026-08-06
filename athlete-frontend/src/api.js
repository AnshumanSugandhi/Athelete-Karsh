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
    const token = localStorage.getItem('access_token');
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

export default api;