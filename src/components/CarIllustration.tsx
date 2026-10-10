import { useReducedMotion } from 'framer-motion';
import { useId } from 'react';

interface Props {
  color?: string;
  accent?: string;
  number?: string | number;
  speed?: boolean;
  className?: string;
  title?: string;
}

/**
 * Ilustração ORIGINAL de um carro de F1 em vista lateral (SVG vetorial).
 * Não representa o carro oficial de nenhuma equipe — as cores apenas fazem
 * referência à identidade da equipe.
 */
export function CarIllustration({ color = '#e10600', accent = '#ffffff', number, speed = false, className, title = 'Ilustração de um carro de Fórmula 1' }: Props) {
  const reduce = useReducedMotion();
  const animate = speed && !reduce;
  const uid = useId().replace(/:/g, '');
  const body = `body-${uid}`;
  const shine = `shine-${uid}`;
  const glow = `glow-${uid}`;
  return (
    <svg viewBox="0 0 900 260" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="0.55" stopColor={color} stopOpacity="0.85" />
          <stop offset="1" stopColor="#0a0a0e" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* luz no chão */}
      <ellipse cx="450" cy="232" rx="420" ry="20" fill={`url(#${glow})`} />
      <ellipse cx="450" cy="236" rx="360" ry="8" fill="#000" opacity="0.7" />

      {animate && (
        <g stroke={color} strokeLinecap="round" opacity="0.7">
          {[60, 95, 130, 165, 200].map((y, i) => (
            <line key={y} x1={-40 - i * 30} y1={y} x2={60 - i * 10} y2={y} strokeWidth={i % 2 ? 2 : 3}>
              <animate attributeName="x1" values={`${-40 - i * 30};${-140 - i * 30};${-40 - i * 30}`} dur={`${0.6 + i * 0.1}s`} repeatCount="indefinite" />
            </line>
          ))}
        </g>
      )}

      {/* asa traseira */}
      <g>
        <rect x="40" y="38" width="16" height="122" rx="3" fill="#15151c" stroke="#2e2e3a" />
        <path d="M44 42 L150 46 L150 62 L44 60 Z" fill={color} />
        <path d="M48 66 L146 68 L146 78 L48 77 Z" fill="#1d1d26" />
        <rect x="130" y="78" width="8" height="70" fill="#15151c" />
        <path d="M44 42 L150 46" stroke={accent} strokeWidth="2" opacity="0.8" />
      </g>

      {/* assoalho */}
      <path d="M110 192 L760 196 L760 204 L120 202 Z" fill="#0c0c10" />
      <path d="M140 203 L740 205" stroke={color} strokeWidth="2" opacity="0.9" />

      {/* chassi */}
      <path
        d="M95 182 L95 142 L165 128 L250 112 L296 82 Q318 60 348 66 L364 72 L384 100 L446 106 L478 112 L566 128 L706 150 L826 166 Q846 172 838 182 L706 188 L560 192 L300 194 L160 192 Z"
        fill={`url(#${body})`}
        stroke="#000"
        strokeOpacity="0.5"
      />
      {/* tomada de ar */}
      <path d="M318 74 Q332 62 348 68 L352 84 L326 86 Z" fill="#0b0b0f" />
      {/* sidepod */}
      <path d="M248 156 Q296 128 420 130 L528 142 L540 180 L262 186 Z" fill="#0f0f14" opacity="0.75" />
      <path d="M410 132 L432 132 L436 158 L414 160 Z" fill="#050507" />
      {/* faixas de pintura */}
      <path d="M180 140 L330 112 L560 132 L700 152 L700 160 L560 142 L330 124 L180 152 Z" fill={accent} opacity="0.9" />
      <path d="M560 168 L820 172" stroke={accent} strokeWidth="3" opacity="0.6" />
      {/* reflexo */}
      <path d="M260 118 L560 130 L700 150" stroke={`url(#${shine})`} strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* piloto + halo */}
      <circle cx="424" cy="96" r="15" fill="#fafafa" />
      <path d="M412 92 Q424 84 438 92 L438 100 L412 100 Z" fill="#0b0b0f" />
      <path d="M384 102 Q420 74 476 108" stroke="#111" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M384 102 Q420 74 476 108" stroke="#3a3a46" strokeWidth="2" fill="none" strokeLinecap="round" />

      {number !== undefined && (
        <text x="300" y="168" fill="#fff" fontFamily="Orbitron, sans-serif" fontWeight="900" fontSize="34" fontStyle="italic">{number}</text>
      )}

      {/* asa dianteira */}
      <path d="M720 196 L882 192 L886 204 L720 208 Z" fill="#111116" />
      <path d="M736 188 L880 182 L882 190 L736 194 Z" fill={color} />
      <rect x="872" y="168" width="10" height="40" rx="2" fill="#15151c" />

      {/* rodas */}
      {[{ cx: 196, r: 54 }, { cx: 690, r: 50 }].map(({ cx, r }) => (
        <g key={cx}>
          <circle cx={cx} cy={182} r={r} fill="#09090b" stroke="#1f1f27" strokeWidth="3" />
          <circle cx={cx} cy={182} r={r - 9} fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="10 8" />
          <g className="wheel-spin" style={{ transformOrigin: `${cx}px 182px`, animation: animate ? 'spin 0.35s linear infinite' : undefined }}>
            <circle cx={cx} cy={182} r={r - 20} fill="#18181f" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <line key={a} x1={cx} y1={182} x2={cx + Math.cos((a * Math.PI) / 180) * (r - 22)} y2={182 + Math.sin((a * Math.PI) / 180) * (r - 22)} stroke={color} strokeWidth="5" strokeLinecap="round" />
            ))}
          </g>
          <circle cx={cx} cy={182} r={8} fill={color} stroke="#fff" strokeOpacity="0.6" />
        </g>
      ))}
    </svg>
  );
}
