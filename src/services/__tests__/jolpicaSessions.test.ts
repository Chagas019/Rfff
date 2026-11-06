import { lapSeconds, toOpenF1 } from '../jolpicaSessions';
import { resultTiming } from '../openf1';

const d = (n: string, code: string) => ({ driverId: code.toLowerCase(), code, givenName: 'X', familyName: code, permanentNumber: n });
const C = { name: 'Equipe' };

describe('reserva Jolpica no formato da OpenF1', () => {
  it('converte tempos de volta', () => {
    expect(lapSeconds('1:16.514')).toBeCloseTo(76.514);
    expect(lapSeconds(undefined)).toBeNull();
  });
  it('corrida: diferença calculada pelos milissegundos e abandonos marcados', () => {
    const { results } = toOpenF1([
      { number: '3', position: '1', laps: '71', status: 'Finished', Driver: d('3', 'VER'), Constructor: C, Time: { millis: '8428772', time: '2:20:28.772' } },
      { number: '44', position: '2', laps: '71', status: 'Finished', Driver: d('44', 'HAM'), Constructor: C, Time: { millis: '8429571', time: '+0.799' } },
      { number: '14', position: '22', laps: '40', status: 'Retired', Driver: d('14', 'ALO'), Constructor: C },
    ], 'race');
    expect(resultTiming(results[0], 'race').time).toBe('2:20:28.772');
    expect(resultTiming(results[1], 'race').gap).toBe('+0.799');
    expect(resultTiming(results[2], 'race').gap).toBe('Abandono');
  });
  it('classificação: melhor tempo do último Q disputado e diferença para a pole', () => {
    const { results } = toOpenF1([
      { number: '44', position: '1', Driver: d('44', 'HAM'), Constructor: C, Q1: '1:17.341', Q2: '1:16.953', Q3: '1:16.514' },
      { number: '63', position: '2', Driver: d('63', 'RUS'), Constructor: C, Q1: '1:17.659', Q2: '1:17.027', Q3: '1:16.523' },
    ], 'quali');
    expect(resultTiming(results[1], 'quali')).toEqual({ time: '1:16.523', gap: '+0.009' });
  });
});
