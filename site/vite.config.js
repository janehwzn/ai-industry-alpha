import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the build portable: works on GitHub Pages project URLs,
// custom domains, and local file preview without config changes.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
})
