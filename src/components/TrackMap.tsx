import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useId, useMemo } from 'react';
import { cornerSegments, trackBounds, trackPath } from '../utils/track';

interface Props {
  points: [number, number][];
  name: string;
  color?: string;
  animated?: boolean;
  /** inclina a maquete acompanhando o ponteiro (desligado nas miniaturas) */
  interactive?: boolean;
  className?: string;
}

const BASE_TILT = 36; // graus: maquete "deitada", vista de cima e de frente
const SLAB_PAD = 7; // margem da base em volta da pista
const SLAB_DEPTH = 5; // camadas da espessura da base
const ROAD_DEPTH = 3; // camadas da espessura do asfalto
const TRAIL = [0, 0.07, 0.14, 0.21]; // atraso (s) de cada ponto do rastro do carro

/**
 * Maquete do circuito em relevo suave: base com espessura e quadriculado, pista real com
 * espessura, bordas brancas, zebras vermelhas e brancas nas curvas, asfalto iluminado,
 * linha de corrida dourada, grid de largada, seta do sentido de corrida e um carro com rastro de luz.
 */
export function TrackMap({ points, name, color = '#EDB40B', animated = true, interactive = true, className = '' }: Props) {
  const reduce = useReducedMotion();
  const d = useMemo(() => trackPath(points, 0.25), [points]);
  const kerbs = useMemo(() => cornerSegments(points), [points]);
  const b = useMemo(() => trackBounds(points), [points]);
  const id = useId().replace(/:/g, '');
  const move = animated && !reduce;
  const tiltable = interactive && !reduce;

  const rx = useMotionValue(BASE_TILT);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 110, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 110, damping: 18 });

  const slab = { x: b.minX - SLAB_PAD, y: b.minY - SLAB_PAD, w: b.maxX - b.minX + SLAB_PAD * 2, h: b.maxY - b.minY + SLAB_PAD * 2 };

  // linha de chegada e seta do sentido, alinhadas com o primeiro trecho
  const [sx, sy] = points[0];
  const ahead = points[Math.min(2, points.length - 1)];
  const heading = (Math.atan2(ahead[1] - sy, ahead[0] - sx) * 180) / Math.PI;
  const arrowAt = points[Math.min(Math.round(points.length * 0.06) + 2, points.length - 1)];
  const arrowNext = points[Math.min(Math.round(points.length * 0.06) + 4, points.length - 1)];
  const arrowHeading = (Math.atan2(arrowNext[1] - arrowAt[1], arrowNext[0] - arrowAt[0]) * 180) / Math.PI;

  return (
    <div
      className={className}
      style={{ perspective: 1200 }}
      onPointerMove={tiltable ? (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        rx.set(BASE_TILT - ((e.clientY - r.top) / r.height - 0.5) * 16);
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 18);
      } : undefined}
      onPointerLeave={tiltable ? () => { rx.set(BASE_TILT); ry.set(0); } : undefined}
    >
      <motion.svg
        viewBox="-4 -4 108 114"
        className="h-full w-full overflow-visible"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        role="img"
        aria-label={`Maquete do traçado de ${name}`}
      >
        <defs>
          <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`soft${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={`floor${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <linearGradient id={`slab${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1d2540" />
            <stop offset="1" stopColor="#10162a" />
          </linearGradient>
          <linearGradient id={`asphalt${id}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#626c8e" />
            <stop offset="0.5" stopColor="#3d4560" />
            <stop offset="1" stopColor="#272d44" />
          </linearGradient>
          <pattern id={`grid${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M5 0H0V5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
          </pattern>
          <radialGradient id={`light${id}`} cx="30%" cy="20%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sombra da maquete no chão */}
        <rect x={slab.x + 2} y={slab.y + 6} width={slab.w} height={slab.h} rx="6" fill="#000" opacity="0.6" filter={`url(#floor${id})`} />
        {/* espessura da base */}
        {Array.from({ length: SLAB_DEPTH }, (_, i) => SLAB_DEPTH - i).map((k) => (
          <rect key={k} x={slab.x} y={slab.y + k * 0.6} width={slab.w} height={slab.h} rx="6" fill={`hsl(226 30% ${6 + (SLAB_DEPTH - k) * 1.2}%)`} />
        ))}
        {/* tampo da base: degradê, quadriculado, luz e brilho na borda */}
        <rect x={slab.x} y={slab.y} width={slab.w} height={slab.h} rx="6" fill={`url(#slab${id})`} />
        <rect x={slab.x} y={slab.y} width={slab.w} height={slab.h} rx="6" fill={`url(#grid${id})`} />
        <rect x={slab.x} y={slab.y} width={slab.w} height={slab.h} rx="6" fill={`url(#light${id})`} />
        <rect x={slab.x + 0.2} y={slab.y + 0.2} width={slab.w - 0.4} height={slab.h - 0.4} rx="5.8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />

        {/* sombra da pista sobre a base */}
        <path d={d} transform="translate(1 2.2)" fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="6.6" strokeLinejoin="round" filter={`url(#soft${id})`} />
        {/* espessura do asfalto */}
        {Array.from({ length: ROAD_DEPTH }, (_, i) => ROAD_DEPTH - i).map((k) => (
          <path key={k} d={d} transform={`translate(0 ${(k * 0.45).toFixed(2)})`} fill="none" stroke={`hsl(226 22% ${14 + (ROAD_DEPTH - k) * 3}%)`} strokeWidth="6.4" strokeLinejoin="round" />
        ))}
        {/* bordas brancas e zebras nas curvas */}
        <path d={d} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="6.4" strokeLinejoin="round" />
        {kerbs.map((pts, i) => (
          <g key={i}>
            <polyline points={pts} fill="none" stroke="#fff" strokeWidth="6.9" strokeLinejoin="round" strokeLinecap="butt" />
            <polyline points={pts} fill="none" stroke="#E10600" strokeWidth="6.9" strokeLinejoin="round" strokeLinecap="butt" strokeDasharray="0.9 0.9" />
          </g>
        ))}
        {/* asfalto iluminado */}
        <path d={d} fill="none" stroke={`url(#asphalt${id})`} strokeWidth="5.8" strokeLinejoin="round" />
        <path d={d} transform="translate(-0.2 -0.3)" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" strokeLinejoin="round" />

        {/* linha de corrida */}
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#glow${id})`}
          initial={move ? { pathLength: 0 } : false}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />

        {/* linha de chegada quadriculada + grid de largada */}
        <g transform={`translate(${sx} ${sy}) rotate(${heading.toFixed(1)})`}>
          {[-2.4, -1.2, 0, 1.2].map((y, i) => (
            <g key={y}>
              <rect x={-0.6} y={y} width="0.6" height="1.2" fill={i % 2 ? '#fff' : '#111'} />
              <rect x={0} y={y} width="0.6" height="1.2" fill={i % 2 ? '#111' : '#fff'} />
            </g>
          ))}
          {[1, 2, 3].map((k) => (
            <g key={k} opacity={0.75 - k * 0.15}>
              <rect x={-1.4 - k * 1.6} y={-1.9} width="0.9" height="0.25" fill="#fff" />
              <rect x={-2.2 - k * 1.6} y={0.9} width="0.9" height="0.25" fill="#fff" />
            </g>
          ))}
        </g>
        {/* sentido de corrida */}
        <g transform={`translate(${arrowAt[0]} ${arrowAt[1]}) rotate(${arrowHeading.toFixed(1)})`} opacity="0.9">
          <path d="M-1 -1.1 L0.6 0 L-1 1.1" fill="none" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0.4 -1.1 L2 0 L0.4 1.1" fill="none" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </g>

        {/* carro com rastro de luz */}
        {move && TRAIL.map((delay, i) => (
          <circle key={i} r={1.35 - i * 0.25} fill={i === 0 ? '#fff' : color} opacity={1 - i * 0.22} filter={i === 0 ? `url(#glow${id})` : undefined}>
            <animateMotion dur="8s" begin={`${delay}s`} repeatCount="indefinite" path={d} />
          </circle>
        ))}
      </motion.svg>
    </div>
  );
}
