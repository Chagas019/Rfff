import type { ReactNode } from 'react';

/** Cabeçalho compacto de seção, no estilo editorial das plataformas esportivas. */
export function HubHeader({ kicker, title, id, children, action }: { kicker?: string; title: ReactNode; id?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-3">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-1 text-gold">{kicker}</p>}
        <h2 id={id} className="text-2xl leading-none sm:text-3xl">{title}</h2>
        {children && <p className="mt-2 text-sm text-zinc-400">{children}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
