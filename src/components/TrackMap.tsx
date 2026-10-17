import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useId, useMemo } from 'react';
import { trackPath } from '../utils/track';

interface Props {
  points: [number, number][];
  name: string;
  color?: string;
  animated?: boolean;
  /** inclina a pista acompanhando o ponteiro (desligado nas miniaturas) */
  interactive?: boolean;
  className?: string;
}

const BASE_TILT = 34; // graus: pista "deitada" como uma maquete vista de cima
const LAYERS = 6; // camadas da espessura do asfalto
const DEPTH = 0.55; // altura de cada camada

/**
 * Traçado real do circuito em relevo suave: maquete inclinada com espessura, sombra no chão,
 * luz vindo de cima à esquerda, linha dourada desenhada ao aparecer e um carro percorrendo a volta.
 */
export function TrackMap({ points, name, color = '#EDB40B', animated = true, interactive = true, className = '' }: Props) {
  const reduce = useReducedMotion();
  const d = useMemo(() => trackPath(points, 0.35), [points]);
  const id = useId().replace(/:/g, '');
  const move = animated && !reduce;
  const tiltable = interactive && !reduce;

  const rx = useMotionValue(BASE_TILT);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 120, damping: 18 });

  // linha de chegada: pequeno quadriculado alinhado com o primeiro trecho
  const [sx, sy] = points[0];
  const [nx, ny] = points[1] ?? points[0];
  const startAngle = (Math.atan2(ny - sy, nx - sx) * 180) / Math.PI + 90;

  return (
    <div
      className={className}
      style={{ perspective: 1100 }}
      onPointerMove={tiltable ? (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        rx.set(BASE_TILT - ((e.clientY - r.top) / r.height - 0.5) * 14);
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 16);
      } : undefined}
      onPointerLeave={tiltable ? () => { rx.set(BASE_TILT); ry.set(0); } : undefined}
    >
      <motion.svg
        viewBox="-3 -4 106 112"
        className="h-full w-full overflow-visible"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        role="img"
        aria-label={`Traçado de ${name}`}
      >
        <defs>
          <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`shadow${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          {/* luz de cima à esquerda sobre o asfalto */}
          <linearGradient id={`asphalt${id}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5d6788" />
            <stop offset="0.55" stopColor="#3a425c" />
            <stop offset="1" stopColor="#262c42" />
          </linearGradient>
          <radialGradient id={`ground${id}`} cx="50%" cy="55%" r="55%">
            <stop offset="0" stopColor={color} stopOpacity="0.14" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* chão: brilho suave sob a maquete */}
        <ellipse cx="50" cy="54" rx="56" ry="50" fill={`url(#ground${id})`} />
        {/* sombra projetada no chão */}
        <path d={d} transform="translate(2 5.4)" fill="none" stroke="#000" strokeOpacity="0.65" strokeWidth="7" strokeLinejoin="round" filter={`url(#shadow${id})`} />
        {/* espessura: camadas mais escuras empilhadas para baixo */}
        {Array.from({ length: LAYERS }, (_, i) => LAYERS - i).map((k) => (
          <path key={k} d={d} transform={`translate(0 ${(k * DEPTH).toFixed(2)})`} fill="none" stroke={`hsl(226 24% ${12 + (LAYERS - k) * 2.2}%)`} strokeWidth="6.4" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* bordas brancas (como zebras) e superfície da pista */}
        <path d={d} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="6.4" strokeLinejoin="round" strokeLinecap="round" />
        <path d={d} fill="none" stroke={`url(#asphalt${id})`} strokeWidth="5.8" strokeLinejoin="round" strokeLinecap="round" />
        {/* reflexo na borda iluminada */}
        <path d={d} transform="translate(-0.25 -0.35)" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.35" strokeLinejoin="round" />
        {/* linha de corrida */}
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="0.9"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#glow${id})`}
          initial={move ? { pathLength: 0 } : false}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
        {/* linha de chegada quadriculada */}
        <g transform={`translate(${sx} ${sy}) rotate(${startAngle.toFixed(1)})`}>
          {[-2.4, -1.2, 0, 1.2].map((x, i) => (
            <rect key={x} x={x} y={i % 2 ? -0.6 : 0} width="1.2" height="0.6" fill={i % 2 ? '#fff' : '#111'} />
          ))}
          {[-2.4, -1.2, 0, 1.2].map((x, i) => (
            <rect key={`b${x}`} x={x} y={i % 2 ? 0 : -0.6} width="1.2" height="0.6" fill={i % 2 ? '#111' : '#fff'} />
          ))}
        </g>
        {move && (
          <circle r="1.5" fill="#fff" filter={`url(#glow${id})`}>
            <animateMotion dur="7s" repeatCount="indefinite" path={d} />
          </circle>
        )}
      </motion.svg>
    </div>
  );
}
