import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    chunkSizeWarningLimit: 700,
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'pdfjs-dist'],
  },
  ssr: {
    external: ['buffer'],
  },
  // @ts-expect-error vitest injects test config at runtime
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
