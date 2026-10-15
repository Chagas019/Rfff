import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { City, Route } from '../data/types';
import { useCountries } from '../hooks/useCountries';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { drawLand, type CountryFeature } from '../lib/continents';
import { projectEquirect } from '../lib/geo';

gsap.registerPlugin(ScrollTrigger);

export const MAP_W = 1000;
const TOP = 78;
const BOTTOM = -58;
export const MAP_H = Math.round((MAP_W * (TOP - BOTTOM)) / 360);

const proj = (lat: number, lon: number) => projectEquirect(lat, lon, MAP_W, MAP_H, TOP, BOTTOM);

/** Grade de pontos sobre os continentes (calculada uma vez a partir da máscara de terra). */
function landDots(countries: CountryFeature[], step: number): Array<[number, number]> {
  const w = 1440;
  const h = 720;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = '#fff';
  drawLand(ctx, countries, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const dots: Array<[number, number]> = [];
  for (let lat = TOP; lat >= BOTTOM; lat -= step) {
    for (let lon = -180 + step / 2; lon < 180; lon += step) {
      const x = Math.floor(((lon + 180) / 360) * w);
      const y = Math.floor(((90 - lat) / 180) * h);
      if (data[(y * w + x) * 4 + 3] > 0) dots.push([lat, lon]);
    }
  }
  return dots;
}

/** Caminho(s) SVG de um arco. Rotas que cruzam o antimeridiano viram dois trechos que saem pelas bordas. */
export function routePaths(a: City, b: City): string[] {
  const p1 = proj(a.lat, a.lon);
  const p2 = proj(b.lat, b.lon);
  const arc = (x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 - Math.min(160, dist * 0.32);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  if (Math.abs(p2.x - p1.x) <= MAP_W / 2) return [arc(p1.x, p1.y, p2.x, p2.y)];
  const shift = p2.x > p1.x ? -MAP_W : MAP_W;
  return [arc(p1.x, p1.y, p2.x + shift, p2.y), arc(p1.x - shift, p1.y, p2.x, p2.y)];
}

interface NetworkMapProps {
  cities: City[];
  routes: Route[];
  byId: Map<string, City>;
  selectedRoute: string | null;
  focusCity: string | null;
  onSelectRoute: (id: string) => void;
  onSelectCity: (id: string) => void;
}

/** Mapa-múndi pontilhado com arcos animados e partículas percorrendo as rotas. */
export function NetworkMap({ cities, routes, byId, selectedRoute, focusCity, onSelectRoute, onSelectCity }: NetworkMapProps) {
  const countries = useCountries();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [hoverRoute, setHoverRoute] = useState<string | null>(null);
  const reduced = prefersReducedMotion();

  const dots = useMemo(() => (countries ? landDots(countries, 2.1) : []), [countries]);

  // desenha os pontos no canvas, respeitando o pixel ratio e o tamanho do contêiner
  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box || dots.length === 0) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = box.clientWidth;
      const h = (w * MAP_H) / MAP_W;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      const ctx = el.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const s = w / MAP_W;
      const r = Math.max(0.7, 1.35 * s);
      ctx.fillStyle = 'rgba(108,95,81,0.6)';
      for (const [lat, lon] of dots) {
        const p = proj(lat, lon);
        ctx.beginPath();
        ctx.arc(p.x * s, p.y * s, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [dots]);

  // as linhas se desenham conforme a seção entra na tela
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-draw]'),
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          stagger: 0.015,
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'center 45%', scrub: 0.8 },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [routes, reduced]);

  const activeCity = focusCity ? byId.get(focusCity) : undefined;

  return (
    <div ref={wrap} className="relative w-full select-none overflow-hidden" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <svg
        ref={svg}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 h-full w-full overflow-hidden"
        role="group"
        aria-label="Mapa de conexões entre cidades"
      >
        <defs>
          <clipPath id="map-clip">
            <rect width={MAP_W} height={MAP_H} />
          </clipPath>
          <linearGradient id="route-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#b8743c" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#ffedd7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b8743c" stopOpacity="0.15" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g clipPath="url(#map-clip)">
          {routes.map((r) => {
            const a = byId.get(r.from);
            const b = byId.get(r.to);
            if (!a || !b) return null;
            const paths = routePaths(a, b);
            const isSel = selectedRoute === r.id;
            const isHover = hoverRoute === r.id;
            const related = !activeCity || r.from === activeCity.id || r.to === activeCity.id;
            const dim = (selectedRoute && !isSel) || !related;
            return (
              <g key={r.id} opacity={dim ? 0.18 : 1} className="transition-opacity duration-500">
                {paths.map((d, i) => (
                  <g key={i}>
                    <path
                      id={`route-${r.id}-${i}`}
                      d={d}
                      pathLength={1}
                      data-draw
                      fill="none"
                      stroke={isSel ? '#f07a2c' : 'url(#route-grad)'}
                      strokeWidth={isSel || isHover ? 2.2 : 1.1}
                      strokeDasharray="1"
                      strokeDashoffset={reduced ? 0 : 1}
                      filter={isSel ? 'url(#glow)' : undefined}
                      className="transition-[stroke-width] duration-300"
                    />
                    {!reduced && (
                      <circle r={isSel ? 3.2 : 2.2} fill={isSel ? '#fff1dd' : '#ffedd7'} filter="url(#glow)">
                        <animateMotion dur={`${3 + (r.reachK % 7) * 0.4}s`} repeatCount="indefinite" rotate="auto">
                          <mpath href={`#route-${r.id}-${i}`} />
                        </animateMotion>
                      </circle>
                    )}
                    {/* área de clique mais larga que a linha */}
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="cursor-pointer"
                      onPointerEnter={() => setHoverRoute(r.id)}
                      onPointerLeave={() => setHoverRoute(null)}
                      onClick={() => onSelectRoute(r.id)}
                    >
                      <title>{`${r.label}: ${a.name} ↔ ${b.name}`}</title>
                    </path>
                  </g>
                ))}
              </g>
            );
          })}
        </g>

        {cities.map((c) => {
          const p = proj(c.lat, c.lon);
          const isFocus = focusCity === c.id;
          const sel = selectedRoute ? routes.find((r) => r.id === selectedRoute) : undefined;
          const inSel = sel ? sel.from === c.id || sel.to === c.id : false;
          return (
            <g key={c.id} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
              {(isFocus || inSel) && <circle r={11} fill="none" stroke="#f07a2c" strokeOpacity="0.6" className="map-pulse" />}
              <circle r={isFocus || inSel ? 4.2 : 3} fill={isFocus || inSel ? '#f07a2c' : '#ffedd7'} />
              <circle r={12} fill="transparent" className="cursor-pointer" onClick={() => onSelectCity(c.id)}>
                <title>{`${c.name}, ${c.country}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
