import type { ConstructorStanding, DriverStanding, RaceResultRow, StandingsResult } from '../types';

/**
 * Cliente da API pública Jolpica-F1 (sucessora da Ergast).
 * https://github.com/jolpica/jolpica-f1 — gratuita, sem chave, com CORS liberado.
 * A base pode ser trocada por VITE_F1_API_BASE (ex.: um proxy próprio).
 * Nenhuma chave secreta é usada no frontend.
 */
export const API_BASE: string = (import.meta.env?.VITE_F1_API_BASE as string | undefined) ?? 'https://api.jolpi.ca/ergast/f1';
export const API_SOURCE = { label: 'Jolpica-F1 API (dados da FIA/F1)', url: 'https://github.com/jolpica/jolpica-f1' };

/** Cache curto: só evita pedidos repetidos entre componentes; a atualização automática busca dados novos. */
const CACHE_TTL = 90 * 1000;

/** Intervalo da atualização automática dos dados ao vivo. */
export const LIVE_REFRESH_MS = 3 * 60 * 1000;

export class ApiError extends Error {}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE}${path}`;
  const key = `gridf1:api:${url}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { at, data } = JSON.parse(cached) as { at: number; data: T };
      if (Date.now() - at < CACHE_TTL) return data;
    }
  } catch {
    /* sessionStorage indisponível */
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  signal?.addEventListener('abort', () => controller.abort());
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('Não foi possível conectar à fonte de dados. Verifique sua conexão e tente novamente.');
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new ApiError(`A fonte de dados respondeu com erro ${res.status}.`);
  const data = (await res.json()) as T;
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignora cota cheia */
  }
  return data;
}

/* ---------- Tipos mínimos da resposta Ergast/Jolpica ---------- */
interface ErgastDriver { driverId: string; code?: string; givenName: string; familyName: string; nationality: string; permanentNumber?: string }
interface ErgastConstructor { constructorId: string; name: string; nationality: string }
interface ErgastDriverStanding { position?: string; positionText: string; points: string; wins: string; Driver: ErgastDriver; Constructors: ErgastConstructor[] }
interface ErgastConstructorStanding { position?: string; positionText: string; points: string; wins: string; Constructor: ErgastConstructor }
interface StandingsTable<T> { MRData: { StandingsTable: { season: string; round?: string; StandingsLists: (T & { season: string; round: string })[] } } }
interface ErgastResult { position: string; points: string; grid: string; laps: string; status: string; Driver: ErgastDriver; Constructor: ErgastConstructor; Time?: { time: string } }
interface RaceTable { MRData: { RaceTable: { Races: { round: string; raceName: string; Results: ErgastResult[] }[] } } }

export function parseDriverStandings(json: StandingsTable<{ DriverStandings: ErgastDriverStanding[] }>): StandingsResult<DriverStanding> {
  const list = json.MRData.StandingsTable.StandingsLists[0];
  if (!list) return { season: json.MRData.StandingsTable.season, round: '0', items: [] };
  return {
    season: list.season,
    round: list.round,
    items: list.DriverStandings.map((s, i) => ({
      position: Number(s.position ?? i + 1),
      points: Number(s.points),
      wins: Number(s.wins),
      driverId: s.Driver.driverId,
      code: s.Driver.code ?? '',
      givenName: s.Driver.givenName,
      familyName: s.Driver.familyName,
      nationality: s.Driver.nationality,
      constructorId: s.Constructors[s.Constructors.length - 1]?.constructorId ?? '',
      constructorName: s.Constructors[s.Constructors.length - 1]?.name ?? '',
    })),
  };
}

export function parseConstructorStandings(json: StandingsTable<{ ConstructorStandings: ErgastConstructorStanding[] }>): StandingsResult<ConstructorStanding> {
  const list = json.MRData.StandingsTable.StandingsLists[0];
  if (!list) return { season: json.MRData.StandingsTable.season, round: '0', items: [] };
  return {
    season: list.season,
    round: list.round,
    items: list.ConstructorStandings.map((s, i) => ({
      position: Number(s.position ?? i + 1),
      points: Number(s.points),
      wins: Number(s.wins),
      constructorId: s.Constructor.constructorId,
      name: s.Constructor.name,
      nationality: s.Constructor.nationality,
    })),
  };
}

/** Conta pódios por piloto a partir das listas de 1º, 2º e 3º lugares. */
export function countPodiums(tables: RaceTable[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tables) {
    for (const race of t.MRData.RaceTable.Races) {
      for (const r of race.Results) out[r.Driver.driverId] = (out[r.Driver.driverId] ?? 0) + 1;
    }
  }
  return out;
}

export async function fetchDriverStandings(season: number, signal?: AbortSignal): Promise<StandingsResult<DriverStanding>> {
  const json = await getJson<StandingsTable<{ DriverStandings: ErgastDriverStanding[] }>>(`/${season}/driverstandings.json`, signal);
  const standings = parseDriverStandings(json);
  try {
    const podiumTables = await Promise.all(
      [1, 2, 3].map((p) => getJson<RaceTable>(`/${season}/results/${p}.json?limit=100`, signal)),
    );
    const podiums = countPodiums(podiumTables);
    standings.items = standings.items.map((d) => ({ ...d, podiums: podiums[d.driverId] ?? 0 }));
  } catch {
    // Pódios são complementares: se falhar, a tabela continua sem essa coluna.
  }
  return standings;
}

export async function fetchConstructorStandings(season: number, signal?: AbortSignal): Promise<StandingsResult<ConstructorStanding>> {
  const json = await getJson<StandingsTable<{ ConstructorStandings: ErgastConstructorStanding[] }>>(`/${season}/constructorstandings.json`, signal);
  return parseConstructorStandings(json);
}

export async function fetchRaceResults(season: number, round: number, signal?: AbortSignal): Promise<RaceResultRow[]> {
  const json = await getJson<RaceTable>(`/${season}/${round}/results.json`, signal);
  const race = json.MRData.RaceTable.Races[0];
  if (!race) return [];
  return race.Results.map((r) => ({
    position: Number(r.position),
    driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
    constructor: r.Constructor.name,
    grid: Number(r.grid),
    laps: Number(r.laps),
    status: r.status,
    points: Number(r.points),
    time: r.Time?.time,
  }));
}
