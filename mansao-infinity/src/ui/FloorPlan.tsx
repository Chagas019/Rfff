import { useMemo } from 'react';
import { ROOMS, STAIR, ELEVATOR, VOIDS, POOL, LEVEL_NAMES, rectArea, type Level, type Room } from '../data/plan';
import { FURNITURE, type FurnitureItem } from '../data/furniture';
import { DOORS } from '../data/doors';
import { PAVING } from '../data/landscape';
import { useExperience } from '../store/useExperience';
import { planWalls, rotatedRect, fmtArea, fmtLen } from '../utils/plan2d';

const VIEWS = { 0: { x0: -27, x1: 24, z0: -27.5, z1: 18 }, 1: { x0: -26, x1: 22, z0: -15, z1: 13.5 } } as const;

const CATEGORY_FILL: Record<string, string> = {
  social: 'rgba(217,205,184,0.16)',
  intima: 'rgba(201,180,138,0.14)',
  servico: 'rgba(160,160,160,0.10)',
  lazer: 'rgba(143,170,190,0.14)',
  externa: 'rgba(143,170,150,0.10)',
  circulacao: 'rgba(255,255,255,0.06)',
};

/**
 * Planta baixa gerada dos mesmos dados do modelo 3D: paredes com espessura,
 * vãos, portas com sentido de abertura, janelas, mobiliário em escala, cotas,
 * escada, posição e direção da câmera. Clicar num cômodo leva a câmera até ele.
 */
