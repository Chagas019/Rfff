import { readStorage, writeStorage } from './storage';

/**
 * FOTOS REAIS DOS CARROS — Wikimedia Commons
 * ----------------------------------------------------------------------------
 * As fotos são buscadas no navegador do visitante pela API pública do
 * Wikimedia Commons (sem chave, com CORS liberado via `origin=*`). Só entram
 * fotos com licença livre, e o autor e a licença são exibidos em cada imagem.
 *
 * Para fixar uma foto específica, preencha PINNED_PHOTOS com o nome exato do
 * arquivo no Commons (ex.: 'File:McLaren MCL40 ... .jpg').
 */
export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export interface CarPhoto {
  src: string;
  width: number;
  height: number;
  title: string;
  pageUrl: string;
  author: string;
  license: string;
  licenseUrl?: string;
}

export interface PhotoQuery {
  /** Nomes de arquivo fixados manualmente (têm prioridade). */
  pinned?: string[];
  /** Consultas do Commons, testadas em ordem. Aceitam a sintaxe CirrusSearch. */
  searches: string[];
  /** O título do arquivo precisa conter pelo menos um destes termos. */
  mustInclude: string[];
}

const PINNED_PHOTOS: Record<string, string[]> = {
  // mclaren: ['File:Exemplo.jpg'],
};

const TEAM_TERMS: Record<string, { car: string[]; team: string[] }> = {
  mclaren: { car: ['MCL40'], team: ['McLaren'] },
  ferrari: { car: ['SF-26', 'SF26'], team: ['Ferrari'] },
  'red-bull': { car: ['RB22'], team: ['Red Bull Racing', 'Red Bull'] },
  mercedes: { car: ['W17'], team: ['Mercedes'] },
  'aston-martin': { car: ['AMR26'], team: ['Aston Martin'] },
  alpine: { car: ['A526'], team: ['Alpine'] },
  williams: { car: ['FW48'], team: ['Williams'] },
  'racing-bulls': { car: ['VCARB 03', 'VCARB03'], team: ['Racing Bulls', 'VCARB'] },
  haas: { car: ['VF-26', 'VF26'], team: ['Haas'] },
  audi: { car: ['R26'], team: ['Audi'] },
  cadillac: { car: ['MAC-26', 'MAC-01'], team: ['Cadillac'] },
};

/** Monta as consultas para o carro de uma equipe: categoria do chassi → título → equipe + 2026. */
export function teamPhotoQuery(teamId: string): PhotoQuery {
  const t = TEAM_TERMS[teamId];
  if (!t) return { searches: [], mustInclude: [] };
  const main = t.team[0];
  return {
    pinned: PINNED_PHOTOS[teamId],
    searches: [
      ...t.car.map((c) => `incategory:"${main} ${c}"`),
      ...t.car.map((c) => `intitle:"${c}" "${main}"`),
      `intitle:"${main}" intitle:"2026" Formula`,
    ],
    mustInclude: [...t.car, ...t.team.map((x) => `${x}`)],
  };
}

/** Foto genérica de F1 2026 para o hero (prioriza o carro do campeão). */
export const HERO_QUERY: PhotoQuery = {
  pinned: PINNED_PHOTOS.hero,
  searches: [
    'incategory:"McLaren MCL40"',
    'intitle:"MCL40"',
    'intitle:"2026" intitle:"Grand Prix" "Formula 1"',
    'intitle:"2026" "Formula One" car',
  ],
  mustInclude: ['2026', 'MCL40'],
};

const CACHE_KEY = 'gridf1:carphotos:v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface ImageInfo {
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  url: string;
  width: number;
  height: number;
  mime: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string } | undefined>;
}
interface ApiPage { title: string; index?: number; imageinfo?: ImageInfo[] }
interface ApiResponse { query?: { pages?: Record<string, ApiPage> | ApiPage[] } }

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

const FREE_LICENSE = /^(cc[ -]|cc0|public domain|pd|gfdl|attribution)/i;

/** Escolhe a melhor imagem: foto livre, horizontal e cujo título bate com os termos. */
export function pickPhoto(pages: ApiPage[], mustInclude: string[]): CarPhoto | null {
  const terms = mustInclude.map((t) => t.toLowerCase());
  const candidates = pages
    .filter((p) => p.imageinfo?.[0])
    .map((p) => ({ page: p, info: p.imageinfo![0] }))
    .filter(({ info }) => /^image\/(jpeg|png|webp)$/.test(info.mime))
    .filter(({ info }) => info.width >= 800 && info.width >= info.height * 1.15)
    .filter(({ page }) => !terms.length || terms.some((t) => page.title.toLowerCase().includes(t)))
    .filter(({ info }) => {
      const lic = stripHtml(info.extmetadata?.LicenseShortName?.value ?? '');
      return FREE_LICENSE.test(lic);
    })
    .sort((a, b) => (a.page.index ?? 0) - (b.page.index ?? 0));
  const best = candidates[0];
  if (!best) return null;
  const meta = best.info.extmetadata ?? {};
  return {
    src: best.info.thumburl ?? best.info.url,
    width: best.info.thumbwidth ?? best.info.width,
    height: best.info.thumbheight ?? best.info.height,
    title: best.page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
    pageUrl: best.info.descriptionurl,
    author: stripHtml(meta.Artist?.value ?? '') || 'Autor desconhecido',
    license: stripHtml(meta.LicenseShortName?.value ?? ''),
    licenseUrl: meta.LicenseUrl?.value,
  };
}

async function callApi(params: Record<string, string>, signal?: AbortSignal): Promise<ApiPage[]> {
  const qs = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
    ...params,
  });
  const res = await fetch(`${COMMONS_API}?${qs}`, { signal });
  if (!res.ok) throw new Error(`Commons respondeu ${res.status}`);
  const json = (await res.json()) as ApiResponse;
  const pages = json.query?.pages ?? [];
  return Array.isArray(pages) ? pages : Object.values(pages);
}

export async function findPhoto(key: string, q: PhotoQuery, signal?: AbortSignal): Promise<CarPhoto | null> {
  const cache = readStorage<Record<string, { at: number; photo: CarPhoto | null }>>(CACHE_KEY, {});
  const hit = cache[key];
  // Sem foto encontrada: tenta de novo depois de 1 h.
  if (hit && Date.now() - hit.at < (hit.photo ? CACHE_TTL : 60 * 60 * 1000)) return hit.photo;

  let photo: CarPhoto | null = null;
  if (q.pinned?.length) {
    photo = pickPhoto(await callApi({ titles: q.pinned.join('|') }, signal), []);
  }
  for (const search of q.searches) {
    if (photo) break;
    const pages = await callApi({ generator: 'search', gsrsearch: `${search} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '20' }, signal);
    photo = pickPhoto(pages, q.mustInclude);
  }
  writeStorage(CACHE_KEY, { ...readStorage(CACHE_KEY, {}), [key]: { at: Date.now(), photo } });
  return photo;
}

export const commonsSearchUrl = (term: string) =>
  `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(term)}&title=Special:MediaSearch&type=image`;
