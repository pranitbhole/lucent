import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // ← just /api, Vite proxies it
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;