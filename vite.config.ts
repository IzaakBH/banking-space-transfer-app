import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "https://plutus.15062000.xyz",
  server: {
    proxy: {
      '/live/api': {
        target: 'https://api.starlingbank.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/live\/api/, '/api')
      },
      '/dev/api': {
        target: 'https://api-sandbox.starlingbank.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev\/api/, '/api')
      },
    }
  }
})
