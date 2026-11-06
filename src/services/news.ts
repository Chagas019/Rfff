import type { NewsItem, NewsPayload } from '../../api/_lib/rss';
import { getJsonCached } from './http';

export type { NewsItem, NewsPayload };

/**
 * Central de notícias: a função /api/news (Vercel) lê os feeds RSS públicos de
 * Motorsport.com Brasil, Grande Prêmio, Formula 1, BBC Sport e Autosport.
 * Cada notícia leva ao texto original no site da fonte.
 */
export const NEWS_REFRESH_MS = 5 * 60 * 1000;

export async function fetchNews(signal?: AbortSignal): Promise<NewsPayload> {
  const data = await getJsonCached<NewsPayload>('/api/news', { signal, ttl: 2 * 60_000, label: 'central de notícias' });
  if (!Array.isArray(data.items)) throw new Error('Resposta inesperada da central de notícias.');
  markVisit();
  return data;
}

const SEEN_KEY = 'gridf1:news:lastVisit';

/** Hora da visita anterior (para marcar o que é novo) e registro da visita atual. */
export function readLastVisit(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}
export function markVisit(at = Date.now()) {
  try {
    localStorage.setItem(SEEN_KEY, String(at));
  } catch {
    /* sem armazenamento: nada a fazer */
  }
}

/** Visita anterior, lida uma vez quando o site abre (antes de registrar a atual). */
export const PREVIOUS_VISIT = typeof window === 'undefined' ? 0 : readLastVisit();

/** Notícia publicada depois da visita anterior (ou nas últimas 3 h, na primeira visita). */
export function isNew(item: NewsItem, lastVisit: number, now = Date.now()): boolean {
  if (!item.publishedAt) return false;
  const t = new Date(item.publishedAt).getTime();
  return lastVisit ? t > lastVisit : now - t < 3 * 60 * 60 * 1000;
}
