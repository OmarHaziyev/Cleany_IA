import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), 
            tailwindcss(),],
  server: {
    port: 5173,  // or any port you want
    host: '0.0.0.0',  // Allow it to be accessible on local network
  }
})
