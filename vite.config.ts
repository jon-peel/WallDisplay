import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [legacy({
    targets: ['safari >= 9'],
  }), cloudflare()],
  resolve: {
    alias: {
      '@': '/src',
      '@generated': '/src/generated',
    },
  },
})