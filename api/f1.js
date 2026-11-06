import { parseRequest, proxy } from './_lib/f1proxy.js';

/**
 * GET /api/f1/<jolpica|openf1>/<caminho> — camada única de dados da F1 do site.
 * (A Vercel reescreve para /api/f1?provider=...&p=...; veja vercel.json.)
 */
export default async function handler(req, res) {
  const { provider, path, search } = parseRequest(req.url);
  const out = await proxy(provider, path, search);
  for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  res.status(out.status).send(out.body);
}
