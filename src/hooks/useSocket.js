import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

let socket = null;

export const useSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification, setToast } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (!socket) {
      // Use VITE_API_BASE_URL in production, otherwise default to current origin (handled by Vite proxy)
      const socketUrl = import.meta.env.VITE_API_BASE_URL || undefined;
      
      // Vercel Serverless does NOT support true WebSockets (wss://). 
      // Force 'polling' in production to prevent the connection errors in the console.
      const transports = socketUrl?.includes('vercel.app') 
        ? ['polling'] 
        : ['websocket', 'polling'];

      socket = io(socketUrl, {
        autoConnect: true,
        transports,
      });

      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
        
        // Join personal user room
        socket.emit('join_user', user._id);
        
        // Join campus group room for filtered announcements
        if (user.role === 'student') {
          socket.emit('join_campus_group', {
            department: user.department,
            year: user.year,
          });
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Listen for notifications
      socket.on('notification', (data) => {
        const formattedNotice = {
          _id: data.relatedId || `socket-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
          ...data,
          isRead: false,
        };

        // Add to global store list
        addNotification(formattedNotice);
        
        // Dispatch toast popup
        setToast({
          title: data.title,
          message: data.message,
          type: data.type,
        });
      });
    }

    return () => {
      // Socket instance is persistent as a singleton, do not disconnect on small sub-component re-renders
    };
  }, [user, isAuthenticated, addNotification, setToast]);

  return socket;
};
export default useSocket;
