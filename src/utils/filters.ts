import type { Race, RaceStatus } from '../types';
import { getRaceStatus } from './race';
import { normalize, raceMonth } from './format';

export interface CalendarFilters {
  query: string;
  country: string; // '' = todos
  month: number | null; // 0–11
  status: RaceStatus | 'all';
}

export const EMPTY_FILTERS: CalendarFilters = { query: '', country: '', month: null, status: 'all' };

export function filterRaces(races: Race[], f: CalendarFilters, now: Date = new Date()): Race[] {
  const q = normalize(f.query);
  return races.filter((r) => {
    if (q && ![r.name, r.officialName, r.city, r.country].some((t) => normalize(t).includes(q))) return false;
    if (f.country && r.country !== f.country) return false;
    if (f.month !== null && raceMonth(r.weekendEnd) !== f.month) return false;
    if (f.status !== 'all') {
      const st = getRaceStatus(r, races, now);
      // "Em breve" inclui a próxima etapa.
      if (f.status === 'upcoming' ? !(st === 'upcoming' || st === 'next') : st !== f.status) return false;
    }
    return true;
  });
}
