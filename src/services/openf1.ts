import type { SessionType } from '../types';
import { getJsonCached } from './http';

/**
 * Cliente da OpenF1 (https://openf1.org): dados oficiais de cronometragem da F1,
 * gratuitos e com CORS liberado. Sessões, resultados e mensagens da direção de prova
 * ficam disponíveis assim que a OpenF1 os publica (normalmente logo após cada sessão).
 */
/** Via camada de dados do site (api/f1.js), que detecta a restrição durante sessões ao vivo. */
export const OPENF1_BASE = '/api/f1/openf1';
export const OPENF1_SOURCE = { label: 'OpenF1 (cronometragem oficial da F1)', url: 'https://openf1.org' };

const get = <T,>(path: string, signal?: AbortSignal, ttl = 60_000) => getJsonCached<T>(`${OPENF1_BASE}${path}`, { signal, ttl, label: 'OpenF1' });

/**
 * Durante sessões ao vivo a OpenF1 restringe TODO o acesso gratuito (inclusive a sessões
 * passadas) a assinantes, respondendo 401. Nesses momentos o site usa a Jolpica-F1.
 */
export class OpenF1LockedError extends Error {
  constructor() { super('A OpenF1 libera os dados só para assinantes enquanto uma sessão está ao vivo.'); }
}

/** A OpenF1 responde 404 com {detail} quando ainda não há dados — tratamos como lista vazia. */
async function list<T>(path: string, signal?: AbortSignal, ttl?: number): Promise<T[]> {
  try {
    const data = await get<T[] | { detail?: string }>(path, signal, ttl);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err instanceof Error && /erro 404/.test(err.message)) return [];
    if (err instanceof Error && (/erro 401/.test(err.message) || (err as { status?: number }).status === 423)) throw new OpenF1LockedError();
    throw err;
  }
}

export interface OF1Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  is_cancelled?: boolean;
}

export interface OF1Result {
  position: number | null;
  driver_number: number;
  number_of_laps: number;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  /** Corrida: tempo total (s). Treino: melhor volta (s). Classificação: [Q1, Q2, Q3]. */
  duration: number | (number | null)[] | null;
  gap_to_leader: number | string | (number | string | null)[] | null;
  points?: number;
}

export interface OF1RaceControl {
  date: string;
  lap_number: number | null;
  category: string;
  flag: string | null;
  scope: string | null;
  driver_number: number | null;
  message: string;
}

export interface OF1Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string | null;
  headshot_url: string | null;
}

const NAME_TO_TYPE: Record<string, SessionType> = {
  'Practice 1': 'fp1', 'Practice 2': 'fp2', 'Practice 3': 'fp3',
  'Sprint Qualifying': 'sprintQuali', 'Sprint Shootout': 'sprintQuali', Sprint: 'sprint', Qualifying: 'quali', Race: 'race',
};
export const sessionTypeOf = (name: string): SessionType | null => NAME_TO_TYPE[name] ?? null;

export const fetchMeetingSessions = (meetingKey: number, signal?: AbortSignal) =>
  list<OF1Session>(`/sessions?meeting_key=${meetingKey}`, signal, 10 * 60_000);

export const fetchSessionResult = (sessionKey: number, signal?: AbortSignal) =>
  list<OF1Result>(`/session_result?session_key=${sessionKey}`, signal);

export const fetchRaceControl = (sessionKey: number, signal?: AbortSignal) =>
  list<OF1RaceControl>(`/race_control?session_key=${sessionKey}`, signal);

/** Pilotos inscritos em um GP (nomes e cores de quem não está nos dados locais, como reservas). */
export const fetchMeetingDrivers = (meetingKey: number, signal?: AbortSignal) =>
  list<OF1Driver>(`/drivers?meeting_key=${meetingKey}`, signal, 30 * 60_000);

/** Formata segundos como 1:17.341 (ou 2:20:28.772 em corridas). */
export function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = (sec % 60).toFixed(3).padStart(6, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Melhor tempo e diferença de um resultado, em qualquer tipo de sessão. */
export function resultTiming(r: OF1Result, type: SessionType): { time: string | null; gap: string | null } {
  const pickLast = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? ([...v].reverse().find((x) => x !== null && x !== undefined) ?? null) : v);
  const dur = pickLast(r.duration);
  const gap = pickLast(r.gap_to_leader);
  const time = typeof dur === 'number' ? formatSeconds(dur) : null;
  let gapText: string | null = null;
  if (typeof gap === 'string') gapText = gap;
  else if (typeof gap === 'number' && gap > 0) gapText = `+${gap.toFixed(3)}`;
  if (type === 'race' || type === 'sprint') {
    if (r.dsq) return { time: null, gap: 'DSQ' };
    if (r.dns) return { time: null, gap: 'Não largou' };
    if (r.dnf) return { time: null, gap: 'Abandono' };
  }
  return { time, gap: gapText };
}