export function FloorPlan({ level, compact = false, onPick }: { level: Level; compact?: boolean; onPick?: (id: string) => void }) {
  const walls = useMemo(() => planWalls(level), [level]);
  const rooms = useMemo(() => ROOMS.filter((r) => r.level === level), [level]);
  const furniture = useMemo(() => FURNITURE.filter((f) => rooms.some((r) => r.id === f.room)), [rooms]);
  const doors = useMemo(() => DOORS.filter((d) => d.level === level), [level]);
  const selected = useExperience((s) => s.selectedRoom);
  const hovered = useExperience((s) => s.hoveredRoom);
  const hoverRoom = useExperience((s) => s.hoverRoom);
  const focusRoom = useExperience((s) => s.focusRoom);
  const pose = useExperience((s) => s.pose);
  const open = useExperience((s) => s.doors);

  const pick = (id: string) => {
    focusRoom(id);
    onPick?.(id);
  };

  const VIEW = VIEWS[level];
  const view = compact ? { x0: pose.x - 13, x1: pose.x + 13, z0: pose.z - 10, z1: pose.z + 10 } : VIEW;
  const w = view.x1 - view.x0;
  const h = view.z1 - view.z0;

  return (
    <svg
      viewBox={`${view.x0} ${view.z0} ${w} ${h}`}
      className="h-full w-full select-none"
      role="group"
      aria-label={`Planta baixa — ${LEVEL_NAMES[level]}`}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <defs>
        <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0H0V1" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="0.02" />
        </pattern>
        <pattern id="hatch" width="0.6" height="0.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V0.6" stroke="rgba(255,255,255,0.18)" strokeWidth="0.05" />
        </pattern>
        <linearGradient id="poolFill" x1="0" x2="1">
          <stop offset="0" stopColor="#4fb2c4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2d7f96" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x={view.x0} y={view.z0} width={w} height={h} fill="url(#grid)" />

      {/* áreas externas do térreo */}
      {level === 0 &&
        PAVING.map((p) => <rect key={p.id} x={p.x0} y={p.z0} width={p.x1 - p.x0} height={p.z1 - p.z0} fill="rgba(217,205,184,0.07)" stroke="rgba(217,205,184,0.18)" strokeWidth={0.03} />)}
      {level === 0 && (
        <g>
          <rect x={POOL.x0} y={POOL.z0} width={POOL.x1 - POOL.x0} height={POOL.z1 - POOL.z0} fill="url(#poolFill)" stroke="#9fd8e2" strokeWidth={0.06} />
          <line x1={POOL.beachX1} y1={POOL.z0} x2={POOL.beachX1} y2={POOL.z1} stroke="#cdeef3" strokeWidth={0.04} strokeDasharray="0.2 0.15" />
          <line x1={POOL.x0} y1={POOL.z0 - 0.25} x2={POOL.x1} y2={POOL.z0 - 0.25} stroke="#cdeef3" strokeWidth={0.05} strokeDasharray="0.5 0.2" />
          {!compact && (
            <text x={POOL.x0 + 1} y={POOL.z0 - 0.7} fontSize={0.55} fill="rgba(205,238,243,0.85)" letterSpacing={0.06}>
              BORDA INFINITA
            </text>
          )}
        </g>
      )}

      {/* vazios do pavimento superior */}
      {level === 1 &&
        VOIDS.map((v) => (
          <g key={v.id}>
            <rect x={v.x0} y={v.z0} width={v.x1 - v.x0} height={v.z1 - v.z0} fill="url(#hatch)" />
            {!compact && (
              <text x={(v.x0 + v.x1) / 2} y={(v.z0 + v.z1) / 2} fontSize={0.55} fill="rgba(255,255,255,0.55)" textAnchor="middle">
                {v.label}
              </text>
            )}
          </g>
        ))}

      {/* cômodos (clicáveis) */}
      {rooms.map((rm) => (
        <RoomShape key={rm.id} rm={rm} active={rm.id === selected} hover={rm.id === hovered} compact={compact} onPick={pick} onHover={hoverRoom} />
      ))}

      {/* mobiliário em escala */}
      <g pointerEvents="none">
        {furniture.map((it) => (
          <FurnitureGlyph key={it.id} it={it} />
        ))}
      </g>

      {/* escada e elevador */}
      <g pointerEvents="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.03} fill="none">
        {Array.from({ length: STAIR.risers - 1 }, (_, i) => {
          const z = STAIR.zBottom - ((STAIR.zBottom - STAIR.zTop) / (STAIR.risers - 1)) * i;
          return <line key={i} x1={STAIR.x0} y1={z} x2={STAIR.x1} y2={z} opacity={level === 1 && i < 10 ? 0.25 : 1} />;
        })}
        <rect x={STAIR.x0} y={STAIR.zTop} width={STAIR.x1 - STAIR.x0} height={STAIR.zBottom - STAIR.zTop} />
        <path d={`M ${(STAIR.x0 + STAIR.x1) / 2} ${STAIR.zBottom - 0.3} V ${STAIR.zTop + 0.5} m -0.3 0.4 l 0.3 -0.4 l 0.3 0.4`} stroke="#e9d7b0" strokeWidth={0.06} />
        <rect x={ELEVATOR.x0 + 0.1} y={ELEVATOR.z0 + 0.1} width={ELEVATOR.x1 - ELEVATOR.x0 - 0.2} height={ELEVATOR.z1 - ELEVATOR.z0 - 0.2} />
        <path d={`M ${ELEVATOR.x0 + 0.1} ${ELEVATOR.z0 + 0.1} L ${ELEVATOR.x1 - 0.1} ${ELEVATOR.z1 - 0.1} M ${ELEVATOR.x1 - 0.1} ${ELEVATOR.z0 + 0.1} L ${ELEVATOR.x0 + 0.1} ${ELEVATOR.z1 - 0.1}`} />
      </g>

      {/* paredes */}
      <g pointerEvents="none">
        {walls.solid.map((r, i) => (
          <rect key={`s${i}`} x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill="#ece6da" />
        ))}
        {walls.glass.map((r, i) => (
          <g key={`g${i}`}>
            <rect x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill="rgba(159,216,226,0.25)" stroke="#9fd8e2" strokeWidth={0.03} />
          </g>
        ))}
        {walls.windows.map(({ rect: r, axis }, i) => (
          <g key={`w${i}`} stroke="#9fd8e2" strokeWidth={0.035}>
            <rect x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill="rgba(11,11,12,0.6)" stroke="#ece6da" strokeWidth={0.02} />
            {axis === 'x' ? <line x1={r.x0} y1={(r.z0 + r.z1) / 2} x2={r.x1} y2={(r.z0 + r.z1) / 2} /> : <line x1={(r.x0 + r.x1) / 2} y1={r.z0} x2={(r.x0 + r.x1) / 2} y2={r.z1} />}
          </g>
        ))}
      </g>

      {/* portas com sentido de abertura */}
      <g pointerEvents="none" fill="none" stroke="#e9d7b0" strokeWidth={0.035}>
        {doors.map((d) => (
          <DoorGlyph key={d.id} d={d} open={!!open[d.id]} />
        ))}
      </g>

      {/* entradas */}
      {level === 0 && !compact && (
        <g pointerEvents="none" fill="#e9d7b0" fontSize={0.5}>
          <path d="M -1 16.2 v -2.6 m -0.45 0.6 l 0.45 -0.6 l 0.45 0.6" stroke="#e9d7b0" strokeWidth={0.08} fill="none" />
          <text x={-1} y={17} textAnchor="middle" letterSpacing={0.08}>ENTRADA</text>
          <path d="M -17 16.2 v -2.6 m -0.45 0.6 l 0.45 -0.6 l 0.45 0.6" stroke="#e9d7b0" strokeWidth={0.08} fill="none" />
          <text x={-17} y={17} textAnchor="middle" letterSpacing={0.08}>VEÍCULOS</text>
        </g>
      )}

      <CameraMarker level={level} />

      {!compact && (
        <g pointerEvents="none">
          {/* norte e escala */}
          <g transform={`translate(${view.x1 - 2} ${view.z0 + 2.2})`}>
            <circle r={1} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={0.04} />
            <path d="M 0 -0.85 L 0.35 0.4 L 0 0.15 L -0.35 0.4 Z" fill="#e9d7b0" />
            <text y={-1.25} fontSize={0.5} fill="rgba(255,255,255,0.8)" textAnchor="middle">N</text>
          </g>
          <g transform={`translate(${view.x0 + 1} ${view.z1 - 1})`} fill="rgba(255,255,255,0.8)" fontSize={0.45}>
            <rect width={5} height={0.12} fill="rgba(255,255,255,0.7)" />
            <rect width={2.5} height={0.12} fill="rgba(11,11,12,1)" stroke="rgba(255,255,255,0.7)" strokeWidth={0.02} />
            <text y={-0.3}>0</text>
            <text x={5} y={-0.3} textAnchor="end">5 m</text>
          </g>
        </g>
      )}
    </svg>
  );
}

