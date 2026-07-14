import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  toast: null,

  setToast: (toast) => set({ toast }),

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications?limit=20');
      const { notifications, unreadCount } = response.data.data;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/mark-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => {
      // Avoid duplicate notifications in list
      const exists = state.notifications.some(n => n._id === notification._id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  }
}));
