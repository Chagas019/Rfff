import type { RaceSession, SessionType } from '../types';
import { sessionEnd, sessionState } from './season';

export type SessionStatus = 'scheduled' | 'live' | 'finished' | 'results';

export const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: 'Agendado',
  live: 'Ao vivo',
  finished: 'Finalizado',
  results: 'Resultado disponível',
};

/**
 * Status de uma sessão: pelo relógio até ela terminar; depois, "Resultado disponível"
 * só quando a fonte oficial já publicou a classificação daquela sessão.
 */
export function sessionStatus(s: RaceSession, now: Date, published: ReadonlySet<SessionType>): SessionStatus {
  const st = sessionState(s, now);
  if (st === 'upcoming') return 'scheduled';
  if (st === 'live') return 'live';
  return published.has(s.type) ? 'results' : 'finished';
}

/** Deslocamento do fuso do circuito, lido do próprio horário do calendário ("…-03:00"). */
export function circuitOffsetMin(iso: string): number | null {
  const m = /([+-])(\d{2}):(\d{2})$/.exec(iso);
  if (!m) return /Z$/.test(iso) ? 0 : null;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

export function utcLabel(offsetMin: number): string {
  if (offsetMin === 0) return 'UTC';
  const sign = offsetMin < 0 ? '−' : '+';
  const a = Math.abs(offsetMin);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? `:${String(a % 60).padStart(2, '0')}` : ''}`;
}

const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const p2 = (n: number) => String(n).padStart(2, '0');

/** Dia e hora no fuso do circuito ("sáb 14:00"), sem depender do fuso do aparelho. */
export function circuitTime(iso: string): { day: string; time: string; offset: string } | null {
  const off = circuitOffsetMin(iso);
  if (off === null) return null;
  const d = new Date(new Date(iso).getTime() + off * 60_000);
  return { day: `${WEEK[d.getUTCDay()]} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`, time: `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`, offset: utcLabel(off) };
}

/** Próxima sessão (ou a que está em andamento) do fim de semana. */
export function nextInWeekend(sessions: RaceSession[], now: Date): RaceSession | null {
  return sessions.find((s) => now.getTime() < sessionEnd(s).getTime()) ?? null;
}
