import { SEASON, races as localRaces } from '../data/calendar2026';
import type { Race, RaceSession, SessionType } from '../types';
import { API_BASE } from './f1Api';

/**
 * Calendário oficial ao vivo (Jolpica-F1) conciliado com os dados locais.
 * - A API manda nas datas e horários (UTC) de cada sessão e em quais etapas existem.
 * - Os dados locais dão nomes em português, país, bandeira e circuito.
 * - Resposta guardada em localStorage por 12 h; sem rede, usa o cache ou o calendário local.
 */
const CACHE_KEY = `gridf1:schedule:${SEASON}`;
const TTL = 12 * 60 * 60 * 1000;

/** circuitId da Jolpica → id do circuito local. */
const CIRCUIT: Record<string, string> = {
  albert_park: 'albert-park', americas: 'cota', baku: 'baku', catalunya: 'catalunya', hungaroring: 'hungaroring',
  interlagos: 'interlagos', losail: 'lusail', madring: 'madring', marina_bay: 'singapore', miami: 'miami', monaco: 'monaco',
  monza: 'monza', red_bull_ring: 'red-bull-ring', rodriguez: 'mexico', sepang: 'sepang', shanghai: 'shanghai',
  silverstone: 'silverstone', spa: 'spa', suzuka: 'suzuka', vegas: 'las-vegas', villeneuve: 'montreal', yas_marina: 'yas-marina',
  zandvoort: 'zandvoort', bahrain: 'bahrain', jeddah: 'jeddah',
};

/** País (em inglês, como a API escreve) → código ISO, para etapas que ainda não existem nos dados locais. */
const COUNTRY: Record<string, string> = {
  Australia: 'AU', China: 'CN', Japan: 'JP', Bahrain: 'BH', 'Saudi Arabia': 'SA', USA: 'US', 'United States': 'US', Canada: 'CA',
  Monaco: 'MC', Spain: 'ES', Austria: 'AT', UK: 'GB', 'United Kingdom': 'GB', Belgium: 'BE', Hungary: 'HU', Netherlands: 'NL',
  Italy: 'IT', Azerbaijan: 'AZ', Malaysia: 'MY', Singapore: 'SG', Mexico: 'MX', Brazil: 'BR', Qatar: 'QA', UAE: 'AE', 'United Arab Emirates': 'AE',
};

interface ApiSession { date: string; time?: string }
export interface ApiRace {
  round: string; raceName: string; date: string; time?: string;
  Circuit: { circuitId: string; circuitName: string; Location: { locality: string; country: string } };
  FirstPractice?: ApiSession; SecondPractice?: ApiSession; ThirdPractice?: ApiSession;
  Qualifying?: ApiSession; Sprint?: ApiSession; SprintQualifying?: ApiSession; SprintShootout?: ApiSession;
}

const iso = (s?: ApiSession) => (s?.time ? `${s.date}T${s.time.replace('Z', '')}Z` : null);

function apiSessions(r: ApiRace): RaceSession[] {
  const out: [SessionType, string | null][] = [
    ['fp1', iso(r.FirstPractice)], ['fp2', iso(r.SecondPractice)], ['fp3', iso(r.ThirdPractice)],
    ['sprintQuali', iso(r.SprintQualifying ?? r.SprintShootout)], ['sprint', iso(r.Sprint)],
    ['quali', iso(r.Qualifying)], ['race', iso({ date: r.date, time: r.time })],
  ];
  return out.filter((x): x is [SessionType, string] => !!x[1]).map(([type, start]) => ({ type, start })).sort((a, b) => a.start.localeCompare(b.start));
}

/** Une o calendário da API com o local. Pura: fácil de testar. */
export function reconcile(local: Race[], api: ApiRace[]): Race[] {
  const used = new Set<string>();
  const merged: Race[] = api.map((a) => {
    const circuitId = CIRCUIT[a.Circuit.circuitId] ?? a.Circuit.circuitId;
    const base = local.find((r) => r.circuitId === circuitId && !r.cancelled) ?? local.find((r) => r.circuitId === circuitId);
    const sessions = apiSessions(a);
    if (base) used.add(base.id);
    const day = (s: string) => s.slice(0, 10);
    return {
      ...(base ?? {
        id: `${a.Circuit.circuitId}-${a.round}`, name: a.raceName, officialName: a.raceName, city: a.Circuit.Location.locality,
        country: a.Circuit.Location.country, countryCode: COUNTRY[a.Circuit.Location.country] ?? '', circuitId, sprint: !!a.Sprint, timesConfirmed: true,
      }),
      round: Number(a.round),
      cancelled: false,
      cancelledNote: undefined,
      sprint: !!a.Sprint,
      sessions: sessions.length ? sessions : base?.sessions ?? [],
      weekendStart: sessions[0] ? day(sessions[0].start) : base?.weekendStart ?? a.date,
      weekendEnd: a.date,
      timesConfirmed: !!a.time,
    } as Race;
  });
  // etapas locais que a API não lista mais ficam como canceladas (para o histórico)
  const dropped = local.filter((r) => !used.has(r.id)).map((r) => ({ ...r, round: null, cancelled: true, cancelledNote: r.cancelledNote ?? 'Fora do calendário oficial atual.' }));
  return [...merged, ...dropped].sort((a, b) => a.weekendStart.localeCompare(b.weekendStart));
}

function readCache(): { at: number; races: ApiRace[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Calendário conciliado. Nunca falha: na pior hipótese devolve o calendário local. */
export async function fetchSchedule(signal?: AbortSignal): Promise<{ races: Race[]; source: 'api' | 'cache' | 'local'; updatedAt: number | null }> {
  const cached = readCache();
  if (cached && Date.now() - cached.at < TTL) return { races: reconcile(localRaces, cached.races), source: 'cache', updatedAt: cached.at };
  try {
    const res = await fetch(`${API_BASE}/${SEASON}.json?limit=100`, { signal });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { MRData: { RaceTable: { Races: ApiRace[] } } };
    const api = json.MRData.RaceTable.Races;
    if (!api.length) throw new Error('vazio');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), races: api })); } catch { /* sem armazenamento */ }
    return { races: reconcile(localRaces, api), source: 'api', updatedAt: Date.now() };
  } catch {
    if (cached) return { races: reconcile(localRaces, cached.races), source: 'cache', updatedAt: cached.at };
    return { races: localRaces, source: 'local', updatedAt: null };
  }
}
