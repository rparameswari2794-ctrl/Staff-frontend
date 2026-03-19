import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password }); // ✅ Changed
    const { access, refresh, user, role } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);

    return { user, role };
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    const { user, role = 'staff', access, refresh } = response.data;
    if (access && refresh) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', role);
    }
    return { user, role };
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined') return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getCurrentRole: () => localStorage.getItem('role'),

  isAuthenticated: () => !!localStorage.getItem('access_token'),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },
};

export default authService;