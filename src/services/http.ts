/** Busca JSON com cache curto em sessionStorage, tempo limite e mensagens de erro amigáveis. */
export class ApiError extends Error {}

/**
 * Fila por servidor: limita pedidos simultâneos e espaça os disparos para respeitar
 * os limites das APIs gratuitas (a OpenF1 responde 429 quando recebe muitos de uma vez).
 */
const LIMITS: Record<string, { concurrency: number; gapMs: number }> = {
  'api.openf1.org': { concurrency: 2, gapMs: 350 },
  'api.jolpi.ca': { concurrency: 3, gapMs: 150 },
};
const queues = new Map<string, { active: number; last: number; waiting: (() => void)[] }>();

async function slot(host: string): Promise<() => void> {
  const lim = LIMITS[host];
  if (!lim) return () => {};
  const q = queues.get(host) ?? { active: 0, last: 0, waiting: [] };
  queues.set(host, q);
  while (q.active >= lim.concurrency) await new Promise<void>((r) => q.waiting.push(r));
  q.active++;
  const wait = q.last + lim.gapMs - Date.now();
  q.last = Math.max(Date.now(), q.last + lim.gapMs);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  return () => { q.active--; q.waiting.shift()?.(); };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Options {
  signal?: AbortSignal;
  /** Validade do cache em ms (0 = sem cache). */
  ttl?: number;
  timeoutMs?: number;
  /** Nome da fonte usado nas mensagens de erro. */
  label?: string;
}

export async function getJsonCached<T>(url: string, { signal, ttl = 90_000, timeoutMs = 12_000, label = 'fonte de dados' }: Options = {}): Promise<T> {
  const key = `gridf1:api:${url}`;
  if (ttl > 0) {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const { at, data } = JSON.parse(cached) as { at: number; data: T };
        if (Date.now() - at < ttl) return data;
      }
    } catch {
      /* sessionStorage indisponível */
    }
  }

  let host = '';
  try { host = new URL(url, 'http://local').host; } catch { /* URL relativa */ }
  let res: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const release = await slot(host);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (err) {
      if (signal?.aborted) throw err;
      throw new ApiError(`Não foi possível conectar à ${label}. Verifique sua conexão e tente novamente.`);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      release();
    }
    if (res.status !== 429) break;
    // limite de pedidos: espera e tenta de novo
    const retryAfter = Number(res.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 1200 * (attempt + 1));
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  }
  if (!res) throw new ApiError(`Não foi possível conectar à ${label}.`);
  if (!res.ok) throw new ApiError(res.status === 429 ? `A ${label} está recebendo muitos pedidos agora. Tentamos de novo em instantes.` : `A ${label} respondeu com erro ${res.status}.`);
  const data = (await res.json()) as T;
  if (ttl > 0) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
    } catch {
      /* cota cheia: segue sem cache */
    }
  }
  return data;
}
