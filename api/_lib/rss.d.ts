export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string | null;
  publishedAt: string | null;
  categories: string[];
  source: string;
  sourceName: string;
  lang: 'pt' | 'en';
}
export interface NewsSource { id: string; name: string; lang: 'pt' | 'en'; home: string; ok: boolean; count: number; error?: string }
export interface NewsPayload { updatedAt: string; sources: NewsSource[]; items: NewsItem[] }
export const NEWS_SOURCES: { id: string; name: string; url: string; lang: 'pt' | 'en'; home: string }[];
export function decodeEntities(s: string): string;
export function cleanText(s: string): string;
export function cleanUrl(raw: string): string;
export function parseRss(xml: string, source: { id: string; name: string; lang: 'pt' | 'en' }): NewsItem[];
export function buildNews(fetchImpl?: typeof fetch, now?: number): Promise<NewsPayload>;
