import { buildNews, cleanUrl, parseRss } from '../../../api/_lib/rss.js';
import { races } from '../../data/calendar2026';
import { drivers } from '../../data/drivers';
import { driverPhotoUrl } from '../../data/driverPhotos';
import { OPENF1_MEETING } from '../../data/openf1';
import { gapBetween, gapSeconds } from '../../components/LastRacePodium';
import { raceHighlights } from '../../components/live/RaceInsights';
import { isImportant } from '../../components/live/RaceControlFeed';
import { rankForm } from '../../components/hub/FeaturedDrivers';
import { buildPodiumHistory } from '../f1Api';
import { isNew } from '../news';
import { formatSeconds, resultTiming } from '../openf1';
import { findDriver, nextSession } from '../../utils/season';
import type { RaceResultRow } from '../../types';

const SRC = { id: 'x', name: 'Fonte X', lang: 'pt' as const };
const RSS = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[Câmara estreia &#8220;em casa&#8221;]]></title><link>https://ex.com/a?utm_source=RSS&amp;id=7</link>
<description><![CDATA[<p>Resumo <b>com</b> HTML</p>]]></description><pubDate>Fri, 06 Nov 2026 12:00:00 +0000</pubDate>
<enclosure url="https://cdn.ex.com/a.jpg" type="image/jpeg"/><category>F1</category></item>
<item><title>Sem data</title><link>https://ex.com/b</link></item>
<item><title></title><link>https://ex.com/c</link></item>
</channel></rss>`;

describe('leitor de RSS', () => {
  it('extrai título, link limpo, resumo, data, imagem e categorias', () => {
    const [a, b] = parseRss(RSS, SRC);
    expect(a.title).toBe('Câmara estreia “em casa”');
    expect(a.url).toBe('https://ex.com/a?id=7');
    expect(a.summary).toBe('Resumo com HTML');
    expect(a.publishedAt).toBe('2026-11-06T12:00:00.000Z');
    expect(a.image).toBe('https://cdn.ex.com/a.jpg');
    expect(a.categories).toEqual(['F1']);
    expect(b.publishedAt).toBeNull();
  });
  it('descarta itens sem título', () => expect(parseRss(RSS, SRC)).toHaveLength(2));
  it('remove parâmetros de rastreamento', () => expect(cleanUrl('https://x.com/p?at_medium=RSS&utm_term=a&k=1')).toBe('https://x.com/p?k=1'));
  it('uma fonte fora do ar não derruba as outras', async () => {
    const fake = (async (url: string) => (url.includes('bbc') ? new Response('x', { status: 500 }) : new Response(RSS))) as unknown as typeof fetch;
    const data = await buildNews(fake, new Date('2026-11-06T13:00:00Z').getTime());
    expect(data.sources.find((s) => s.id === 'bbc')?.ok).toBe(false);
    expect(data.sources.filter((s) => s.ok).length).toBe(data.sources.length - 1);
    // links iguais de fontes diferentes aparecem uma vez só
    expect(data.items.filter((i) => i.url === 'https://ex.com/a?id=7')).toHaveLength(1);
  });
  it('marca como nova a notícia publicada depois da última visita', () => {
    const [a] = parseRss(RSS, SRC);
    expect(isNew(a, new Date('2026-11-06T11:00:00Z').getTime())).toBe(true);
    expect(isNew(a, new Date('2026-11-06T12:30:00Z').getTime())).toBe(false);
  });
});

describe('dados da temporada', () => {
  it('todas as etapas ativas têm chave da OpenF1', () => {
    races.filter((r) => !r.cancelled).forEach((r) => expect(OPENF1_MEETING[r.id]).toBeTypeOf('number'));
  });
  it('a rodada 16 é o GP do Bahrein disputado em Sepang', () => {
    expect(races.find((r) => r.round === 16)?.circuitId).toBe('sepang');
  });
  it('todos os pilotos titulares têm retrato oficial', () => {
    drivers.forEach((d) => expect(driverPhotoUrl(d.id, d.teamId)).toMatch(/^https:\/\/media\.formula1\.com\//));
  });
  it('encontra pilotos pelo ID da API, sigla ou número', () => {
    expect(findDriver({ driverId: 'max_verstappen' })?.id).toBe('verstappen');
    expect(findDriver({ number: 51 })?.id).toBe('camara');
    expect(findDriver({ driverId: 'ryo_hirakawa' })?.id).toBe('hirakawa');
  });
  it('próxima sessão depois do GP do México é o TL1 em São Paulo', () => {
    const ns = nextSession(races, new Date('2026-11-06T13:00:00Z'));
    expect(ns?.race.id).toBe('brazil');
    expect(ns?.session.type).toBe('fp1');
  });
});

const row = (p: Omit<Partial<RaceResultRow>, 'constructor'>): RaceResultRow => ({ position: 1, driver: 'A', driverId: 'a', code: 'AAA', number: 1, constructor: 'T', constructorId: 't', grid: 1, laps: 71, status: 'Finished', points: 25, ...p });

describe('resultados', () => {
  it('calcula a diferença entre pilotos do pódio', () => {
    expect(gapSeconds('+4.006')).toBe(4.006);
    expect(gapSeconds('+1:02.500')).toBeCloseTo(62.5);
    const p1 = row({ position: 1, time: '2:20:28.772' });
    const p2 = row({ position: 2, time: '+0.799' });
    const p3 = row({ position: 3, time: '+4.006' });
    expect(gapBetween(p1, p2)).toBe('+0.799 s');
    expect(gapBetween(p2, p3)).toBe('+3.207 s');
  });
  it('destaques: vencedor, volta mais rápida e maior escalada', () => {
    const hl = raceHighlights([row({ position: 1, grid: 5 }), row({ position: 2, driverId: 'b', grid: 22, fastestLapRank: 1, fastestLapTime: '1:19.268' })]);
    expect(hl.map((h) => h.label)).toEqual(['Vencedor', 'Volta mais rápida', 'Maior escalada']);
    expect(hl[2].detail).toContain('+20');
  });
  it('forma recente soma pontos das últimas corridas', () => {
    const f = rankForm([{ round: 1, results: [row({ driverId: 'a', points: 25, position: 1 }), row({ driverId: 'b', points: 18, position: 2 })] }, { round: 2, results: [row({ driverId: 'b', points: 25, position: 1 }), row({ driverId: 'a', points: 0, position: 12 })] }]);
    expect(f[0]).toMatchObject({ driverId: 'b', points: 43, finishes: [2, 1] });
  });
  it('monta o pódio de cada etapa a partir das listas de 1º, 2º e 3º', () => {
    const t = (id: string) => ({ MRData: { RaceTable: { Races: [{ round: '1', raceName: 'GP', date: '2026-03-08', Results: [{ Driver: { driverId: id, givenName: id, familyName: id.toUpperCase(), nationality: '' }, Constructor: { constructorId: 'c', name: 'C', nationality: '' } }] }] } } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = buildPodiumHistory([t('a'), t('b'), t('c')] as any);
    expect(h[0].drivers.map((d) => d.driverId)).toEqual(['a', 'b', 'c']);
  });
});

describe('OpenF1', () => {
  it('formata tempos', () => {
    expect(formatSeconds(77.341)).toBe('1:17.341');
    expect(formatSeconds(8428.772)).toBe('2:20:28.772');
  });
  it('usa o melhor tempo do Q3 na classificação e marca abandonos', () => {
    const q = resultTiming({ position: 2, driver_number: 63, number_of_laps: 22, dnf: false, dns: false, dsq: false, duration: [77.659, 77.027, 76.523], gap_to_leader: [0.318, 0.299, 0.009] }, 'quali');
    expect(q).toEqual({ time: '1:16.523', gap: '+0.009' });
    expect(resultTiming({ position: null, driver_number: 1, number_of_laps: 3, dnf: true, dns: false, dsq: false, duration: null, gap_to_leader: null }, 'race').gap).toBe('Abandono');
  });
  it('filtra as mensagens importantes da direção de prova', () => {
    const m = (message: string, extra = {}) => ({ date: '', lap_number: 1, category: 'Other', flag: null, scope: null, driver_number: null, message, ...extra });
    expect(isImportant(m('FIA STEWARDS: INCIDENT WILL BE INVESTIGATED'))).toBe(true);
    expect(isImportant(m('WAVED BLUE FLAG FOR CAR 18', { flag: 'BLUE', category: 'Flag' }))).toBe(false);
    expect(isImportant(m('SAFETY CAR DEPLOYED', { category: 'SafetyCar' }))).toBe(true);
  });
});
