import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'components': resolve(__dirname, 'src/components'),
      'pages': resolve(__dirname, 'src/pages'),
      'services': resolve(__dirname, 'src/services'),
      'utils': resolve(__dirname, 'src/utils'),
      'styles': resolve(__dirname, 'src/styles'),
      'contexts': resolve(__dirname, 'src/contexts')
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
