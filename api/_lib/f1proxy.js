/**
 * Camada de integração de dados da F1 (servidor).
 * O site nunca fala direto com os provedores: tudo passa por /api/f1/<provedor>/<caminho>.
 * Trocar de provedor = mudar só a tabela PROVIDERS abaixo.
 *
 * - Lista de caminhos permitidos (nada de proxy aberto).
 * - Cache na borda da Vercel: curto para a temporada atual (dados mudam durante o GP),
 *   longo para temporadas passadas.
 * - Detecta a restrição da OpenF1 durante sessões ao vivo (401) e devolve 423 com motivo,
 *   para o site cair na reserva (Jolpica) e avisar o usuário.
 */
export const PROVIDERS = {
  jolpica: {
    base: 'https://api.jolpi.ca/ergast/f1',
    allow: /^\/(\d{4}|current)(\/\d+)?(\/(results|qualifying|sprint|driverstandings|constructorstandings|drivers|constructors|status))?(\/\d+)?\.json$|^\/(\d{4})\.json$|^\/drivers\/[a-z_]+\/(seasons|driverstandings)\.json$|^\/\d{4}\/drivers\/[a-z_]+\/driverstandings\.json$/,
  },
  openf1: {
    base: 'https://api.openf1.org/v1',
    allow: /^\/(sessions|session_result|race_control|drivers|meetings|starting_grid)$/,
  },
};

const CURRENT = new Date().getUTCFullYear();

/** Tempo de cache na borda, em segundos, conforme o tipo de dado. */
export function cacheSeconds(provider, path) {
  if (provider === 'openf1') return 30;
  const year = Number(path.match(/^\/(\d{4})/)?.[1] ?? CURRENT);
  if (year < CURRENT) return 24 * 3600; // temporada encerrada não muda
  if (/^\/\d{4}\.json$/.test(path)) return 3600; // calendário
  if (/^\/drivers\/[a-z_]+\/seasons/.test(path)) return 6 * 3600;
  return 30; // classificação e resultados da temporada atual
}

/** Valida e monta a URL do provedor. Devolve null se o caminho não for permitido. */
export function upstreamUrl(provider, path, search) {
  const p = PROVIDERS[provider];
  if (!p || !p.allow.test(path)) return null;
  const qs = new URLSearchParams(search);
  // só parâmetros de consulta simples (letras, números, _, <, >, =, :, -, .)
  for (const [k, v] of qs) if (!/^[a-z_<>]+$/i.test(k) || !/^[\w:.\-+<>=]*$/.test(v)) return null;
  const q = qs.toString();
  return `${p.base}${path}${q ? `?${q}` : ''}`;
}

/** Busca no provedor e responde no formato { status, headers, body }. */
export async function proxy(provider, path, search, fetchImpl = fetch) {
  const url = upstreamUrl(provider, path, search);
  if (!url) return { status: 400, headers: { 'cache-control': 'no-store' }, body: JSON.stringify({ error: 'Caminho não permitido.' }) };
  const ttl = cacheSeconds(provider, path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'GRID-F1 (+https://grid-f1.vercel.app)' } });
    const text = await res.text();
    if (provider === 'openf1' && res.status === 401) {
      return { status: 423, headers: { 'cache-control': 'public, s-maxage=60', 'content-type': 'application/json' }, body: JSON.stringify({ locked: true, error: 'A OpenF1 libera os dados só para assinantes enquanto uma sessão está ao vivo.' }) };
    }
    if (provider === 'openf1' && res.status === 404) {
      return { status: 200, headers: { 'cache-control': `public, s-maxage=${ttl}`, 'content-type': 'application/json' }, body: '[]' };
    }
    const ok = res.status >= 200 && res.status < 300;
    return {
      status: res.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': ok ? `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}` : 'no-store',
        'x-gridf1-source': provider,
        'x-gridf1-fetched-at': new Date().toISOString(),
      },
      body: text,
    };
  } catch (err) {
    return { status: 502, headers: { 'cache-control': 'no-store', 'content-type': 'application/json' }, body: JSON.stringify({ error: `Fonte ${provider} indisponível.`, detail: err instanceof Error ? err.message : String(err) }) };
  } finally {
    clearTimeout(timer);
  }
}

/** Interpreta /api/f1/<provedor>/<caminho>?<consulta> (ou ?p=<caminho>&provider=<provedor>). */
export function parseRequest(rawUrl) {
  const u = new URL(rawUrl, 'http://local');
  let provider = u.searchParams.get('provider');
  let path = u.searchParams.get('p');
  u.searchParams.delete('provider');
  u.searchParams.delete('p');
  if (!provider || !path) {
    const m = u.pathname.match(/^\/api\/f1\/(jolpica|openf1)(\/.*)$/);
    if (m) { provider = m[1]; path = m[2]; }
  }
  return { provider, path: path ?? '', search: u.searchParams.toString() };
}
