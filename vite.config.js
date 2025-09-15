import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


function devJsxContentTypePlugin() {
  return {
    name: 'dev-jsx-content-type',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          if (req.url && req.url.match(/\.jsx($|\?|#)/)) {
            res.setHeader('Content-Type', 'text/jsx; charset=utf-8');
          }
        } catch (e) {
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), devJsxContentTypePlugin()],

  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false
    }
  },

  build: {
    sourcemap: false
  },
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
