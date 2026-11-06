import { races } from '../data/calendar2026';
import { sessionEnd } from '../utils/season';

/**
 * Ritmo de atualização dos dados ao vivo.
 * Durante uma sessão (e até 1 h depois, quando saem resultados e decisões dos comissários)
 * os blocos ao vivo buscam a cada 45 s; fora disso, a cada 3 min. O cache de 30 s da
 * camada /api/f1 garante que milhares de visitantes não multipliquem os pedidos às APIs.
 */
export const LIVE_FAST_MS = 45_000;
export const LIVE_SLOW_MS = 3 * 60 * 1000;

export function sessionHot(now = new Date()): boolean {
  const t = now.getTime();
  return races.some((r) => !r.cancelled && r.sessions.some((s) => t >= new Date(s.start).getTime() && t <= sessionEnd(s).getTime() + 60 * 60 * 1000));
}

export const liveIntervalMs = (now = new Date()) => (sessionHot(now) ? LIVE_FAST_MS : LIVE_SLOW_MS);
