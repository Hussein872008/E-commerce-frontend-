import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://e-commerce-backend-production-7ac6.up.railway.app/',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://e-commerce-backend-production-7ac6.up.railway.app/',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
