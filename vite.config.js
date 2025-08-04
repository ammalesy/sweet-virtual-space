import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    process: {
      env: {}
    }
  },
  resolve: {
    alias: {
      util: 'util',
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    include: ['simple-peer', 'buffer', 'util', 'stream-browserify']
  }
})