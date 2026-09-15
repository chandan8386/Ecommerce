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
  (res) => res,
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
  const data = err?.response?.data;
  if (data?.details?.length) return `${data.message}: ${data.details.map((d) => `${d.field ? `${d.field} – ` : ''}${d.message}`).join('; ')}`;
  return data?.message || err?.message || fallback;
};
