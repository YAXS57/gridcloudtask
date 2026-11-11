import axios from 'axios';

// Set REACT_APP_API_URL in Netlify to the public Railway backend URL.
// Local development keeps the Laravel default URL.
export const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('gridcloud_lecturer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
