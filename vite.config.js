import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite + React + Tailwind v4 (Tailwind is wired in as a Vite plugin, no PostCSS config needed).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/dashboard/',
})
