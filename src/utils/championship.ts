import type { Race } from '../types';

/**
 * MATEMÁTICA DO CAMPEONATO (regulamento esportivo da F1 em vigor)
 * Corrida: 25-18-15-12-10-8-6-4-2-1 (sem ponto extra de volta mais rápida desde 2025).
 * Sprint: 8-7-6-5-4-3-2-1.
 * Por evento, um piloto soma no máximo 25 (corrida) e 8 (Sprint); uma equipe, com 1º e 2º,
 * soma no máximo 25+18 = 43 (corrida) e 8+7 = 15 (Sprint).
 *
 * Os pontos "em jogo" são calculados a partir dos RESULTADOS JÁ PUBLICADOS pela fonte oficial,
 * nunca pelo relógio: uma corrida que acabou mas ainda não tem resultado publicado continua
 * contando como pontos em disputa. Assim o título nunca aparece decidido antes da hora.
 */
export const MAX_POINTS = { driver: { race: 25, sprint: 8 }, team: { race: 43, sprint: 15 } } as const;

export interface Entry { id: string; name: string; points: number }

export interface ChampionshipState {
  racesLeft: number;
  sprintsLeft: number;
  /** Máximo que um competidor ainda pode somar. */
  maxLeft: number;
  leader: Entry | null;
  /** Vantagem do líder sobre o segundo colocado. */
  gap: number;
  /** Quem ainda pode alcançar (ou empatar com) o líder — o líder incluso. */
  contenders: (Entry & { behind: number; needs: number })[];
  /** Verdadeiro só quando ninguém mais consegue nem empatar com o líder. */
  decided: boolean;
}

/** Corridas e Sprints que ainda não têm resultado oficial publicado. */
export function eventsLeft(races: Race[], publishedRaces: Set<number>, publishedSprints: Set<number>) {
  const active = races.filter((r) => !r.cancelled && r.round);
  const racesLeft = active.filter((r) => !publishedRaces.has(r.round!)).length;
  const sprintsLeft = active.filter((r) => r.sprint && !publishedSprints.has(r.round!)).length;
  return { racesLeft, sprintsLeft };
}

/**
 * Situação de um campeonato (pilotos ou construtores) a partir da classificação ordenada.
 * Empate em pontos não conta como decidido (o desempate por vitórias ainda pode mudar).
 */
export function championshipState(standings: Entry[], left: { racesLeft: number; sprintsLeft: number }, kind: 'driver' | 'team'): ChampionshipState {
  const m = MAX_POINTS[kind];
  const maxLeft = left.racesLeft * m.race + left.sprintsLeft * m.sprint;
  const sorted = [...standings].sort((a, b) => b.points - a.points);
  const leader = sorted[0] ?? null;
  if (!leader) return { ...left, maxLeft, leader: null, gap: 0, contenders: [], decided: false };
  const contenders = sorted
    .filter((e) => e.points + maxLeft >= leader.points)
    .map((e) => ({ ...e, behind: leader.points - e.points, needs: Math.max(0, leader.points - e.points) }));
  return {
    ...left,
    maxLeft,
    leader,
    gap: leader.points - (sorted[1]?.points ?? 0),
    contenders,
    // decidido: só o líder ainda pode terminar na frente (ou empatado) — e ainda há algo publicado
    decided: contenders.length === 1 && sorted.length > 1,
  };
}
