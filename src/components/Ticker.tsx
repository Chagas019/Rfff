import { Zap } from 'lucide-react';

/** Faixa animada com informações da temporada (pausa ao passar o mouse). */
export function Ticker({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="group relative overflow-hidden border-y border-race/30 bg-race/[0.07] py-3" aria-label="Informações da temporada">
      <ul className="sr-only">{items.map((i) => <li key={i}>{i}</li>)}</ul>
      <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]" aria-hidden>
        {loop.map((text, i) => (
          <span key={i} className="flex items-center gap-3 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] text-zinc-300">
            <Zap className="h-3.5 w-3.5 text-race" /> {text}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-carbon-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-carbon-950 to-transparent" />
    </div>
  );
}
