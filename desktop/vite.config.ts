import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const shared = path.resolve(__dirname, '../src');

export default defineConfig({
  plugins: [react()],
  // The shared phone code in ../src sits under the phone's tsconfig.json, which extends a React
  // Native package that is only installed at the repo root. CI installs just the desktop
  // dependencies, so Vite could not read it and the build failed. Passing the few options esbuild
  // needs as a string makes Vite skip the tsconfig lookup. Keep these in step with tsconfig.json.
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: { target: 'ES2022', useDefineForClassFields: true, jsx: 'react-jsx' },
    }),
  },
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
