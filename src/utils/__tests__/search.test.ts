import { buildSearchIndex, searchIndex } from '../search';
import { trackPath } from '../track';

describe('pesquisa global', () => {
  const index = buildSearchIndex();

  it('encontra pilotos por sobrenome', () => {
    const r = searchIndex(index, 'bortoleto');
    expect(r[0]).toMatchObject({ kind: 'Piloto', to: '/pilotos/bortoleto' });
  });

  it('encontra corridas e circuitos por cidade sem acento', () => {
    const r = searchIndex(index, 'sao paulo');
    expect(r.some((x) => x.kind === 'Corrida' && x.id === 'brazil')).toBe(true);
    expect(r.some((x) => x.kind === 'Circuito' && x.id === 'interlagos')).toBe(true);
  });

  it('exige todos os termos', () => {
    expect(searchIndex(index, 'ferrari hamilton').map((x) => x.id)).toEqual(['hamilton']);
  });

  it('consulta vazia não retorna nada', () => {
    expect(searchIndex(index, '   ')).toEqual([]);
  });
});

describe('trackPath', () => {
  it('gera um caminho SVG fechado', () => {
    const d = trackPath([[0, 0], [10, 0], [10, 10], [0, 10]]);
    expect(d.startsWith('M 0 0')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/C /g)).toHaveLength(4);
  });
  it('retorna vazio com menos de 3 pontos', () => {
    expect(trackPath([[0, 0], [1, 1]])).toBe('');
  });
});