function RoomShape({ rm, active, hover, compact, onPick, onHover }: { rm: Room; active: boolean; hover: boolean; compact: boolean; onPick: (id: string) => void; onHover: (id: string | null) => void }) {
  const { x0, x1, z0, z1 } = rm.rect;
  const w = x1 - x0;
  const d = z1 - z0;
  const area = rectArea(rm.rect);
  const name = rm.short ?? rm.name;
  const big = w >= 4 && d >= 3.5;
  const fs = Math.min(0.62, Math.max(0.32, Math.min(w, d) / 7));
  return (
    <g
      role="button"
      tabIndex={compact ? -1 : 0}
      aria-label={`${rm.name}, ${fmtArea(area)}`}
      aria-pressed={active}
      onClick={() => onPick(rm.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick(rm.id);
        }
      }}
      onMouseEnter={() => onHover(rm.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(rm.id)}
      onBlur={() => onHover(null)}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      <rect
        x={x0}
        y={z0}
        width={w}
        height={d}
        fill={active ? 'rgba(233,215,176,0.28)' : hover ? 'rgba(255,255,255,0.14)' : CATEGORY_FILL[rm.category]}
        stroke={active ? '#e9d7b0' : 'transparent'}
        strokeWidth={0.08}
        strokeDasharray={rm.outdoor ? '0.3 0.2' : undefined}
      />
      {!compact && (
        <g pointerEvents="none" textAnchor="middle" fill="#f3efe7">
          <text x={x0 + w / 2} y={z0 + d / 2 - (big ? 0.2 : 0)} fontSize={fs} fontWeight={600} letterSpacing={0.02}>
            {name}
          </text>
          {big && (
            <>
              <text x={x0 + w / 2} y={z0 + d / 2 + fs * 0.95} fontSize={fs * 0.72} fill="rgba(243,239,231,0.8)">
                {fmtArea(area)}
              </text>
              <text x={x0 + w / 2} y={z0 + d / 2 + fs * 1.8} fontSize={fs * 0.62} fill="rgba(243,239,231,0.6)">
                {fmtLen(w)} × {fmtLen(d)} m
              </text>
            </>
          )}
        </g>
      )}
    </g>
  );
}

function FurnitureGlyph({ it }: { it: FurnitureItem }) {
  if (it.type === 'rug') {
    const pts = rotatedRect(it.x, it.z, it.w, it.d, it.rot ?? 0);
    return <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.03} strokeDasharray="0.15 0.1" />;
  }
  const pts = rotatedRect(it.x, it.z, it.w, it.d, it.rot ?? 0);
  const round = ['sideTable', 'plant', 'stool', 'toilet', 'boiler', 'umbrella', 'floorLamp'].includes(it.type);
  if (round) {
    return <ellipse cx={it.x} cy={it.z} rx={it.w / 2} ry={it.d / 2} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.38)" strokeWidth={0.03} />;
  }
  const extra =
    it.type === 'bed' ? (
      // travesseiros na cabeceira (−z local)
      <g transform={`translate(${it.x} ${it.z}) rotate(${-(it.rot ?? 0)})`}>
        <rect x={-it.w / 2 + 0.1} y={-it.d / 2 + 0.1} width={it.w / 2 - 0.15} height={0.35} rx={0.08} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.025} />
        <rect x={0.05} y={-it.d / 2 + 0.1} width={it.w / 2 - 0.15} height={0.35} rx={0.08} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.025} />
        <line x1={-it.w / 2} y1={-it.d / 2 + 0.7} x2={it.w / 2} y2={-it.d / 2 + 0.7} stroke="rgba(255,255,255,0.3)" strokeWidth={0.025} />
      </g>
    ) : null;
  return (
    <g>
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.38)" strokeWidth={0.03} strokeLinejoin="round" />
      {extra}
    </g>
  );
}

