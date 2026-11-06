import { drivers, formerDrivers } from '../data/drivers';
import { teams } from '../data/teams';
import type { Driver, DriverStanding, Race, RaceSession, SessionType, Team } from '../types';
import { normalize } from './format';
import { getBaseStatus, getRaceStart } from './race';

/** Duração típica de cada sessão (para saber quando ela termina, sem dados da OpenF1). */
export const SESSION_DURATION_MIN: Record<SessionType, number> = {
  fp1: 60, fp2: 60, fp3: 60, sprintQuali: 45, sprint: 45, quali: 60, race: 120,
};

export const sessionEnd = (s: RaceSession) => new Date(new Date(s.start).getTime() + SESSION_DURATION_MIN[s.type] * 60_000);

export type SessionState = 'done' | 'live' | 'upcoming';
export function sessionState(s: RaceSession, now: Date): SessionState {
  const t = now.getTime();
  if (t >= sessionEnd(s).getTime()) return 'done';
  if (t >= new Date(s.start).getTime()) return 'live';
  return 'upcoming';
}

const active = (races: Race[]) => races.filter((r) => !r.cancelled && r.round);

/** Etapa cujo fim de semana está acontecendo agora (do TL1 até o fim da corrida). */
export function currentWeekend(races: Race[], now: Date): Race | null {
  return active(races).find((r) => getBaseStatus(r, now) === 'live') ?? null;
}

/** Última etapa concluída. */
export function lastCompleted(races: Race[], now: Date): Race | null {
  const done = active(races).filter((r) => getBaseStatus(r, now) === 'completed');
  return done[done.length - 1] ?? null;
}

/** Próxima sessão de pista em todo o calendário (ou a que está em andamento). */
export function nextSession(races: Race[], now: Date): { race: Race; session: RaceSession; state: SessionState } | null {
  for (const race of active(races)) {
    for (const session of race.sessions) {
      const state = sessionState(session, now);
      if (state !== 'done') return { race, session, state };
    }
  }
  return null;
}

const allDrivers = [...drivers, ...formerDrivers];

/** Encontra o piloto local que corresponde a um registro da API (ID, sigla ou número). */
export function findDriver(ref: { driverId?: string; code?: string; number?: number | null; name?: string }): Driver | undefined {
  return (
    (ref.driverId ? allDrivers.find((d) => d.apiId === ref.driverId) : undefined) ??
    (ref.code ? allDrivers.find((d) => d.code === ref.code) : undefined) ??
    (ref.number ? drivers.find((d) => d.number === ref.number) : undefined) ??
    (ref.name ? allDrivers.find((d) => normalize(`${d.firstName} ${d.lastName}`) === normalize(ref.name!)) : undefined)
  );
}

/** Posição do piloto na classificação do campeonato. */
export function standingFor(driver: Driver, items: DriverStanding[]): DriverStanding | undefined {
  return items.find((s) => s.driverId === driver.apiId) ?? items.find((s) => s.code && s.code === driver.code) ?? items.find((s) => s.permanentNumber === driver.number);
}

/** Associa o construtor da API à equipe local (para usar as cores). */
export function teamFor(constructorId: string, name = ''): Team | undefined {
  const n = normalize(`${constructorId} ${name}`).replace(/_/g, ' ');
  return teams.find((t) => n.includes(normalize(t.name)) || n.includes(t.id.replace('-', ' ')) || (t.id === 'racing-bulls' && /\brb\b|racing bulls/.test(n)));
}

/** Converte a cor da OpenF1 ("4781D7") em CSS. */
export const hexColor = (c: string | null | undefined, fallback = '#71717a') => (c && /^[0-9a-f]{6}$/i.test(c) ? `#${c}` : fallback);

export const raceByRound = (races: Race[], round: number) => races.find((r) => r.round === round);
export const raceStartTime = (r: Race) => getRaceStart(r)?.getTime() ?? 0;
