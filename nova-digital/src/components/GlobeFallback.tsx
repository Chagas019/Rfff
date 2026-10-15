import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { City } from '../data/types';
import { useCountries } from '../hooks/useCountries';

interface GlobeFallbackProps {
  cities: City[];
  selectedId: string | null;
  reduced: boolean;
  onSelectCity: (city: City) => void;
  /** Coordenada para centralizar (por exemplo, a cidade selecionada). */
  focus?: { lat: number; lon: number } | null;
}

const SIZE = 600;

/**
 * Alternativa sem WebGL: globo vetorial (SVG, projeção ortográfica) que também gira ao arrastar
 * e permite selecionar cidades. Garante que o conteúdo continue acessível em qualquer navegador.
 */
export function GlobeFallback({ cities, selectedId, reduced, onSelectCity, focus }: GlobeFallbackProps) {
  const countries = useCountries();
  const [rotation, setRotation] = useState<[number, number]>([40, -18]);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (focus) setRotation([-focus.lon, -focus.lat]);
  }, [focus]);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!drag.current) setRotation(([l, p]) => [l + dt * 4, p]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(SIZE / 2 - 8)
        .translate([SIZE / 2, SIZE / 2])
        .rotate(rotation)
        .clipAngle(90),
    [rotation],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);

  return (
    <div className="absolute inset-0 grid place-items-center" role="img" aria-label="Globo ilustrado (modo sem WebGL)">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto max-h-full w-[min(90%,560px)] cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          drag.current = { x: e.clientX, y: e.clientY };
          setRotation(([l, p]) => [l + dx * 0.4, Math.max(-80, Math.min(80, p - dy * 0.4))]);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <defs>
          <radialGradient id="fb-sphere" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#0f1d3d" />
            <stop offset="100%" stopColor="#030303" />
          </radialGradient>
          <radialGradient id="fb-glow" r="50%">
            <stop offset="80%" stopColor="#3d7bff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3d7bff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#fb-glow)" />
        <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#fb-sphere)" stroke="#3d7bff" strokeOpacity="0.5" />
        <path d={path(graticule) ?? ''} fill="none" stroke="#ffffff" strokeOpacity="0.06" />
        {countries?.map((c, i) => (
          <path key={i} d={path(c) ?? ''} fill="#1c2a4a" stroke="#5b8fff" strokeOpacity="0.35" strokeWidth="0.6" />
        ))}
        {cities.map((c) => {
          const visible = path({ type: 'Point', coordinates: [c.lon, c.lat] });
          const p = projection([c.lon, c.lat]);
          if (!visible || !p) return null;
          const sel = c.id === selectedId;
          return (
            <g key={c.id} transform={`translate(${p[0]},${p[1]})`}>
              <circle r={sel ? 7 : 4} fill={sel ? '#ffb547' : '#8fb4ff'} />
              <circle
                r={14}
                fill="transparent"
                className="cursor-pointer"
                role="button"
                tabIndex={-1}
                aria-label={c.name}
                onClick={() => onSelectCity(c)}
              >
                <title>{`${c.name}, ${c.country}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
