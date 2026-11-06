import { buildNews } from './_lib/rss.js';

/**
 * GET /api/news — central de notícias do GRID F1.
 * Lê os feeds RSS públicos das fontes no servidor (os navegadores não podem,
 * por CORS) e devolve JSON. A Vercel guarda a resposta em cache por 10 min.
 */
export default async function handler(_req, res) {
  try {
    const data = await buildNews();
    const anyOk = data.sources.some((s) => s.ok);
    res.setHeader('Cache-Control', anyOk ? 'public, s-maxage=600, stale-while-revalidate=3600' : 'no-store');
    res.status(anyOk ? 200 : 502).json(data);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ error: err instanceof Error ? err.message : 'erro' });
  }
}
