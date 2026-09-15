import axios from 'axios';

export const TOKEN_KEY = 'aurum_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Extracts a human readable message from an axios error. */
export const errorMessage = (err, fallback = 'Something went wrong') => {
  // A non-JSON reply (e.g. Vercel's HTML page or a 405) means the request never reached the API server.
  if (err?.response && (typeof err.response.data !== 'object' || err.response.data === null)) {
    return 'Our store is temporarily unavailable. Please try again shortly.';
  }
  if (err && !err.response && err.request) return 'Network error: unable to reach the server. Please check your connection.';
  const data = err?.response?.data;
  if (data?.details?.length && data.message === 'Validation failed') {
    return data.details.map((d) => d.message).join(', ');
  }
  return data?.message || err?.message || fallback;
};
