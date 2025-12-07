import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tauri app build configuration
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index-tauri.html'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  // Prevent Vite from clearing the screen during dev
  clearScreen: false,
  // Tauri expects a fixed port in dev mode
  server: {
    port: 5173,
    strictPort: true,
  },
  // Use environment variables for Tauri internal usage
  envPrefix: ['VITE_', 'TAURI_'],
})
