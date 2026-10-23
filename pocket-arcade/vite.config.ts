/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // não herdar o PostCSS/Tailwind do site que está na pasta de cima
  css: { postcss: { plugins: [] } },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // caminho absoluto: sem isso o Vitest procura o setup do site na pasta de cima
    setupFiles: [decodeURIComponent(new URL('./src/test/setup.ts', import.meta.url).pathname)],
  },
});
