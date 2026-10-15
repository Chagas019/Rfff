import type { City, ContinentId, NetworkDataset, RegionId, Route } from '../data/types';

const CONTINENT_IDS: ContinentId[] = ['africa', 'europe', 'asia', 'north-america', 'south-america', 'oceania', 'antarctica'];
const REGION_IDS: RegionId[] = ['amer', 'emea', 'apac'];
const ROUTE_KINDS: Route['kind'][] = ['backbone', 'research', 'creative'];

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseCity(v: unknown): City | null {
  if (!isObj(v)) return null;
  const { id, name, country, continent, region, lat, lon, timezone, role, nodes, latencyMs } = v;
  if (!isStr(id) || !isStr(name) || !isStr(country) || !isNum(lat) || !isNum(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  if (!CONTINENT_IDS.includes(continent as ContinentId) || !REGION_IDS.includes(region as RegionId)) return null;
  return {
    id,
    name,
    country,
    continent: continent as ContinentId,
    region: region as RegionId,
    lat,
    lon,
    timezone: isStr(timezone) ? timezone : 'UTC',
    role: isStr(role) ? role : 'Nó da rede',
    nodes: isNum(nodes) ? nodes : 0,
    latencyMs: isNum(latencyMs) ? latencyMs : 0,
  };
}

function parseRoute(v: unknown, ids: Set<string>): Route | null {
  if (!isObj(v)) return null;
  const { from, to, label, capacityGbps, kind } = v;
  if (!isStr(from) || !isStr(to) || !ids.has(from) || !ids.has(to) || from === to) return null;
  return {
    id: isStr(v.id) ? v.id : `${from}--${to}`,
    from,
    to,
    label: isStr(label) ? label : `${from} → ${to}`,
    capacityGbps: isNum(capacityGbps) ? capacityGbps : 0,
    kind: ROUTE_KINDS.includes(kind as Route['kind']) ? (kind as Route['kind']) : 'backbone',
  };
}

/**
 * Valida um JSON externo. Itens inválidos são descartados; se nada sobrar, retorna `null`
 * para que o site use os dados de demonstração.
 */
export function parseDataset(raw: unknown, source: string): NetworkDataset | null {
  if (!isObj(raw) || !Array.isArray(raw.cities)) return null;
  const cities = raw.cities.map(parseCity).filter((c): c is City => c !== null);
  if (cities.length === 0) return null;
  const ids = new Set(cities.map((c) => c.id));
  const routes = Array.isArray(raw.routes) ? raw.routes.map((r) => parseRoute(r, ids)).filter((r): r is Route => r !== null) : [];
  return { demo: raw.demo === true, source, cities, routes };
}

export function indexCities(cities: City[]): Map<string, City> {
  return new Map(cities.map((c) => [c.id, c]));
}

/** Rotas que saem de ou chegam a uma cidade. */
export function routesOf(cityId: string, routes: Route[]): Route[] {
  return routes.filter((r) => r.from === cityId || r.to === cityId);
}

/** Id da outra ponta de uma rota. */
export function otherEnd(route: Route, cityId: string): string {
  return route.from === cityId ? route.to : route.from;
}
