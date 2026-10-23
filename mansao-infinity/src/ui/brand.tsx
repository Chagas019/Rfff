/** Monograma "MI" em moldura fina — assinatura da marca. */
export function Monogram({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="39" height="39" fill="none" stroke="currentColor" strokeOpacity="0.55" />
      <rect x="4" y="4" width="32" height="32" fill="none" stroke="#c8b08a" strokeOpacity="0.7" strokeWidth="0.6" />
      <text x="20" y="25.5" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="15" fontWeight="400" letterSpacing="1.5" fill="currentColor">
        MI
      </text>
    </svg>
  );
}

/** Marca completa: monograma + nome com espaçamento largo. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-bone">
      <Monogram size={compact ? 36 : 40} />
      <div className="hidden leading-none md:block">
        <p className="font-display text-[1.05rem] tracking-[0.42em]">MANSÃO INFINITY</p>
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.36em] text-bone/55">Residência privada · Litoral</p>
      </div>
    </div>
  );
}
