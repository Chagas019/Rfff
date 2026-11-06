/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

/** Identificador desta publicação (o commit na Vercel; senão, a hora do build). */
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || String(Date.now());

/** Gera /version.json — o site consulta este arquivo para se atualizar sozinho quando sai uma versão nova. */
function versionFile(): Plugin {
  return {
    name: 'gridf1-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID, builtAt: new Date().toISOString() }) });
    },
  };
}

/** Serve /api/news também em `vite` e `vite preview` (na Vercel é a função em api/news.js). */
function newsApi(): Plugin {
  const handle = async (_req: unknown, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }) => {
    const { buildNews } = await import('./api/_lib/rss.js');
    const data = await buildNews();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };
  return {
    name: 'gridf1-news-api',
    configureServer(server) { server.middlewares.use('/api/news', handle); },
    configurePreviewServer(server) { server.middlewares.use('/api/news', handle); },
  };
}

export default defineConfig({
  plugins: [react(), versionFile(), newsApi()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
