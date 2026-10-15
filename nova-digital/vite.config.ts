/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // caminhos relativos: o build funciona em qualquer pasta ou subdomínio
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    // Three.js (~1 MB) vai para o chunk do GlobeScene, carregado sob demanda via import()
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
