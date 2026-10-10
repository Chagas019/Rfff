import { races } from '../../data/calendar2026';
import type { Race } from '../../types';
import { getBaseStatus, getCountdown, getNextRace, getRaceStart, getRaceStatus } from '../race';

const singapore = races.find((r) => r.id === 'singapore')!;
const austin = races.find((r) => r.id === 'united-states')!;

describe('getCountdown', () => {
  it('quebra a diferença em dias, horas, minutos e segundos', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const target = new Date('2026-01-03T05:06:07Z');
    expect(getCountdown(target, now)).toMatchObject({ days: 2, hours: 5, minutes: 6, seconds: 7, finished: false });
  });

  it('nunca retorna valores negativos depois do evento', () => {
    const cd = getCountdown(new Date('2026-01-01T00:00:00Z'), new Date('2026-02-01T00:00:00Z'));
    expect(cd).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, finished: true });
  });
});

describe('status das etapas', () => {
  it('usa a data real da corrida (Singapura, 11/10/2026 20:00 local = 12:00 UTC)', () => {
    expect(getRaceStart(singapore)?.toISOString()).toBe('2026-10-11T12:00:00.000Z');
  });

  it('marca o GP como em andamento durante o fim de semana', () => {
    expect(getBaseStatus(singapore, new Date('2026-10-10T10:00:00Z'))).toBe('live');
  });

  it('marca o GP como concluído depois da corrida', () => {
    expect(getBaseStatus(singapore, new Date('2026-10-12T00:00:00Z'))).toBe('completed');
  });

  it('marca etapas canceladas', () => {
    const bahrain = races.find((r) => r.id === 'bahrain')!;
    expect(getRaceStatus(bahrain, races, new Date('2026-01-01'))).toBe('cancelled');
  });

  it('a próxima corrida ignora canceladas e concluídas', () => {
    expect(getNextRace(races, new Date('2026-04-05T00:00:00Z'))?.id).toBe('miami');
    expect(getNextRace(races, new Date('2026-10-12T00:00:00Z'))?.id).toBe(austin.id);
    expect(getRaceStatus(austin, races, new Date('2026-10-12T00:00:00Z'))).toBe('next');
  });

  it('retorna null quando a temporada terminou', () => {
    expect(getNextRace(races, new Date('2027-01-01T00:00:00Z'))).toBeNull();
  });

  it('etapa sem sessões é tratada como em breve', () => {
    const r = { ...singapore, sessions: [] } as Race;
    expect(getBaseStatus(r, new Date())).toBe('upcoming');
  });
});
