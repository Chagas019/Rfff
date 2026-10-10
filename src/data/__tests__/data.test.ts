import { races } from '../calendar2026';
import { circuits } from '../circuits';
import { drivers } from '../drivers';
import { teams } from '../teams';

describe('integridade dos dados', () => {
  it('tem 22 etapas ativas numeradas de 1 a 22 em ordem cronológica', () => {
    const active = races.filter((r) => !r.cancelled);
    expect(active).toHaveLength(22);
    expect(active.map((r) => r.round)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
    const dates = active.map((r) => r.weekendStart);
    expect([...dates].sort()).toEqual(dates);
  });

  it('cada etapa ativa tem corrida e sessões dentro do fim de semana', () => {
    for (const r of races.filter((x) => !x.cancelled)) {
      expect(r.sessions.some((s) => s.type === 'race')).toBe(true);
      expect(r.sessions.some((s) => s.type === 'sprint')).toBe(r.sprint);
      for (const s of r.sessions) {
        const day = s.start.slice(0, 10);
        expect(day >= r.weekendStart && day <= r.weekendEnd).toBe(true);
        expect(Number.isNaN(new Date(s.start).getTime())).toBe(false);
      }
    }
  });

  it('tem 6 fins de semana Sprint', () => {
    expect(races.filter((r) => r.sprint).map((r) => r.id)).toEqual(['china', 'miami', 'canada', 'great-britain', 'netherlands', 'singapore']);
  });

  it('todas as etapas apontam para circuitos existentes', () => {
    for (const r of races) expect(circuits.find((c) => c.id === r.circuitId)).toBeDefined();
  });

  it('distância da corrida ≈ voltas × extensão', () => {
    for (const c of circuits) expect(Math.abs(c.laps * c.lengthKm - c.raceDistanceKm)).toBeLessThan(1);
  });

  it('11 equipes com 2 pilotos cada e números únicos', () => {
    expect(teams).toHaveLength(11);
    for (const t of teams) expect(drivers.filter((d) => d.teamId === t.id)).toHaveLength(2);
    expect(new Set(drivers.map((d) => d.number)).size).toBe(drivers.length);
  });
});
