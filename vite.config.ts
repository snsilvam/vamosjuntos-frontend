import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En producción Firebase Hosting reescribe /api/** hacia Cloud Run;
    // en desarrollo el proxy imita ese mismo origen.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