function DoorGlyph({ d, open }: { d: (typeof DOORS)[number]; open: boolean }) {
  const W = d.b - d.a;
  if (d.kind === 'slide') {
    const off = 0.06;
    return d.axis === 'x' ? (
      <g>
        <line x1={d.a} y1={d.at - off} x2={d.a + W / 2 + 0.05} y2={d.at - off} />
        <line x1={open ? d.a + 0.05 : d.b - W / 2 - 0.05} y1={d.at + off} x2={open ? d.a + W / 2 + 0.1 : d.b} y2={d.at + off} />
      </g>
    ) : (
      <g>
        <line x1={d.at - off} y1={d.a} x2={d.at - off} y2={d.a + W / 2 + 0.05} />
        <line x1={d.at + off} y1={open ? d.a + 0.05 : d.b - W / 2 - 0.05} x2={d.at + off} y2={open ? d.a + W / 2 + 0.1 : d.b} />
      </g>
    );
  }
  if (d.kind === 'garage') {
    return d.axis === 'x' ? <line x1={d.a} y1={d.at} x2={d.b} y2={d.at} strokeDasharray="0.3 0.2" strokeWidth={0.06} opacity={open ? 0.35 : 1} /> : null;
  }
  // portas de giro / pivotante / dupla: folha + arco de abertura
  const leaves: { len: number; dirU: number }[] = [];
  if (d.kind === 'double') {
    leaves.push({ len: W / 2, dirU: 1 }, { len: W / 2, dirU: -1 });
  } else {
    leaves.push({ len: d.kind === 'pivot' ? W - 0.75 : W, dirU: d.hinge === 'a' ? 1 : -1 });
  }
  return (
    <g>
      {leaves.map((lf, i) => {
        const hingeU = d.kind === 'pivot' ? d.a + 0.75 : lf.dirU > 0 ? d.a : d.b;
        const n = d.swing; // lado da abertura (normal)
        const H = d.axis === 'x' ? [hingeU, d.at] : [d.at, hingeU];
        const closedEnd = d.axis === 'x' ? [hingeU + lf.dirU * lf.len, d.at] : [d.at, hingeU + lf.dirU * lf.len];
        const openEnd = d.axis === 'x' ? [hingeU, d.at + n * lf.len] : [d.at + n * lf.len, hingeU];
        const sweep = (d.axis === 'x' ? lf.dirU * n : -lf.dirU * n) > 0 ? 1 : 0;
        const leafEnd = open ? openEnd : closedEnd;
        return (
          <g key={i}>
            <line x1={H[0]} y1={H[1]} x2={leafEnd[0]} y2={leafEnd[1]} strokeWidth={0.06} />
            <path d={`M ${closedEnd[0]} ${closedEnd[1]} A ${lf.len} ${lf.len} 0 0 ${sweep} ${openEnd[0]} ${openEnd[1]}`} strokeWidth={0.025} strokeDasharray="0.12 0.08" opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
}

/** Posição e direção atuais da câmera sobre a planta. */
function CameraMarker({ level }: { level: Level }) {
  const pose = useExperience((s) => s.pose);
  const mode = useExperience((s) => s.mode);
  if (mode === 'walk' && pose.level !== level) return null;
  const deg = (-pose.heading * 180) / Math.PI;
  const inside = pose.x > -60 && pose.x < 60;
  if (!inside) return null;
  return (
    <g transform={`translate(${pose.x} ${pose.z}) rotate(${deg})`} pointerEvents="none" aria-hidden="true">
      <path d="M 0 0 L -2.2 -4.2 A 4.8 4.8 0 0 1 2.2 -4.2 Z" fill="rgba(233,215,176,0.22)" />
      <circle r={0.45} fill="#e9d7b0" stroke="#0b0b0c" strokeWidth={0.12} />
    </g>
  );
}
