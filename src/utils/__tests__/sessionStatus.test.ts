import { describe, expect, it } from 'vitest';
import { circuitOffsetMin, circuitTime, nextInWeekend, sessionStatus, utcLabel } from '../sessionStatus';
import type { RaceSession } from '../../types';

const quali: RaceSession = { type: 'quali', start: '2026-11-07T15:00:00-03:00' };
const race: RaceSession = { type: 'race', start: '2026-11-08T14:00:00-03:00' };

describe('status das sessões', () => {
  it('segue o relógio e só marca resultado quando publicado', () => {
    const none = new Set<never>();
    expect(sessionStatus(quali, new Date('2026-11-07T17:00:00Z'), none)).toBe('scheduled');
    expect(sessionStatus(quali, new Date('2026-11-07T18:30:00Z'), none)).toBe('live');
    expect(sessionStatus(quali, new Date('2026-11-07T19:30:00Z'), none)).toBe('finished');
    expect(sessionStatus(quali, new Date('2026-11-07T19:30:00Z'), new Set(['quali'] as const))).toBe('results');
    // resultado publicado não adianta o status de uma sessão que ainda não acabou
    expect(sessionStatus(race, new Date('2026-11-08T18:00:00Z'), new Set(['race'] as const))).toBe('live');
  });

  it('mostra o horário no fuso do circuito', () => {
    expect(circuitOffsetMin(race.start)).toBe(-180);
    expect(circuitOffsetMin('2026-03-06T12:30:00+05:30')).toBe(330);
    expect(utcLabel(-180)).toBe('UTC−3');
    expect(utcLabel(330)).toBe('UTC+5:30');
    expect(circuitTime(race.start)).toEqual({ day: 'dom 08/11', time: '14:00', offset: 'UTC−3' });
  });

  it('acha a próxima sessão do fim de semana', () => {
    expect(nextInWeekend([quali, race], new Date('2026-11-07T20:00:00Z'))).toBe(race);
    expect(nextInWeekend([quali, race], new Date('2026-11-09T00:00:00Z'))).toBeNull();
  });
});
