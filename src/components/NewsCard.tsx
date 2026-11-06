import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import type { NewsItem } from '../services/news';
import { timeAgo } from '../utils/time';

const LANG = { pt: 'PT', en: 'EN' } as const;

/** Imagem da matéria; se a fonte não entregar a foto, some sem deixar ícone quebrado. */
function Thumb({ src, className, fallback = null }: { src: string; className: string; fallback?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={className} />;
}

function Meta({ item, isNew, now }: { item: NewsItem; isNew: boolean; now: Date }) {
  return (
    <p className="kicker flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-500">
      {isNew && <span className="rounded bg-race px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-white">Novo</span>}
      <span className="text-zinc-300">{item.sourceName}</span>
      {item.publishedAt && <time dateTime={item.publishedAt}>· {timeAgo(item.publishedAt, now)}</time>}
      <span className="rounded border border-white/10 px-1 text-[9px] tracking-widest" title={item.lang === 'pt' ? 'Em português' : 'Em inglês'}>{LANG[item.lang]}</span>
    </p>
  );
}

/** Card editorial de notícia. Abre a matéria original no site da fonte. */
export function NewsCard({ item, variant = 'compact', isNew = false, now = new Date() }: { item: NewsItem; variant?: 'lead' | 'compact' | 'row'; isNew?: boolean; now?: Date }) {
  const common = { href: item.url, target: '_blank', rel: 'noreferrer' } as const;
  if (variant === 'lead') {
    return (
      <a {...common} className="group surface relative flex h-full flex-col overflow-hidden transition hover:border-white/20">
        <div className="relative aspect-[16/9] overflow-hidden bg-carbon-800">
          {item.image ? (
            <Thumb src={item.image} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" fallback={<div className="grid-bg h-full w-full" aria-hidden />} />
          ) : (
            <div className="grid-bg h-full w-full" aria-hidden />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carbon-900 to-transparent" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <Meta item={item} isNew={isNew} now={now} />
          <h3 className="font-sans text-xl font-bold normal-case leading-snug tracking-normal text-white group-hover:text-race-400 sm:text-2xl">{item.title}</h3>
          {item.summary && <p className="line-clamp-3 text-sm text-zinc-400">{item.summary}</p>}
          <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-zinc-300">Ler em {item.sourceName} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
        </div>
      </a>
    );
  }
  if (variant === 'row') {
    return (
      <a {...common} className="group flex gap-4 border-b border-white/[0.06] py-4 last:border-0">
        <div className="min-w-0 flex-1">
          <Meta item={item} isNew={isNew} now={now} />
          <h3 className="mt-1.5 line-clamp-2 font-sans text-[15px] font-semibold normal-case leading-snug tracking-normal text-zinc-100 group-hover:text-race-400">{item.title}</h3>
        </div>
        {item.image && <Thumb src={item.image} className="h-16 w-24 shrink-0 rounded-lg object-cover sm:h-20 sm:w-32" />}
      </a>
    );
  }
  return (
    <a {...common} className="group surface flex h-full flex-col overflow-hidden transition hover:border-white/20">
      {item.image && (
        <div className="aspect-[16/9] overflow-hidden bg-carbon-800">
          <Thumb src={item.image} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" fallback={<div className="grid-bg h-full w-full" aria-hidden />} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Meta item={item} isNew={isNew} now={now} />
        <h3 className="line-clamp-3 font-sans text-base font-semibold normal-case leading-snug tracking-normal text-white group-hover:text-race-400">{item.title}</h3>
        {!item.image && item.summary && <p className="line-clamp-3 text-sm text-zinc-400">{item.summary}</p>}
      </div>
    </a>
  );
}
