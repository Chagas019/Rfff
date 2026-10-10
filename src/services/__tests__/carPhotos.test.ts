import { findPhoto, pickPhoto, stripHtml, teamPhotoQuery } from '../carPhotos';

const page = (title: string, o: Partial<{ w: number; h: number; mime: string; lic: string; index: number }> = {}) => ({
  title,
  index: o.index ?? 1,
  imageinfo: [{
    url: `https://upload.wikimedia.org/${title}`, thumburl: `https://upload.wikimedia.org/thumb/${title}`, thumbwidth: 1600, thumbheight: 900,
    width: o.w ?? 4000, height: o.h ?? 2250, mime: o.mime ?? 'image/jpeg', descriptionurl: `https://commons.wikimedia.org/wiki/${title}`,
    extmetadata: { Artist: { value: '<a href="x">Fotógrafo</a>' }, LicenseShortName: { value: o.lic ?? 'CC BY-SA 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' } },
  }],
});

describe('carPhotos', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('remove HTML do autor', () => {
    expect(stripHtml('<a href="x">Ana &amp; Bia</a>')).toBe('Ana & Bia');
  });

  it('escolhe a foto horizontal, livre e com o nome do carro', () => {
    const p = pickPhoto([
      page('File:McLaren MCL40 vertical.jpg', { w: 1000, h: 1500, index: 1 }),
      page('File:McLaren MCL40 logo.svg', { mime: 'image/svg+xml', index: 2 }),
      page('File:Outro carro.jpg', { index: 3 }),
      page('File:McLaren MCL40 sem licenca.jpg', { lic: 'Copyrighted', index: 4 }),
      page('File:McLaren MCL40 Barcelona.jpg', { index: 5 }),
    ], ['MCL40']);
    expect(p).toMatchObject({ title: 'McLaren MCL40 Barcelona', author: 'Fotógrafo', license: 'CC BY-SA 4.0' });
  });

  it('retorna null quando nada serve', () => {
    expect(pickPhoto([page('File:Outra coisa.jpg')], ['MCL40'])).toBeNull();
  });

  it('monta consultas começando pela categoria do chassi', () => {
    expect(teamPhotoQuery('mclaren').searches[0]).toBe('incategory:"McLaren MCL40"');
  });

  it('busca na API, tenta a próxima consulta e guarda em cache', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ query: { pages: [] } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ query: { pages: [page('File:Ferrari SF-26 2026.jpg')] } })));
    const photo = await findPhoto('ferrari', teamPhotoQuery('ferrari'));
    expect(photo?.title).toBe('Ferrari SF-26 2026');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('origin=*');
    await findPhoto('ferrari', teamPhotoQuery('ferrari'));
    expect(fetchMock).toHaveBeenCalledTimes(2); // veio do cache
  });

  it('propaga erro de rede sem gravar cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fail'));
    await expect(findPhoto('haas', teamPhotoQuery('haas'))).rejects.toThrow();
    expect(localStorage.getItem('gridf1:carphotos:v1')).toBeNull();
  });
});
