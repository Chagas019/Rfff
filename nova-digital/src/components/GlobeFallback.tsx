import { geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
import { useEffect, useRef } from 'react';
import type { City } from '../data/types';
import { useCountries } from '../hooks/useCountries';
import { useInView } from '../hooks/useInView';

interface GlobeFallbackProps {
  cities: City[];
  selectedId: string | null;
  /** Mantido por compatibilidade: o globo vetorial já não tem rotação automática. */
  reduced?: boolean;
  onSelectCity: (city: City) => void;
  /** Coordenada para centralizar (por exemplo, a cidade selecionada). */
  focus?: { lat: number; lon: number } | null;
}

const COLORS = {
  sphereFill: '#1a1009',
  sphereStroke: '#40372e',
  graticule: 'rgba(255, 237, 215, 0.05)',
  land: '#3a2a1c',
  border: 'rgba(255, 237, 215, 0.22)',
  city: '#ffedd7',
  selected: '#dc5000',
};

/**
 * Alternativa sem WebGL: globo vetorial desenhado em canvas 2D (projeção ortográfica).
 * Pode ser arrastado e permite escolher cidades. É leve de propósito: este modo
 * aparece justamente em aparelhos e navegadores mais limitados.
 */
export function GlobeFallback({ cities, selectedId, onSelectCity, focus }: GlobeFallbackProps) {
  const countries = useCountries();
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const visible = useInView(box, '100px');
  const rotation = useRef<[number, number]>([40, -18]);
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const projRef = useRef<GeoProjection | null>(null);
  const dirty = useRef(true);

  useEffect(() => {
    if (focus) {
      rotation.current = [-focus.lon, -focus.lat];
      dirty.current = true;
    }
  }, [focus]);

  useEffect(() => {
    const el = canvas.current;
    const wrap = box.current;
    if (!el || !wrap || !visible) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const graticule = geoGraticule10();
    let raf = 0;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.max(120, Math.min(wrap.clientWidth * 0.9, wrap.clientHeight * 0.9, 560));
      if (el.width !== Math.round(size * dpr)) {
        el.width = Math.round(size * dpr);
        el.height = Math.round(size * dpr);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const projection = geoOrthographic()
        .scale(size / 2 - 4)
        .translate([size / 2, size / 2])
        .rotate(rotation.current)
        .clipAngle(90);
      projRef.current = projection;
      const path = geoPath(projection, ctx);

      ctx.beginPath();
      path({ type: 'Sphere' });
      ctx.fillStyle = COLORS.sphereFill;
      ctx.fill();
      ctx.strokeStyle = COLORS.sphereStroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = COLORS.graticule;
      ctx.stroke();

      if (countries) {
        ctx.beginPath();
        for (const c of countries) path(c);
        ctx.fillStyle = COLORS.land;
        ctx.fill();
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      const visibility = geoPath(projection);
      for (const c of cities) {
        // só desenha cidades do lado visível
        if (!visibility({ type: 'Point', coordinates: [c.lon, c.lat] })) continue;
        const p = projection([c.lon, c.lat]);
        if (!p) continue;
        const sel = c.id === selectedId;
        ctx.beginPath();
        ctx.arc(p[0], p[1], sel ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = sel ? COLORS.selected : COLORS.city;
        ctx.fill();
      }
      dirty.current = false;
    };

    // Sem rotação automática: aparelhos sem WebGL costumam desenhar a página em software,
    // e redesenhar o globo continuamente travaria a rolagem. Ele só redesenha ao ser arrastado.
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (dirty.current) draw();
    };
    draw();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, countries, cities, selectedId]);

  const pickCity = (clientX: number, clientY: number) => {
    const el = canvas.current;
    const projection = projRef.current;
    if (!el || !projection) return;
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const visibility = geoPath(projection);
    let best: { city: City; d: number } | null = null;
    for (const c of cities) {
      if (!visibility({ type: 'Point', coordinates: [c.lon, c.lat] })) continue;
      const p = projection([c.lon, c.lat]);
      if (!p) continue;
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < 18 && (!best || d < best.d)) best = { city: c, d };
    }
    if (best) onSelectCity(best.city);
  };

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <canvas
        ref={canvas}
        role="img"
        aria-label="Globo ilustrado (modo sem WebGL)"
        className="max-h-full max-w-full cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          d.x = e.clientX;
          d.y = e.clientY;
          d.moved += Math.abs(dx) + Math.abs(dy);
          const [l, p] = rotation.current;
          rotation.current = [l + dx * 0.4, Math.max(-80, Math.min(80, p - dy * 0.4))];
          dirty.current = true;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && d.moved < 6) pickCity(e.clientX, e.clientY);
        }}
        onPointerCancel={() => (drag.current = null)}
      />
    </div>
  );
}
