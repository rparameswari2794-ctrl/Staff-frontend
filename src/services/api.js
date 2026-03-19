import axios from 'axios';

const baseURL = '/api'; // or import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL });

// Token helpers
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setAccessToken = (token) => localStorage.setItem('access_token', token);
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        // ✅ Correct path including 'auth/'
        const refreshResponse = await axios.post(
          '/auth/token/refresh/',
          { refresh: getRefreshToken() },
          { baseURL }
        );

        const newAccessToken = refreshResponse.data.access;
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;