import { cacheSeconds, parseRequest, proxy, upstreamUrl } from '../../../api/_lib/f1proxy.js';
import { directUrl } from '../http';

describe('camada de dados /api/f1', () => {
  it('só aceita caminhos conhecidos de cada provedor', () => {
    expect(upstreamUrl('jolpica', '/2026/driverstandings.json', '')).toBe('https://api.jolpi.ca/ergast/f1/2026/driverstandings.json');
    expect(upstreamUrl('jolpica', '/2026/20/qualifying.json', 'limit=100')).toContain('qualifying.json?limit=100');
    expect(upstreamUrl('openf1', '/session_result', 'session_key=11404')).toBe('https://api.openf1.org/v1/session_result?session_key=11404');
    expect(upstreamUrl('jolpica', '/../../etc/passwd', '')).toBeNull();
    expect(upstreamUrl('outro', '/x', '')).toBeNull();
    expect(upstreamUrl('openf1', '/sessions', 'meeting_key=1;drop')).toBeNull();
  });
  it('cache curto para a temporada atual e longo para temporadas passadas', () => {
    expect(cacheSeconds('jolpica', `/${new Date().getUTCFullYear()}/driverstandings.json`)).toBe(30);
    expect(cacheSeconds('jolpica', '/2019/driverstandings.json')).toBe(86400);
  });
  it('lê o provedor e o caminho da URL', () => {
    expect(parseRequest('/api/f1/jolpica/2026/results/1.json?limit=100')).toEqual({ provider: 'jolpica', path: '/2026/results/1.json', search: 'limit=100' });
    expect(parseRequest('/api/f1?provider=openf1&p=/sessions&meeting_key=1299')).toEqual({ provider: 'openf1', path: '/sessions', search: 'meeting_key=1299' });
  });
  it('transforma a restrição da OpenF1 (401) em 423 com motivo', async () => {
    const r = await proxy('openf1', '/sessions', 'meeting_key=1', (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch);
    expect(r.status).toBe(423);
    expect(JSON.parse(r.body).locked).toBe(true);
  });
  it('fonte fora do ar vira 502 sem cache', async () => {
    const r = await proxy('jolpica', '/2026/driverstandings.json', '', (async () => { throw new TypeError('down'); }) as unknown as typeof fetch);
    expect(r.status).toBe(502);
    expect(r.headers['cache-control']).toBe('no-store');
  });
  it('o site sabe o endereço direto de reserva', () => {
    expect(directUrl('/api/f1/jolpica/2026.json')).toBe('https://api.jolpi.ca/ergast/f1/2026.json');
    expect(directUrl('/api/news')).toBeNull();
  });
});
