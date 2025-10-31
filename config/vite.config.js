import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, '../frontend'),
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../frontend/src')
    }
  },
  publicDir: resolve(__dirname, '../frontend/public')
});
