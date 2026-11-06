/** Busca JSON com cache curto em sessionStorage, tempo limite e mensagens de erro amigáveis. */
export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

/**
 * Camada de dados do site (/api/f1/...) → endereço direto do provedor, usado como reserva
 * quando a camada não responde (ex.: servidor local sem a função).
 */
const DIRECT: Record<string, string> = {
  '/api/f1/jolpica': 'https://api.jolpi.ca/ergast/f1',
  '/api/f1/openf1': 'https://api.openf1.org/v1',
};
export function directUrl(url: string): string | null {
  for (const [prefix, base] of Object.entries(DIRECT)) if (url.startsWith(prefix)) return base + url.slice(prefix.length);
  return null;
}

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
  // a fila respeita o limite do provedor final, mesmo passando pela camada do site
  try { host = new URL(directUrl(url) ?? url, 'http://local').host; } catch { /* URL inválida */ }
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
      const direct = directUrl(url);
      if (direct) return getJsonCached<T>(direct, { signal, ttl, timeoutMs, label });
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
  // camada própria fora do ar (rede, 404 de servidor sem a função ou erro 5xx): vai direto ao provedor
  const direct = directUrl(url);
  if (direct && (res.status === 404 || res.status >= 500) && res.status !== 423) {
    return getJsonCached<T>(direct, { signal, ttl, timeoutMs, label });
  }
  if (!res.ok) throw new ApiError(res.status === 429 ? `A ${label} está recebendo muitos pedidos agora. Tentamos de novo em instantes.` : res.status === 423 ? `A ${label} está restrita durante a sessão ao vivo.` : `A ${label} respondeu com erro ${res.status}.`, res.status);
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
