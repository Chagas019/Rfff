import { Zap } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { NEWS_REFRESH_MS, fetchNews } from '../../services/news';
import { Ticker } from '../Ticker';

/** Faixa com as manchetes mais recentes (em português primeiro); sem notícias, mostra a temporada. */
export function NewsTicker({ fallback }: { fallback: string[] }) {
  const { state } = useAsync((s) => fetchNews(s), [], { refreshMs: NEWS_REFRESH_MS });
  if (state.status !== 'success' || !state.data.items.length) return <Ticker items={fallback} />;
  const pt = state.data.items.filter((i) => i.lang === 'pt');
  const items = (pt.length >= 5 ? pt : state.data.items).slice(0, 10).map((i) => ({ text: i.title, href: i.url, source: i.sourceName }));
  return (
    <div className="group relative overflow-hidden border-y border-white/[0.08] bg-carbon-900 py-2.5" aria-label="Últimas manchetes">
      <ul className="sr-only">{items.map((i) => <li key={i.href}><a href={i.href} target="_blank" rel="noreferrer">{i.text} ({i.source})</a></li>)}</ul>
      <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none" aria-hidden>
        {[...items, ...items].map((i, n) => (
          <a key={n} href={i.href} target="_blank" rel="noreferrer" tabIndex={-1} className="flex items-center gap-2 whitespace-nowrap text-[13px] text-zinc-300 hover:text-white">
            <Zap className="h-3.5 w-3.5 text-race" /> <span className="kicker text-zinc-500">{i.source}</span> {i.text}
          </a>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-carbon-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-carbon-900 to-transparent" />
    </div>
  );
}
