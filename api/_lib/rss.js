/**
 * Leitor de RSS sem dependências, usado pela função /api/news (Vercel) e pelo
 * servidor de desenvolvimento do Vite. Só extrai o que o próprio feed publica:
 * título, resumo, link, data, imagem e categorias — nada é inventado.
 */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const stripCdata = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

/** Texto limpo: sem CDATA, sem HTML, entidades decodificadas e espaços normalizados. */
export function cleanText(s) {
  return decodeEntities(stripCdata(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function attr(xml, tagName, attrName) {
  const m = xml.match(new RegExp(`<${tagName}\\b[^>]*\\b${attrName}=["']([^"']+)["']`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

/** Remove parâmetros de rastreamento (utm_*, at_*) do link. */
export function cleanUrl(raw) {
  try {
    const u = new URL(decodeEntities(raw.trim()));
    [...u.searchParams.keys()].forEach((k) => { if (/^(utm_|at_)/.test(k)) u.searchParams.delete(k); });
    return u.toString();
  } catch {
    return raw.trim();
  }
}

function findImage(item) {
  const enclosure = item.match(/<enclosure\b[^>]*>/i)?.[0] ?? '';
  if (enclosure && /image\//i.test(enclosure)) return attr(enclosure, 'enclosure', 'url');
  const media = attr(item, 'media:content', 'url') || attr(item, 'media:thumbnail', 'url');
  if (media) return media;
  const html = stripCdata(tag(item, 'content:encoded') || tag(item, 'description'));
  const img = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return img ? decodeEntities(img[1]) : '';
}

function toIso(s) {
  if (!s) return null;
  const d = new Date(cleanText(s));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Converte um feed RSS 2.0 em itens normalizados. */
export function parseRss(xml, source) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item) => {
    const url = cleanUrl(cleanText(tag(item, 'link')) || cleanText(tag(item, 'guid')));
    let summary = cleanText(tag(item, 'description')).replace(/\s*(\.\.\.|…)\s*(Keep reading|Leia mais|more)?\s*$/i, '…');
    if (summary.length > 260) summary = `${summary.slice(0, 257).replace(/\s+\S*$/, '')}…`;
    const image = findImage(item);
    return {
      id: `${source.id}:${url}`,
      title: cleanText(tag(item, 'title')),
      summary,
      url,
      image: image && /^https:\/\//.test(image) ? image : null,
      publishedAt: toIso(tag(item, 'pubDate') || tag(item, 'dc:date')),
      categories: (item.match(/<category\b[^>]*>[\s\S]*?<\/category>/gi) ?? []).map(cleanText).filter(Boolean).slice(0, 5),
      source: source.id,
      sourceName: source.name,
      lang: source.lang,
    };
  }).filter((i) => i.title && /^https?:\/\//.test(i.url));
}

/** Fontes jornalísticas usadas na central de notícias. */
export const NEWS_SOURCES = [
  { id: 'motorsport-br', name: 'Motorsport.com Brasil', url: 'https://motorsport.uol.com.br/rss/f1/news/', lang: 'pt', home: 'https://motorsport.uol.com.br/f1/' },
  { id: 'grandepremio', name: 'Grande Prêmio', url: 'https://grandepremio.com/br/f1/feed/', lang: 'pt', home: 'https://grandepremio.com/br/f1/' },
  { id: 'formula1', name: 'Formula 1', url: 'https://www.formula1.com/en/latest/all.xml', lang: 'en', home: 'https://www.formula1.com/en/latest' },
  { id: 'bbc', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml', lang: 'en', home: 'https://www.bbc.com/sport/formula1' },
  { id: 'autosport', name: 'Autosport', url: 'https://www.autosport.com/rss/f1/news/', lang: 'en', home: 'https://www.autosport.com/f1/' },
];

const PER_SOURCE = 15;
const MAX_AGE_MS = 10 * 24 * 60 * 60 * 1000;

/** Busca todas as fontes em paralelo; uma fonte fora do ar não derruba as outras. */
export async function buildNews(fetchImpl = fetch, now = Date.now()) {
  const results = await Promise.all(NEWS_SOURCES.map(async (source) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetchImpl(source.url, { signal: controller.signal, headers: { 'user-agent': 'GRID-F1 news reader (+https://grid-f1.vercel.app)', accept: 'application/rss+xml, application/xml, text/xml' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseRss(await res.text(), source)
        .filter((i) => !i.publishedAt || now - new Date(i.publishedAt).getTime() < MAX_AGE_MS)
        .slice(0, PER_SOURCE);
      return { source: { id: source.id, name: source.name, lang: source.lang, home: source.home, ok: true, count: items.length }, items };
    } catch (err) {
      return { source: { id: source.id, name: source.name, lang: source.lang, home: source.home, ok: false, count: 0, error: err instanceof Error ? err.message : 'erro' }, items: [] };
    } finally {
      clearTimeout(timer);
    }
  }));
  const seen = new Set();
  const items = results.flatMap((r) => r.items).filter((i) => {
    const key = i.url.replace(/[?#].*$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // com data primeiro (mais recentes no topo); itens sem data publicada vão para o fim
  items.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  return { updatedAt: new Date(now).toISOString(), sources: results.map((r) => r.source), items };
}
