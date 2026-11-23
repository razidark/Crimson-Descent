import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for potential Electron builds
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  server: {
    host: '127.0.0.1',
    port: 5181,
  }
})
