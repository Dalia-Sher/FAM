import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Project Pages URL: https://dalia-sher.github.io/FAM/
  base: command === 'build' ? '/FAM/' : '/',
  server: {
    host: true,
    port: 5173,
  },
}))
