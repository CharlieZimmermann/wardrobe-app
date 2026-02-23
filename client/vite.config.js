import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Load .env from project root (parent of client/)
  envDir: '..',
  // Proxy API requests to the backend during development
  // When the frontend calls /api/health, it goes to the backend
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
