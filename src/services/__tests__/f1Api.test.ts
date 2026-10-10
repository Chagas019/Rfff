import { countPodiums, fetchConstructorStandings, parseConstructorStandings, parseDriverStandings } from '../f1Api';

const driverJson = {
  MRData: { StandingsTable: { season: '2026', StandingsLists: [{ season: '2026', round: '16', DriverStandings: [
    { position: '1', positionText: '1', points: '300', wins: '7', Driver: { driverId: 'norris', code: 'NOR', givenName: 'Lando', familyName: 'Norris', nationality: 'British' }, Constructors: [{ constructorId: 'mclaren', name: 'McLaren', nationality: 'British' }] },
  ] }] } },
};

describe('f1Api', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('converte a classificação de pilotos', () => {
    const r = parseDriverStandings(driverJson);
    expect(r.round).toBe('16');
    expect(r.items[0]).toMatchObject({ position: 1, points: 300, wins: 7, driverId: 'norris', constructorName: 'McLaren' });
  });

  it('retorna lista vazia quando ainda não há classificação', () => {
    const r = parseConstructorStandings({ MRData: { StandingsTable: { season: '2026', StandingsLists: [] } } });
    expect(r.items).toEqual([]);
  });

  it('conta pódios', () => {
    const mk = (ids: string[]) => ({ MRData: { RaceTable: { Races: ids.map((id) => ({ round: '1', raceName: 'x', Results: [{ Driver: { driverId: id } }] })) } } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(countPodiums([mk(['a', 'b']), mk(['a'])] as any)).toEqual({ a: 2, b: 1 });
  });

  it('gera um erro amigável quando a rede falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchConstructorStandings(2026)).rejects.toThrow(/Não foi possível conectar/);
  });

  it('gera um erro com o código HTTP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('x', { status: 503 }));
    await expect(fetchConstructorStandings(2026)).rejects.toThrow(/503/);
  });
});
