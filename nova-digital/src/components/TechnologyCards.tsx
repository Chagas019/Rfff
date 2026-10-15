import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface TechItem {
  id: string;
  index: string;
  tag: string;
  title: string;
  short: string;
  details: string;
  specs: string[];
  visual: ReactNode;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/** Card com perspectiva que segue o cursor, borda luminosa, texto revelado e retorno ao clique. */
export function TechnologyCard({ item }: { item: TechItem }) {
  const ref = useRef<HTMLElement>(null);
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced = useReducedMotion();
  const tilt = canHover && !reduced;
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const detailsId = useId();

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-11, 11]), { stiffness: 180, damping: 20 });
  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${glowX} ${glowY}, rgba(61,123,255,0.16), transparent 45%)`;
  const borderLight = useMotionTemplate`radial-gradient(260px circle at ${glowX} ${glowY}, rgba(143,180,255,0.9), rgba(255,181,71,0.35) 35%, transparent 60%)`;

  const revealed = open || hovered;

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  const onClick = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      const id = Date.now();
      setRipples((list) => [...list, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
      window.setTimeout(() => setRipples((list) => list.filter((x) => x.id !== id)), 900);
    }
    setOpen((o) => !o);
  };

  return (
    <motion.article
      ref={ref}
      data-tech-card
      onPointerMove={tilt ? onMove : undefined}
      onPointerEnter={() => canHover && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        mx.set(0.5);
        my.set(0.5);
      }}
      style={tilt ? { rotateX: rx, rotateY: ry, transformPerspective: 1000 } : undefined}
      whileTap={{ scale: 0.985 }}
      className={`group relative flex min-h-[440px] flex-col overflow-hidden rounded-[22px] border bg-gradient-to-b from-void-800 to-void-900 p-6 transition-colors duration-500 sm:p-7 [transform-style:preserve-3d] ${
        open ? 'border-amber-glow/40' : 'border-white/[0.07]'
      }`}
    >
      {/* luz que segue o cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
        aria-hidden
      />
      {/* borda luminosa */}
      <motion.div
        className="tech-border pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: borderLight }}
        aria-hidden
      />

      <div className="relative flex items-center justify-between [transform:translateZ(30px)]">
        <span className="font-mono text-[11px] text-ink-mute">{item.index}</span>
        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          {item.tag}
        </span>
      </div>

      <div className="relative my-6 grid flex-1 place-items-center [transform:translateZ(60px)]" aria-hidden>
        <div
          className={`tech-visual h-36 w-36 transition-transform duration-700 ease-expo ${revealed ? 'scale-110' : ''}`}
          data-active={revealed}
        >
          {item.visual}
        </div>
      </div>

      <div className="relative [transform:translateZ(40px)]">
        <h3 className="text-[1.65rem] font-light leading-tight tracking-tight text-ink">{item.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{item.short}</p>

        <div
          id={detailsId}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-expo ${revealed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className="overflow-hidden">
            <p className="mt-4 text-sm leading-relaxed text-ink-mute">{item.details}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.specs.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* botão que cobre o card: clique/toque fixa os detalhes abertos */}
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-controls={detailsId}
        aria-label={`${open ? 'Recolher' : 'Ver'} detalhes de ${item.title}`}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-offset-[-3px]"
      >
        <span
          className={`absolute bottom-6 right-6 grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink-soft transition-transform duration-500 ease-expo sm:bottom-7 sm:right-7 ${
            open ? 'rotate-45 border-amber-glow/60 text-amber-glow' : ''
          }`}
          aria-hidden
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>

      {ripples.map((r) => (
        <span
          key={r.id}
          className="tech-ripple pointer-events-none absolute z-0 h-10 w-10 rounded-full"
          style={{ left: r.x - 20, top: r.y - 20 }}
          aria-hidden
        />
      ))}
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Visuais animados de cada card                                       */
/* ------------------------------------------------------------------ */

export function NeuralVisual() {
  const nodes: Array<[number, number]> = [
    [20, 30],
    [20, 70],
    [20, 110],
    [70, 20],
    [70, 60],
    [70, 100],
    [70, 130],
    [120, 45],
    [120, 95],
  ];
  const edges: Array<[number, number]> = [
    [0, 3],
    [0, 4],
    [1, 4],
    [1, 5],
    [2, 5],
    [2, 6],
    [1, 3],
    [3, 7],
    [4, 7],
    [4, 8],
    [5, 8],
    [6, 8],
    [5, 7],
  ];
  return (
    <svg viewBox="0 0 140 150" className="h-full w-full">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="#5b8fff"
          strokeOpacity="0.35"
          strokeWidth="0.8"
          className="neural-edge"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i > 6 ? 5 : 3.2}
          fill={i > 6 ? '#ffb547' : '#eaf1ff'}
          className="neural-node"
          style={{ animationDelay: `${i * 0.21}s` }}
        />
      ))}
    </svg>
  );
}

export function CubeVisual() {
  return (
    <div className="cube-scene grid h-full w-full place-items-center">
      <div className="cube">
        {['front', 'back', 'right', 'left', 'top', 'bottom'].map((f) => (
          <span key={f} className={`cube-face cube-${f}`} />
        ))}
      </div>
    </div>
  );
}

export function OrbitVisual() {
  return (
    <svg viewBox="0 0 150 150" className="h-full w-full">
      <circle cx="75" cy="75" r="16" fill="#3d7bff" fillOpacity="0.25" stroke="#8fb4ff" strokeOpacity="0.8" />
      <circle cx="75" cy="75" r="5" fill="#eaf1ff" />
      {[34, 52, 70].map((r, i) => (
        <g key={r} className="orbit-ring" style={{ animationDuration: `${8 + i * 5}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}>
          <ellipse
            cx="75"
            cy="75"
            rx={r}
            ry={r * 0.42}
            fill="none"
            stroke="#a1a1aa"
            strokeOpacity="0.3"
            strokeDasharray="2 4"
            transform={`rotate(${i * 35 - 20} 75 75)`}
          />
          <circle
            cx={75 + r * Math.cos((i * 35 - 20) * (Math.PI / 180))}
            cy={75 + r * Math.sin((i * 35 - 20) * (Math.PI / 180))}
            r="3"
            fill={i === 1 ? '#ffb547' : '#8fb4ff'}
          />
        </g>
      ))}
    </svg>
  );
}

export function LayersVisual() {
  return (
    <div className="layers-scene relative h-full w-full">
      {[0, 1, 2].map((i) => (
        <span key={i} className="layer-plane" style={{ ['--i' as string]: i }} />
      ))}
    </div>
  );
}
