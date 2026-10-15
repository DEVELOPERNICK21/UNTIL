import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const shared = path.resolve(__dirname, '../src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@until': shared,
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    // Shared phone code (core/time, theme/progressColor, types) lives one level up.
    fs: { allow: [__dirname, shared] },
  },
  clearScreen: false,
});
