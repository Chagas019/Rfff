import { races } from '../data/calendar2026';
import { circuits } from '../data/circuits';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';
import { normalize } from './format';

export type SearchKind = 'Corrida' | 'Circuito' | 'Piloto' | 'Equipe';
export interface SearchItem { kind: SearchKind; id: string; title: string; subtitle: string; to: string; keywords: string }

export function buildSearchIndex(): SearchItem[] {
  return [
    ...races.map((r) => ({
      kind: 'Corrida' as const, id: r.id, title: r.name, subtitle: `${r.round ? `Rodada ${r.round}` : 'Cancelada'} · ${r.city}, ${r.country}`,
      to: `/calendario/${r.id}`, keywords: `${r.name} ${r.officialName} ${r.city} ${r.country}`,
    })),
    ...circuits.map((c) => ({
      kind: 'Circuito' as const, id: c.id, title: c.name, subtitle: `${c.city}, ${c.country}`, to: `/circuitos/${c.id}`, keywords: `${c.name} ${c.city} ${c.country}`,
    })),
    ...drivers.map((d) => {
      const t = teams.find((x) => x.id === d.teamId);
      return {
        kind: 'Piloto' as const, id: d.id, title: `${d.firstName} ${d.lastName}`, subtitle: `#${d.number} · ${t?.name ?? ''}`,
        to: `/pilotos/${d.id}`, keywords: `${d.firstName} ${d.lastName} ${d.code} ${d.number} ${d.nationality} ${t?.name ?? ''}`,
      };
    }),
    ...teams.map((t) => ({
      kind: 'Equipe' as const, id: t.id, title: t.name, subtitle: t.fullName, to: `/equipes/${t.id}`, keywords: `${t.name} ${t.fullName} ${t.base} ${t.powerUnit}`,
    })),
  ];
}

/** Busca por todos os termos digitados (ordem livre, sem acentos). */
export function searchIndex(index: SearchItem[], query: string, limit = 12): SearchItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return index
    .map((item) => {
      const hay = normalize(item.keywords);
      const title = normalize(item.title);
      if (!terms.every((t) => hay.includes(t))) return null;
      const score = terms.reduce((s, t) => s + (title.startsWith(t) ? 3 : title.includes(t) ? 2 : 1), 0);
      return { item, score };
    })
    .filter((x): x is { item: SearchItem; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
