import axios from 'axios';

// The auth token lives in an httpOnly cookie the browser manages — never
// in localStorage/JS-readable storage, so it can't be exfiltrated by an
// XSS payload. withCredentials makes axios send/receive it automatically.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
