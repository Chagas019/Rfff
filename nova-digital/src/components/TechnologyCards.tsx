import { Plus } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

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

/**
 * Card de serviço no sistema ORYZO: contorno tracejado, raio 12px, padding 24px, sem sombra nem brilho.
 * Os detalhes aparecem ao passar o cursor/focar e ficam fixos com clique ou toque.
 */
export function TechnologyCard({ item }: { item: TechItem }) {
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const detailsId = useId();
  const revealed = open || hovered;

  return (
    <article
      data-tech-card
      onPointerEnter={() => canHover && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={`relative flex min-h-[440px] flex-col rounded-card border border-dashed p-6 transition-colors duration-500 ${
        open ? 'border-ink/70 bg-bark' : 'border-cork hover:border-driftwood'
      }`}
    >
      <div className="flex items-center justify-between text-[12px] uppercase">
        <span className="text-ember">{item.index}</span>
        <span className="text-ink-mute">{item.tag}</span>
      </div>

      <div className="my-6 grid flex-1 place-items-center" aria-hidden>
        <div className="tech-visual h-36 w-36" data-active={revealed}>
          {item.visual}
        </div>
      </div>

      <div className="border-t border-dashed border-cork pt-5">
        <h3 className="text-[24px] font-medium uppercase leading-[1.09] text-ink">{item.title}</h3>
        <p className="mt-3 text-[16px] font-normal normal-case leading-[1.4] text-ink-soft">{item.short}</p>

        <div
          id={detailsId}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-expo ${revealed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className="overflow-hidden">
            <p className="mt-4 text-[15px] font-normal normal-case leading-[1.45] text-ink-mute">{item.details}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.specs.map((s) => (
                <li key={s} className="rounded-ghost border border-cork px-3 py-1.5 text-[12px] uppercase text-ink-soft">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* o card inteiro é clicável: clique/toque fixa os detalhes abertos */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        aria-label={`${open ? 'Recolher' : 'Ver'} detalhes de ${item.title}`}
        className="absolute inset-0 z-10 rounded-card focus-visible:outline-offset-[-3px]"
      >
        <span
          className={`absolute right-6 top-14 grid h-9 w-9 place-items-center rounded-full border transition-transform duration-500 ease-expo ${
            open ? 'rotate-45 border-ink bg-ink text-walnut' : 'border-cork text-ink-soft'
          }`}
          aria-hidden
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Visuais animados de cada card                                       */
/* ------------------------------------------------------------------ */

export function NeuralVisual() {
  const campaigns: Array<[number, number]> = [
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
          x1={campaigns[a][0]}
          y1={campaigns[a][1]}
          x2={campaigns[b][0]}
          y2={campaigns[b][1]}
          stroke="#e8b48a"
          strokeOpacity="0.35"
          strokeWidth="0.8"
          className="neural-edge"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
      {campaigns.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i > 6 ? 5 : 3.2}
          fill={i > 6 ? '#f07a2c' : '#ffedd7'}
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
      <circle cx="75" cy="75" r="16" fill="#b8743c" fillOpacity="0.25" stroke="#ffedd7" strokeOpacity="0.8" />
      <circle cx="75" cy="75" r="5" fill="#ffedd7" />
      {[34, 52, 70].map((r, i) => (
        <g key={r} className="orbit-ring" style={{ animationDuration: `${8 + i * 5}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}>
          <ellipse
            cx="75"
            cy="75"
            rx={r}
            ry={r * 0.42}
            fill="none"
            stroke="#6c5f51"
            strokeOpacity="0.3"
            strokeDasharray="2 4"
            transform={`rotate(${i * 35 - 20} 75 75)`}
          />
          <circle
            cx={75 + r * Math.cos((i * 35 - 20) * (Math.PI / 180))}
            cy={75 + r * Math.sin((i * 35 - 20) * (Math.PI / 180))}
            r="3"
            fill={i === 1 ? '#f07a2c' : '#ffedd7'}
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
