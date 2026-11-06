export const PROVIDERS: Record<string, { base: string; allow: RegExp }>;
export function cacheSeconds(provider: string, path: string): number;
export function upstreamUrl(provider: string, path: string, search: string): string | null;
export function proxy(provider: string | null, path: string, search: string, fetchImpl?: typeof fetch): Promise<{ status: number; headers: Record<string, string>; body: string }>;
export function parseRequest(rawUrl: string): { provider: string | null; path: string; search: string };
