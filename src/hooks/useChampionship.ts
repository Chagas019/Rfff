import { SEASON, races } from '../data/calendar2026';
import { LIVE_REFRESH_MS, fetchConstructorStandings, fetchDriverStandings, fetchPublishedRounds } from '../services/f1Api';
import { championshipState, eventsLeft, type ChampionshipState } from '../utils/championship';
import { useAsync } from './useAsync';

export interface Championship { drivers: ChampionshipState; teams: ChampionshipState; round: string }

/** Situação matemática dos dois campeonatos, a partir dos resultados oficiais publicados. */
export function useChampionship() {
  return useAsync<Championship>(async (signal) => {
    const [d, c, pub] = await Promise.all([fetchDriverStandings(SEASON, signal), fetchConstructorStandings(SEASON, signal), fetchPublishedRounds(SEASON, signal)]);
    const left = eventsLeft(races, pub.races, pub.sprints);
    return {
      round: d.round,
      drivers: championshipState(d.items.map((s) => ({ id: s.driverId, name: `${s.givenName} ${s.familyName}`, points: s.points })), left, 'driver'),
      teams: championshipState(c.items.map((s) => ({ id: s.constructorId, name: s.name, points: s.points })), left, 'team'),
    };
  }, [], { refreshMs: LIVE_REFRESH_MS });
}
