import axios from 'axios';

export const TOKEN_KEY = 'aurum_admin_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
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
  (res) => {
    // A static host can answer /api/* with an HTML page. Treat that as a failure, never as data.
    if (typeof res.data !== 'object' || res.data === null) {
      const err = new Error('Unexpected response from the API server');
      err.response = res;
      err.config = res.config;
      return Promise.reject(err);
    }
    return res;
  },
  (error) => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && localStorage.getItem(TOKEN_KEY) && error.config?.url === '/auth/me') {
      onUnauthorized();
    } else if (status === 401 && localStorage.getItem(TOKEN_KEY)) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong') => {
  // A non-JSON reply (e.g. Vercel's HTML page or a 405) means the request never reached the API server.
  if (err?.response && (typeof err.response.data !== 'object' || err.response.data === null)) {
    return 'Cannot reach the API server. The admin is not connected to the backend yet (check VITE_API_URL).';
  }
  if (err && !err.response && err.request) return 'Network error: unable to reach the API server. Please try again.';
  const data = err?.response?.data;
  if (data?.details?.length) return `${data.message}: ${data.details.map((d) => `${d.field ? `${d.field} – ` : ''}${d.message}`).join('; ')}`;
  return data?.message || err?.message || fallback;
};
