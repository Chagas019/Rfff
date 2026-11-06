/**
 * Retratos oficiais da temporada 2026 publicados pela Formula 1 (media.formula1.com).
 * Cada endereço foi conferido em 2026-11-06 (HTTP 200, PNG/WebP com fundo transparente, 720 px).
 * Direitos de imagem: © Formula 1. Usados aqui apenas para identificar os pilotos.
 */
const TEAM_SLUG: Record<string, string> = {
  mclaren: 'mclaren', ferrari: 'ferrari', 'red-bull': 'redbullracing', mercedes: 'mercedes', 'aston-martin': 'astonmartin',
  alpine: 'alpine', williams: 'williams', 'racing-bulls': 'racingbulls', haas: 'haasf1team', audi: 'audi', cadillac: 'cadillac',
};

/** Código do piloto no acervo da F1 (ex.: maxver01). */
const CODE: Record<string, string> = {
  norris: 'lannor01', piastri: 'oscpia01', leclerc: 'chalec01', hamilton: 'lewham01', verstappen: 'maxver01', hadjar: 'isahad01',
  russell: 'georus01', antonelli: 'andant01', alonso: 'feralo01', stroll: 'lanstr01', gasly: 'piegas01', colapinto: 'fracol01',
  albon: 'alealb01', sainz: 'carsai01', lawson: 'lialaw01', lindblad: 'arvlin01', camara: 'rafcam01', bearman: 'olibea01',
  hulkenberg: 'nichul01', bortoleto: 'gabbor01', perez: 'serper01', bottas: 'valbot01', hirakawa: 'ryohir01', ocon: 'estoco01',
};

export const PHOTO_CREDIT = 'Foto oficial: Formula 1';

/** URL do retrato oficial, redimensionado pelo próprio CDN da F1 (largura em px). */
export function driverPhotoUrl(driverId: string, teamId: string, width = 480): string | null {
  const code = CODE[driverId];
  const slug = TEAM_SLUG[teamId];
  if (!code || !slug) return null;
  return `https://media.formula1.com/image/upload/c_fill,w_${width}/q_auto/v1740000001/common/f1/2026/${slug}/${code}/2026${slug}${code}right.webp`;
}
