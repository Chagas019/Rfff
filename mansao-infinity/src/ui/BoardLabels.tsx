import { useMemo } from 'react';
import { roomById } from '../data/plan';
import { useBoardLabels } from '../store/boardLabels';
import { useExperience } from '../store/useExperience';

const GAP = 30;

/**
 * Legendas da prancha em duas colunas (esquerda e direita do desenho), com
 * linhas de chamada até o centro de cada cômodo — o arranjo das pranchas de
 * apresentação de arquitetura. As âncoras vêm projetadas do canvas 3D.
 */
export function BoardLabels() {
  const anchors = useBoardLabels((s) => s.anchors);
  const bounds = useBoardLabels((s) => s.bounds);
  const theme = useExperience((s) => s.boardTheme);
  const show = useExperience((s) => s.boardLabels);
  const selectRoom = useExperience((s) => s.selectRoom);
  const hoverRoom = useExperience((s) => s.hoverRoom);
  const ink = theme === 'light' ? '#1b1c1f' : '#f3efe7';

  const layout = useMemo(() => {
    const vis = anchors.filter((a) => a.visible);
    if (!vis.length) return [];
    const W = window.innerWidth;
    const H = window.innerHeight;
    const minX = bounds?.minX ?? Math.min(...vis.map((a) => a.x));
    const maxX = bounds?.maxX ?? Math.max(...vis.map((a) => a.x));
    const cx = (minX + maxX) / 2;
    const leftX = Math.max(170, minX - 36);
    const rightX = Math.min(W - 170, maxX + 36);
    const place = (list: typeof vis) => {
      const sorted = [...list].sort((a, b) => a.y - b.y);
      const ys = sorted.map((a) => a.y);
      for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + GAP);
      const overflow = ys.length ? ys[ys.length - 1] - (H - 130) : 0;
      if (overflow > 0) for (let i = 0; i < ys.length; i++) ys[i] -= overflow;
      for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - GAP);
      return sorted.map((a, i) => ({ a, y: ys[i] }));
    };
    return [
      ...place(vis.filter((a) => a.x < cx)).map((p) => ({ ...p, side: 'l' as const, col: leftX })),
      ...place(vis.filter((a) => a.x >= cx)).map((p) => ({ ...p, side: 'r' as const, col: rightX })),
    ];
  }, [anchors, bounds]);

  // em telas estreitas as colunas não cabem: os cômodos seguem clicáveis pelo índice e pelo desenho
  if (!show || !layout.length || window.innerWidth < 900) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-label="Legendas da prancha">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {layout.map(({ a, y, side, col }) => {
          const knee = side === 'l' ? col + 18 : col - 18;
          return <polyline key={a.id} points={`${a.x},${a.y} ${knee},${y} ${col},${y}`} fill="none" stroke={ink} strokeOpacity={0.7} strokeWidth={1} />;
        })}
      </svg>
      {layout.map(({ a, y, side, col }) => {
        const rm = roomById(a.id);
        if (!rm) return null;
        return (
          <button
            key={a.id}
            onClick={() => selectRoom(a.id)}
            onMouseEnter={() => hoverRoom(a.id)}
            onMouseLeave={() => hoverRoom(null)}
            className="pointer-events-auto absolute whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.16em] transition-opacity hover:opacity-60"
            style={{ color: ink, top: y - 6, ...(side === 'l' ? { right: window.innerWidth - col + 8, textAlign: 'right' } : { left: col + 8 }) }}
          >
            {rm.short && rm.short.length > 3 && rm.name.length > 18 ? rm.short : rm.name}
          </button>
        );
      })}
    </div>
  );
}
