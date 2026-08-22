import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('fspms_token') || null,
  user: JSON.parse(localStorage.getItem('fspms_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('fspms_token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.success && res.data) {
        const { token, user } = res.data;
        localStorage.setItem('fspms_token', token);
        localStorage.setItem('fspms_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true, loading: false });
        return { success: true };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.message || 'Invalid username or password';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('fspms_token');
    localStorage.removeItem('fspms_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hasRole: (...roles) => {
    const user = get().user;
    if (!user || !user.role) return false;
    const userRole = user.role.name?.toLowerCase();
    if (userRole === 'admin') return true;
    return roles.some((r) => r.toLowerCase() === userRole);
  },
}));
