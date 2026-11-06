import type { SessionType } from '../types';
import { getJsonCached } from './http';
import { API_BASE } from './f1Api';
import type { OF1Driver, OF1Result } from './openf1';

/**
 * Resultado de classificação, Sprint e corrida pela Jolpica-F1, no mesmo formato da OpenF1.
 * É a reserva para quando a OpenF1 está restrita (sessão ao vivo) ou fora do ar.
 * Treinos livres não existem na Jolpica.
 */
interface JDriver { driverId: string; code?: string; givenName: string; familyName: string; permanentNumber?: string }
interface JRow {
  number: string; position: string; laps?: string; status?: string; points?: string;
  Driver: JDriver; Constructor: { name: string };
  Time?: { millis?: string; time: string }; Q1?: string; Q2?: string; Q3?: string;
}
type Table = { MRData: { RaceTable: { Races: { Results?: JRow[]; QualifyingResults?: JRow[]; SprintResults?: JRow[] }[] } } };

export const JOLPICA_TYPES: SessionType[] = ['race', 'sprint', 'quali'];

/** "1:16.514" → 76.514 */
export function lapSeconds(t?: string): number | null {
  if (!t) return null;
  const [m, s] = t.includes(':') ? t.split(':') : ['0', t];
  const v = Number(m) * 60 + Number(s);
  return Number.isFinite(v) ? v : null;
}

export function toOpenF1(rows: JRow[], type: SessionType): { results: OF1Result[]; drivers: OF1Driver[] } {
  const leaderMs = Number(rows[0]?.Time?.millis ?? 0);
  const best = (r: JRow) => [lapSeconds(r.Q1), lapSeconds(r.Q2), lapSeconds(r.Q3)];
  const pole = rows[0] ? best(rows[0]) : [];
  const results: OF1Result[] = rows.map((r) => {
    const classified = /Finished|Lap/.test(r.status ?? 'Finished');
    if (type === 'quali') {
      const q = best(r);
      return {
        position: Number(r.position), driver_number: Number(r.number), number_of_laps: 0, dnf: false, dns: false, dsq: false,
        duration: q, gap_to_leader: q.map((v, i) => (v !== null && pole[i] !== null ? Math.max(0, v - (pole[i] as number)) : null)),
      };
    }
    const ms = Number(r.Time?.millis ?? 0);
    return {
      position: Number(r.position), driver_number: Number(r.number), number_of_laps: Number(r.laps ?? 0),
      dnf: !classified && !/Disqualified/.test(r.status ?? ''), dns: /Did not start/.test(r.status ?? ''), dsq: /Disqualified/.test(r.status ?? ''),
      duration: ms ? ms / 1000 : null,
      gap_to_leader: r.position === '1' ? 0 : ms && leaderMs ? (ms - leaderMs) / 1000 : r.status && /Lap/.test(r.status) ? r.status.replace('Lapped', '+1 volta') : null,
      points: r.points ? Number(r.points) : undefined,
    };
  });
  const drivers: OF1Driver[] = rows.map((r) => ({ driver_number: Number(r.number), name_acronym: r.Driver.code ?? '', full_name: `${r.Driver.givenName} ${r.Driver.familyName}`, team_name: r.Constructor.name, team_colour: null, headshot_url: null }));
  return { results, drivers };
}

export async function fetchJolpicaSession(season: number, round: number, type: SessionType, signal?: AbortSignal) {
  const path = type === 'quali' ? 'qualifying' : type === 'sprint' ? 'sprint' : 'results';
  const json = await getJsonCached<Table>(`${API_BASE}/${season}/${round}/${path}.json?limit=100`, { signal, ttl: 90_000, label: 'fonte de dados' });
  const race = json.MRData.RaceTable.Races[0];
  const rows = (type === 'quali' ? race?.QualifyingResults : type === 'sprint' ? race?.SprintResults : race?.Results) ?? [];
  return toOpenF1(rows, type);
}
