import axios from 'axios';

// Check if we're in production
const isProduction = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL;

console.log('Environment:', isProduction ? 'production' : 'development');
console.log('VITE_API_URL:', apiUrl);

// In production, use the absolute URL from env
// In development, use relative path (will be proxied)
const baseURL = isProduction && apiUrl 
  ? `${apiUrl}/api` 
  : '/api';

console.log('Final Base URL:', baseURL);

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
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
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
        const refreshResponse = await axios.post(
          `${baseURL}/auth/token/refresh/`,
          { refresh: getRefreshToken() }
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