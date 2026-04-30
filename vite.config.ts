import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['safari >= 12'],
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@generated': '/src/generated',
    },
  },
})
