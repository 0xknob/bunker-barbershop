import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api → backend Fastify em :3001 (evita CORS no dev)
      '/api': 'http://localhost:3001',
      '/api/auth': 'http://localhost:3001',
    },
  },
});
