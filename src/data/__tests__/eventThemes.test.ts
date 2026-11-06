import { races } from '../calendar2026';
import { DEFAULT_THEME, EVENT_THEMES, themeFor } from '../eventThemes';
import { applyTheme, pickActiveRace } from '../../hooks/useEventTheme';
import { fetchSchedule, reconcile, type ApiRace } from '../../services/schedule';

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

describe('paletas por país', () => {
  it('toda etapa ativa do calendário tem paleta própria', () => {
    races.filter((r) => !r.cancelled).forEach((r) => expect(EVENT_THEMES[r.countryCode], r.id).toBeDefined());
  });
  it('o destaque é legível no fundo escuro e com texto preto por cima', () => {
    [...Object.values(EVENT_THEMES), DEFAULT_THEME].forEach((t) => {
      expect(contrast(t.accent, '#0a0e1c'), t.motif).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.accent, '#000000'), t.motif).toBeGreaterThanOrEqual(4.5);
    });
  });
  it('países sem paleta usam a identidade padrão', () => expect(themeFor('ZZ')).toBe(DEFAULT_THEME));
  it('aplica as cores em variáveis CSS', () => {
    applyTheme(EVENT_THEMES.BR, 'BR');
    expect(document.documentElement.style.getPropertyValue('--ev-accent')).toBe('#FFDF00');
    expect(document.documentElement.dataset.event).toBe('BR');
  });
});

describe('etapa que define a identidade', () => {
  const at = (iso: string) => pickActiveRace(races, new Date(iso));
  it('antes do TL1 de Interlagos, a próxima etapa é o Brasil', () => expect(at('2026-11-06T13:00:00Z')).toMatchObject({ race: { id: 'brazil' }, phase: 'next' }));
  it('durante o fim de semana, o GP atual', () => expect(at('2026-11-07T18:30:00Z')).toMatchObject({ race: { id: 'brazil' }, phase: 'live' }));
  it('terminada a corrida, já prepara Las Vegas', () => expect(at('2026-11-08T21:00:00Z')).toMatchObject({ race: { id: 'las-vegas' }, phase: 'next' }));
  it('fim de temporada: sem etapa', () => expect(at('2026-12-31T00:00:00Z').phase).toBe('none'));
});

describe('calendário oficial conciliado', () => {
  const api: ApiRace[] = [
    { round: '1', raceName: 'Brazilian Grand Prix', date: '2026-11-15', time: '17:00:00Z', Circuit: { circuitId: 'interlagos', circuitName: 'Interlagos', Location: { locality: 'São Paulo', country: 'Brazil' } }, Qualifying: { date: '2026-11-14', time: '18:00:00Z' } },
    { round: '2', raceName: 'Portuguese Grand Prix', date: '2026-11-22', time: '14:00:00Z', Circuit: { circuitId: 'portimao', circuitName: 'Portimão', Location: { locality: 'Portimão', country: 'Portugal' } } },
  ];
  it('a API manda nas datas e mantém os nomes em português', () => {
    const r = reconcile(races, api);
    const br = r.find((x) => x.id === 'brazil')!;
    expect(br.name).toBe('GP de São Paulo');
    expect(br.round).toBe(1);
    expect(br.sessions.find((s) => s.type === 'race')?.start).toBe('2026-11-15T17:00:00Z');
  });
  it('etapa nova da API aparece; etapa que saiu fica cancelada', () => {
    const r = reconcile(races, api);
    expect(r.find((x) => x.name === 'Portuguese Grand Prix')).toBeDefined();
    expect(r.find((x) => x.id === 'monaco')?.cancelled).toBe(true);
  });
  it('sem rede e sem cache, usa o calendário embutido', async () => {
    localStorage.clear();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    const s = await fetchSchedule();
    expect(s.source).toBe('local');
    expect(s.races).toBe(races);
    vi.restoreAllMocks();
  });
  it('com a API fora do ar, usa o último calendário guardado', async () => {
    localStorage.setItem('gridf1:schedule:2026', JSON.stringify({ at: Date.now() - 13 * 3600_000, races: api }));
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    const s = await fetchSchedule();
    expect(s.source).toBe('cache');
    expect(s.races.find((x) => x.id === 'brazil')?.round).toBe(1);
    vi.restoreAllMocks();
  });
});
