import { geoCentroid, geoContains, geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { ContinentId } from '../data/types';

/**
 * Fronteiras dos países (Natural Earth 1:110m, via pacote `world-atlas`) agrupadas por continente.
 * O arquivo (~100 KB) é carregado sob demanda, só quando o globo ou o mapa precisam dele.
 */

type CountryProps = { name: string };
export type CountryFeature = Feature<Geometry, CountryProps> & { continent: ContinentId | 'split' };

/** Países que a regra geográfica simples classificaria errado. */
const OVERRIDES: Record<string, ContinentId> = {
  'Saudi Arabia': 'asia',
  Yemen: 'asia',
  Oman: 'asia',
  Israel: 'asia',
  Palestine: 'asia',
  Jordan: 'asia',
  Lebanon: 'asia',
  Syria: 'asia',
  Iraq: 'asia',
  Kuwait: 'asia',
  Qatar: 'asia',
  'United Arab Emirates': 'asia',
  Turkey: 'asia',
  Cyprus: 'europe',
  'N. Cyprus': 'europe',
  'Fr. S. Antarctic Lands': 'antarctica',
};

/** Rússia é transcontinental: a oeste dos Urais (60°E) conta como Europa. */
const URALS_LON = 60;

export function classifyCountry(name: string, lon: number, lat: number): ContinentId | 'split' {
  if (name === 'Russia') return 'split';
  if (OVERRIDES[name]) return OVERRIDES[name];
  if (lat < -60) return 'antarctica';
  if (lon < -25) return lat > 8 ? 'north-america' : 'south-america';
  if ((lon > 110 && lat < -10) || (lon > 130 && lat < 0) || lon < -150) return 'oceania';
  if (lon >= -20 && lon <= 52 && lat < 37.5) return 'africa';
  if (lon >= -25 && lon <= URALS_LON && lat >= 35) return 'europe';
  return 'asia';
}

let cache: Promise<CountryFeature[]> | null = null;

export function loadCountries(): Promise<CountryFeature[]> {
  if (!cache) {
    cache = import('world-atlas/countries-110m.json').then((mod) => {
      const topo = (mod.default ?? mod) as unknown as Topology<{ countries: GeometryCollection<CountryProps> }>;
      const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, CountryProps>;
      return fc.features.map((f) => {
        const [lon, lat] = geoCentroid(f);
        return Object.assign(f, { continent: classifyCountry(f.properties.name, lon, lat) });
      });
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

/** Continente sob um ponto (ou `null` no oceano). */
export function continentAt(countries: CountryFeature[], lat: number, lon: number): ContinentId | null {
  for (const c of countries) {
    if (geoContains(c, [lon, lat])) {
      if (c.continent === 'split') return lon >= URALS_LON || lon < -150 ? 'asia' : 'europe';
      return c.continent;
    }
  }
  return null;
}

function equirect(width: number, height: number) {
  return geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2])
    .precision(0.3);
}

/** Desenha em equirretangular (mesmo mapeamento UV da esfera) os países de um continente. */
export function drawContinent(ctx: CanvasRenderingContext2D, countries: CountryFeature[], continent: ContinentId) {
  const { width, height } = ctx.canvas;
  const path = geoPath(equirect(width, height), ctx);
  const xOf = (lon: number) => ((lon + 180) / 360) * width;

  for (const c of countries) {
    if (c.continent === 'split') {
      // Recorta a Rússia nos Urais para destacar só a parte do continente escolhido.
      const rects: Array<[number, number]> =
        continent === 'europe'
          ? [[20, URALS_LON]]
          : continent === 'asia'
            ? [
                [URALS_LON, 180],
                [-180, -150],
              ]
            : [];
      for (const [a, b] of rects) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(xOf(a), 0, xOf(b) - xOf(a), height);
        ctx.clip();
        ctx.beginPath();
        path(c);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      continue;
    }
    if (c.continent !== continent) continue;
    ctx.beginPath();
    path(c);
    ctx.fill();
    ctx.stroke();
  }
}

/** Máscara de terra (todos os países) em equirretangular, usada no mapa 2D e no fallback. */
export function drawLand(ctx: CanvasRenderingContext2D, countries: CountryFeature[], width: number, height: number) {
  const path = geoPath(equirect(width, height), ctx);
  ctx.beginPath();
  for (const c of countries) path(c);
  ctx.fill();
}
