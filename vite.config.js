import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://viit-smart-portal-backend.vercel.app/',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://viit-smart-portal-backend.vercel.app/',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://viit-smart-portal-backend.vercel.app/',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
