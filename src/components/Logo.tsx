export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 48 28" className="h-7 w-12" aria-hidden>
        <path d="M2 26 L16 2 H46 L42 9 H21 L18 14 H38 L34 21 H14 L11 26 Z" fill="#e10600" />
        <path d="M0 22 H8 M3 17 H11" stroke="#e10600" strokeWidth="2" opacity="0.6" />
      </svg>
      <span className="font-display text-lg font-black italic tracking-tight text-white">
        GRID<span className="text-race">F1</span>
      </span>
    </span>
  );
}
