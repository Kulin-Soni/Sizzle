import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/workers/background.ts"),
        content: resolve(__dirname, "src/scripts/youtube.ts"),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js'        
      },
    }
  }
});
