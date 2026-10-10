import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function SectionHeader({ kicker, title, children, action }: { kicker: string; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <Reveal className="mb-8 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="label mb-3 flex items-center gap-2 text-race-400">
          <span className="h-px w-8 bg-race" aria-hidden />
          {kicker}
        </p>
        <h2 className="text-3xl font-bold uppercase sm:text-4xl">{title}</h2>
        {children && <p className="mt-3 text-zinc-400">{children}</p>}
      </div>
      {action}
    </Reveal>
  );
}
