import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('teamsync_auth');
  if (auth) {
    const { accessToken } = JSON.parse(auth);
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const auth = localStorage.getItem('teamsync_auth');
      const refresh = auth ? JSON.parse(auth).refreshToken : null;
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
          const next = { user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken };
          localStorage.setItem('teamsync_auth', JSON.stringify(next));
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(err.config);
        } catch {
          localStorage.removeItem('teamsync_auth');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
