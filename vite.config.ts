import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/blog-author/',
  plugins: [vue()],
  server: {
    port: 5173
  }
})
