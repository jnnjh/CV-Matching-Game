import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'

// Dev proxy: forwards /api/* requests to the backend.
// In production this proxy is not used — configure your hosting to route /api/* to your backend,
// or set BACKEND_URL to point to a non-local backend (e.g. a staging server).
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
})
