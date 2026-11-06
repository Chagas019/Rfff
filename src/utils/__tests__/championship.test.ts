import { races } from '../../data/calendar2026';
import { championshipState, eventsLeft } from '../championship';

const all = (n: number) => new Set(Array.from({ length: n }, (_, i) => i + 1));

describe('matemática do campeonato', () => {
  it('pontos em jogo vêm dos resultados publicados, não do relógio', () => {
    // 19 corridas com resultado: faltam 4 GPs (20 a 23); nenhum Sprint sobrando
    expect(eventsLeft(races, all(19), new Set([2, 4, 5, 9, 12, 17]))).toEqual({ racesLeft: 4, sprintsLeft: 0 });
    // a corrida 20 acabou mas o resultado ainda não saiu: ela continua contando
    expect(eventsLeft(races, all(19), new Set([2, 4, 5, 9, 12, 17])).racesLeft).toBe(4);
    // Sprint ainda não publicado entra na conta
    expect(eventsLeft(races, all(16), new Set([2, 4, 5, 9, 12])).sprintsLeft).toBe(1);
  });

  it('título decidido só quando ninguém alcança o líder', () => {
    const left = { racesLeft: 4, sprintsLeft: 0 }; // 100 pontos em jogo
    const s = championshipState([{ id: 'ant', name: 'Andrea Kimi Antonelli', points: 380 }, { id: 'ver', name: 'Max Verstappen', points: 261 }, { id: 'ham', name: 'Lewis Hamilton', points: 259 }], left, 'driver');
    expect(s.maxLeft).toBe(100);
    expect(s.decided).toBe(true);
    expect(s.contenders.map((c) => c.id)).toEqual(['ant']);
  });

  it('não decide com vantagem momentânea: compara com TODOS os rivais', () => {
    const left = { racesLeft: 2, sprintsLeft: 1 }; // 58 pontos
    const s = championshipState([{ id: 'a', name: 'A', points: 300 }, { id: 'b', name: 'B', points: 250 }, { id: 'c', name: 'C', points: 242 }, { id: 'd', name: 'D', points: 200 }], left, 'driver');
    expect(s.decided).toBe(false);
    expect(s.contenders.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('empate possível não é título decidido', () => {
    const s = championshipState([{ id: 'a', name: 'A', points: 125 }, { id: 'b', name: 'B', points: 100 }], { racesLeft: 1, sprintsLeft: 0 }, 'driver');
    expect(s.decided).toBe(false);
  });

  it('construtores podem somar 43 por GP e 15 por Sprint', () => {
    const s = championshipState([{ id: 'mer', name: 'Mercedes', points: 630 }, { id: 'fer', name: 'Ferrari', points: 504 }], { racesLeft: 2, sprintsLeft: 1 }, 'team');
    expect(s.maxLeft).toBe(101);
    expect(s.decided).toBe(true);
    expect(championshipState([{ id: 'mer', name: 'Mercedes', points: 630 }, { id: 'fer', name: 'Ferrari', points: 504 }], { racesLeft: 4, sprintsLeft: 0 }, 'team').decided).toBe(false);
  });
});
