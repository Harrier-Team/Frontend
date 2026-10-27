import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5281',
        changeOrigin: true,
        ws: true, // Habilita WebSockets para o SignalR
      },
      // Health checks do backend, usados pela página Sistema.
      '/health': {
        target: 'http://127.0.0.1:5281',
        changeOrigin: true,
      },
    },
  },
})
