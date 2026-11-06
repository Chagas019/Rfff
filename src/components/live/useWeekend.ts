import { races } from '../../data/calendar2026';
import { OPENF1_MEETING } from '../../data/openf1';
import { useAsync } from '../../hooks/useAsync';
import { LIVE_REFRESH_MS } from '../../services/f1Api';
import { fetchMeetingSessions, sessionTypeOf, type OF1Session } from '../../services/openf1';
import type { Race, SessionType } from '../../types';
import { currentWeekend, lastCompleted, sessionEnd, type SessionState } from '../../utils/season';
import { getNextRace } from '../../utils/race';

export interface WeekendSession {
  type: SessionType;
  start: Date;
  end: Date;
  state: SessionState;
  /** Chave da sessão na OpenF1 (quando já publicada). */
  key: number | null;
}

/** Etapa em foco: a do fim de semana atual ou, fora dele, a última disputada. */
export function weekendFocus(now: Date): { race: Race | null; mode: 'live' | 'recent'; next: Race | null } {
  const live = currentWeekend(races, now);
  if (live) return { race: live, mode: 'live', next: live };
  return { race: lastCompleted(races, now), mode: 'recent', next: getNextRace(races, now) };
}

/** Junta as sessões do calendário com as da OpenF1 (horários reais e chaves para buscar resultados). */
export function mergeSessions(race: Race, of1: OF1Session[], now: Date): WeekendSession[] {
  return race.sessions.map((s) => {
    const match = of1.find((o) => sessionTypeOf(o.session_name) === s.type && !o.is_cancelled);
    const start = match ? new Date(match.date_start) : new Date(s.start);
    const end = match ? new Date(match.date_end) : sessionEnd(s);
    const t = now.getTime();
    const state: SessionState = t >= end.getTime() ? 'done' : t >= start.getTime() ? 'live' : 'upcoming';
    return { type: s.type, start, end, state, key: match?.session_key ?? null };
  });
}

/** Sessões da etapa, atualizadas a cada poucos minutos. */
export function useWeekendSessions(race: Race | null, now: Date) {
  const meeting = race ? OPENF1_MEETING[race.id] : undefined;
  const { state, ...rest } = useAsync(
    (signal) => (meeting ? fetchMeetingSessions(meeting, signal) : Promise.resolve([] as OF1Session[])),
    [meeting],
    { refreshMs: LIVE_REFRESH_MS },
  );
  const of1 = state.status === 'success' ? state.data : [];
  const sessions = race ? mergeSessions(race, of1, now) : [];
  return { sessions, loading: state.status === 'loading', error: state.status === 'error' ? state.error : null, ...rest };
}
