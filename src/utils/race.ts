import type { Race, RaceStatus, SessionType } from '../types';

/** Duração estimada após o início da corrida até considerá-la encerrada. */
export const RACE_DURATION_MS = 2.5 * 60 * 60 * 1000;

export const SESSION_LABELS: Record<SessionType, string> = {
  fp1: 'Treino Livre 1',
  fp2: 'Treino Livre 2',
  fp3: 'Treino Livre 3',
  sprintQuali: 'Classificação Sprint',
  sprint: 'Sprint',
  quali: 'Classificação',
  race: 'Corrida',
};

export const STATUS_LABELS: Record<RaceStatus, string> = {
  upcoming: 'Em breve',
  next: 'Próxima',
  live: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export function getRaceStart(race: Race): Date | null {
  const s = race.sessions.find((x) => x.type === 'race');
  return s ? new Date(s.start) : null;
}

export function getWeekendStart(race: Race): Date | null {
  if (!race.sessions.length) return null;
  return new Date(Math.min(...race.sessions.map((s) => new Date(s.start).getTime())));
}

/** Status de uma etapa isoladamente (sem considerar "próxima"). */
export function getBaseStatus(race: Race, now: Date = new Date()): Exclude<RaceStatus, 'next'> {
  if (race.cancelled) return 'cancelled';
  const raceStart = getRaceStart(race);
  const weekendStart = getWeekendStart(race);
  if (!raceStart || !weekendStart) return 'upcoming';
  const t = now.getTime();
  if (t >= raceStart.getTime() + RACE_DURATION_MS) return 'completed';
  if (t >= weekendStart.getTime()) return 'live';
  return 'upcoming';
}

/** A próxima etapa: a que está em andamento ou a primeira futura. */
export function getNextRace(races: Race[], now: Date = new Date()): Race | null {
  const active = races
    .filter((r) => !r.cancelled)
    .filter((r) => {
      const st = getBaseStatus(r, now);
      return st === 'live' || st === 'upcoming';
    })
    .sort((a, b) => (getRaceStart(a)?.getTime() ?? 0) - (getRaceStart(b)?.getTime() ?? 0));
  return active[0] ?? null;
}

export function getRaceStatus(race: Race, races: Race[], now: Date = new Date()): RaceStatus {
  const base = getBaseStatus(race, now);
  if (base === 'upcoming' && getNextRace(races, now)?.id === race.id) return 'next';
  return base;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  finished: boolean;
}

/** Diferença entre agora e o alvo, nunca negativa. */
export function getCountdown(target: Date, now: Date = new Date()): Countdown {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalMs,
    finished: totalMs === 0,
  };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
