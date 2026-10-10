export type SessionType = 'fp1' | 'fp2' | 'fp3' | 'sprintQuali' | 'sprint' | 'quali' | 'race';

export interface RaceSession {
  type: SessionType;
  /** ISO 8601 com fuso horário (ex.: 2026-10-11T20:00:00+08:00). */
  start: string;
}

export type RaceStatus = 'upcoming' | 'next' | 'live' | 'completed' | 'cancelled';

export interface Race {
  id: string;
  /** Número da rodada no calendário revisado (null para etapas canceladas). */
  round: number | null;
  name: string;
  officialName: string;
  country: string;
  countryCode: string; // ISO 3166-1 alfa-2, usado para gerar a bandeira
  city: string;
  circuitId: string;
  sprint: boolean;
  cancelled?: boolean;
  cancelledNote?: string;
  /** Primeiro e último dia do fim de semana (AAAA-MM-DD). */
  weekendStart: string;
  weekendEnd: string;
  sessions: RaceSession[];
  /** Indica se os horários são confirmados oficialmente ou estimados. */
  timesConfirmed: boolean;
}

export interface LapRecord {
  time: string;
  driver: string;
  year: number;
}

export interface Circuit {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lengthKm: number;
  turns: number;
  laps: number;
  raceDistanceKm: number;
  firstGp: number | null;
  type: 'Permanente' | 'Rua' | 'Semipermanente';
  direction: 'Horário' | 'Anti-horário';
  characteristics: string[];
  description: string;
  /** Recorde de volta em corrida. null quando não há dado verificado. */
  lapRecord: LapRecord | null;
  /** Pontos normalizados (0–100) do traçado esquemático. */
  layout: [number, number][];
  /** Dados aproximados/provisórios (ex.: circuito novo). */
  provisional?: boolean;
}

export interface Team {
  id: string;
  /** Nome do chassi da temporada (ex.: MCL40). */
  car: string;
  name: string;
  fullName: string;
  base: string;
  teamPrincipal: string;
  powerUnit: string;
  firstEntry: number;
  constructorsTitles: number;
  color: string;
  accent: string;
  history: string;
}

export interface Driver {
  id: string;
  /** ID usado pela API Jolpica/Ergast para cruzar dados de classificação. */
  apiId: string;
  firstName: string;
  lastName: string;
  number: number;
  code: string;
  teamId: string;
  nationality: string;
  countryCode: string;
  birthDate: string;
  birthPlace: string;
  debutYear: number;
  worldTitles: number;
  bio: string;
  career: string[];
  /** URL opcional para uma foto com licença identificada. */
  photoUrl?: string;
  photoCredit?: string;
}

export type FavoriteKind = 'race' | 'circuit' | 'driver' | 'team';

export interface Favorites {
  race: string[];
  circuit: string[];
  driver: string[];
  team: string[];
}

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  nationality: string;
  constructorId: string;
  constructorName: string;
  podiums?: number;
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  name: string;
  nationality: string;
}

export interface StandingsResult<T> {
  season: string;
  round: string;
  items: T[];
}

export interface RaceResultRow {
  position: number;
  driver: string;
  constructor: string;
  grid: number;
  laps: number;
  status: string;
  points: number;
  time?: string;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
