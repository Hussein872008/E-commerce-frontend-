import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ecommerce-backend-dsyt8h5e8-husseins-projects-8485646e.vercel.app/',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://ecommerce-backend-dsyt8h5e8-husseins-projects-8485646e.vercel.app/',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
