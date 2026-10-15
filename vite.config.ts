/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // nova-digital/ é um projeto separado, com dependências e testes próprios
    exclude: [...configDefaults.exclude, 'nova-digital/**'],
  },
});
