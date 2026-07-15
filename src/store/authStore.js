import { create } from 'zustand';
import axios from 'axios';

// Resolve API base — uses VITE_API_BASE_URL in production builds,
// falls back to the Vite-proxied relative path for local dev.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

// Create axios instance with credentials support for cross-origin requests
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach stored access token automatically to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('viit_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const useAuthStore = create((set, get) => ({
  // User is never persisted in localStorage — always fetched fresh from the API
  user: null,
  accessToken: localStorage.getItem('viit_accessToken') || null,
  refreshToken: localStorage.getItem('viit_refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('viit_accessToken'),
  isLoading: false,
  error: null,

  setAuthData: (user, accessToken, refreshToken) => {
    // Only tokens are persisted; user object stays in-memory only
    if (accessToken) localStorage.setItem('viit_accessToken', accessToken);
    if (refreshToken) localStorage.setItem('viit_refreshToken', refreshToken);

    set({
      user: user || get().user,
      accessToken: accessToken || get().accessToken,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
      error: null,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('viit_accessToken');
    localStorage.removeItem('viit_refreshToken');
    // Also remove legacy user key if it exists from older sessions
    localStorage.removeItem('viit_user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;
      get().setAuthData(user, accessToken, refreshToken);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (signupData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', signupData);
      const { user, accessToken, refreshToken } = response.data.data;
      get().setAuthData(user, accessToken, refreshToken);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const token = get().refreshToken;
      await api.post('/auth/logout', { refreshToken: token }, {
        headers: {
          Authorization: `Bearer ${get().accessToken}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().clearAuth();
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    const accessToken = get().accessToken;
    if (!accessToken) {
      get().clearAuth();
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // User profile is always sourced from the API, never from localStorage
      set({ user: response.data.data, isAuthenticated: true });
    } catch (error) {
      // If unauthorized, try to refresh tokens
      try {
        await get().refreshTokens();
      } catch (refreshErr) {
        get().clearAuth();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  refreshTokens: async () => {
    const rToken = get().refreshToken;
    if (!rToken) {
      get().clearAuth();
      throw new Error('No refresh token');
    }

    try {
      const response = await api.post('/auth/refresh', { refreshToken: rToken });
      const { accessToken, refreshToken } = response.data.data;
      get().setAuthData(null, accessToken, refreshToken);
      return accessToken;
    } catch (error) {
      get().clearAuth();
      throw error;
    }
  }
}));
