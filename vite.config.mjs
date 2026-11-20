import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
        legal: resolve(import.meta.dirname, 'legal.html'),
        trader: resolve(import.meta.dirname, 'trader.html'),
        ticket: resolve(import.meta.dirname, 'ticket.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      }
    }
  }
});
