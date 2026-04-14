/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@framework': path.resolve(__dirname, 'framework'),
      '@shell': path.resolve(__dirname, 'shell'),
      '@mockups': path.resolve(__dirname, 'mockups'),
      '@app': path.resolve(__dirname, 'app'),
      '@projects': path.resolve(__dirname, '../../Projects'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
  },
  server: {
    port: 5173,
    strictPort: false,
    fs: {
      allow: ['..', path.resolve(__dirname, '../../Projects')],
    },
  },
});
