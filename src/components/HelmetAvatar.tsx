import { useId } from 'react';

/** Arte gerada de capacete nas cores da equipe (substitui a foto quando não há imagem licenciada). */
export function HelmetAvatar({ color, accent, number, code, className = '' }: { color: string; accent: string; number: number; code: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Arte do capacete — ${code} #${number}`}>
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#0b0b10" />
        </linearGradient>
        <radialGradient id={`r${id}`} cx="0.3" cy="0.25" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <text x="100" y="128" textAnchor="middle" fontFamily="Big Shoulders Display, Oswald Variable, sans-serif" fontWeight="900" fontSize="120" fill={color} opacity="0.12">{number}</text>
      <path d="M40 120 Q36 52 104 44 Q170 42 172 110 L172 142 Q172 156 156 156 L64 156 Q46 156 40 140 Z" fill={`url(#h${id})`} stroke="#000" strokeOpacity="0.4" />
      <path d="M58 98 Q66 70 112 68 Q156 68 166 100 L166 118 L60 118 Z" fill="#07070a" />
      <path d="M64 100 Q74 78 112 76 Q148 76 160 100" stroke={accent} strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M44 132 L170 132" stroke={accent} strokeWidth="6" />
      <path d="M40 120 Q36 52 104 44 Q170 42 172 110 L172 142 Q172 156 156 156 L64 156 Q46 156 40 140 Z" fill={`url(#r${id})`} />
      <text x="106" y="152" textAnchor="middle" fontFamily="Big Shoulders Display, Oswald Variable, sans-serif" fontWeight="700" fontSize="14" fill="#fff">{code}</text>
    </svg>
  );
}
