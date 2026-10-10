import { races } from '../../data/calendar2026';
import { EMPTY_FILTERS, filterRaces } from '../filters';
import { flagEmoji, formatWeekend, normalize } from '../format';

const now = new Date('2026-10-10T10:00:00Z');

describe('filterRaces', () => {
  it('sem filtros retorna todas as etapas', () => {
    expect(filterRaces(races, EMPTY_FILTERS, now)).toHaveLength(races.length);
  });

  it('busca pelo nome ignorando acentos e maiúsculas', () => {
    const r = filterRaces(races, { ...EMPTY_FILTERS, query: 'SAO PAULO' }, now);
    expect(r.map((x) => x.id)).toEqual(['brazil']);
  });

  it('filtra por país', () => {
    const r = filterRaces(races, { ...EMPTY_FILTERS, country: 'Estados Unidos' }, now);
    expect(r.map((x) => x.id)).toEqual(['miami', 'united-states', 'las-vegas']);
  });

  it('filtra por mês (junho)', () => {
    const r = filterRaces(races, { ...EMPTY_FILTERS, month: 5 }, now);
    expect(r.map((x) => x.id)).toEqual(['monaco', 'barcelona', 'austria']);
  });

  it('filtra por status', () => {
    expect(filterRaces(races, { ...EMPTY_FILTERS, status: 'live' }, now).map((x) => x.id)).toEqual(['singapore']);
    expect(filterRaces(races, { ...EMPTY_FILTERS, status: 'cancelled' }, now)).toHaveLength(2);
    expect(filterRaces(races, { ...EMPTY_FILTERS, status: 'completed' }, now)).toHaveLength(15);
    // "Em breve" inclui a próxima etapa
    expect(filterRaces(races, { ...EMPTY_FILTERS, status: 'upcoming' }, now)).toHaveLength(6);
  });

  it('combina filtros', () => {
    const r = filterRaces(races, { ...EMPTY_FILTERS, country: 'Espanha', status: 'completed' }, now);
    expect(r).toHaveLength(2);
  });
});

describe('formatação', () => {
  it('formata fins de semana no mesmo mês e entre meses', () => {
    expect(formatWeekend('2026-03-06', '2026-03-08')).toBe('06 – 08 mar');
    expect(formatWeekend('2026-10-30', '2026-11-01')).toBe('30 out – 01 nov');
  });
  it('gera emoji de bandeira', () => {
    expect(flagEmoji('br')).toBe('🇧🇷');
  });
  it('normaliza texto', () => {
    expect(normalize('  Mônaco ')).toBe('monaco');
  });
});
