import { Newspaper } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useNow } from '../hooks/useNow';
import { NEWS_REFRESH_MS, PREVIOUS_VISIT, fetchNews, isNew, type NewsItem } from '../services/news';
import { LiveBadge } from './LiveBadge';
import { NewsCard } from './NewsCard';
import { ErrorState } from './States';

type Lang = 'all' | 'pt' | 'en';
const LANG_LABEL: Record<Lang, string> = { all: 'Todas', pt: 'Em português', en: 'Internacional' };

function NewsSkeleton({ lead = true }: { lead?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]" role="status" aria-label="Carregando notícias">
      {lead && <div className="aspect-[16/11] animate-pulse rounded-xl bg-white/[0.04]" />}
      <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
    </div>
  );
}

/**
 * Central de notícias. `variant="home"`: manchete + destaques (português primeiro).
 * `variant="full"`: filtros por idioma e fonte, lista completa.
 */
export function NewsHub({ variant = 'home', query = '' }: { variant?: 'home' | 'full'; query?: string }) {
  const { state, retry, refreshNow, updatedAt, refreshing } = useAsync((s) => fetchNews(s), [], { refreshMs: NEWS_REFRESH_MS });
  const [lang, setLang] = useState<Lang>('all');
  const [source, setSource] = useState('');
  const [limit, setLimit] = useState(18);
  const now = useNow(60_000);

  const items = useMemo<NewsItem[]>(() => {
    if (state.status !== 'success') return [];
    const q = query.trim().toLowerCase();
    return state.data.items.filter((i) => (lang === 'all' || i.lang === lang) && (!source || i.source === source) && (!q || `${i.title} ${i.summary} ${i.categories.join(' ')}`.toLowerCase().includes(q)));
  }, [state, lang, source, query]);

  if (state.status === 'loading' || state.status === 'idle') return <NewsSkeleton lead={variant === 'home'} />;
  if (state.status === 'error') return <ErrorState message={`${state.error} As notícias vêm direto das fontes jornalísticas.`} onRetry={retry} />;

  const sources = state.data.sources;
  const badge = <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />;

  if (variant === 'home') {
    // manchete: a notícia mais recente com imagem, de preferência em português
    const pt = items.filter((i) => i.lang === 'pt');
    const lead = pt.find((i) => i.image) ?? items.find((i) => i.image) ?? items[0];
    const rest = items.filter((i) => i !== lead);
    const side = [...rest.filter((i) => i.lang === 'pt'), ...rest.filter((i) => i.lang === 'en')].slice(0, 5);
    if (!lead) return <p className="surface p-6 text-zinc-400">Nenhuma notícia disponível nas fontes agora.</p>;
    return (
      <div>
        <div className="mb-4 flex justify-end">{badge}</div>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <NewsCard item={lead} variant="lead" isNew={isNew(lead, PREVIOUS_VISIT, now.getTime())} now={now} />
          <div className="surface px-5">
            {side.map((i) => <NewsCard key={i.id} item={i} variant="row" isNew={isNew(i, PREVIOUS_VISIT, now.getTime())} now={now} />)}
          </div>
        </div>
        <SourcesNote sources={sources} />
      </div>
    );
  }

  const shown = items.slice(0, limit);
  const fresh = items.filter((i) => isNew(i, PREVIOUS_VISIT, now.getTime())).length;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por idioma">
          {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
            <button key={l} type="button" onClick={() => { setLang(l); setSource(''); }} aria-pressed={lang === l} className={`chip transition ${lang === l ? 'border-white bg-white text-black' : 'hover:border-white/30'}`}>{LANG_LABEL[l]}</button>
          ))}
          <label className="sr-only" htmlFor="news-source">Fonte</label>
          <select id="news-source" className="input w-auto py-1.5 text-xs" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Todas as fontes</option>
            {sources.filter((s) => s.ok && (lang === 'all' || s.lang === lang)).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.count})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {fresh > 0 && <span className="chip border-race/40 text-gold">{fresh} desde sua última visita</span>}
          {badge}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="surface flex items-center gap-3 p-6 text-zinc-400"><Newspaper className="h-5 w-5" aria-hidden />Nenhuma notícia com esses filtros.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((i) => <NewsCard key={i.id} item={i} isNew={isNew(i, PREVIOUS_VISIT, now.getTime())} now={now} />)}
        </div>
      )}
      {items.length > limit && (
        <div className="mt-6 text-center"><button type="button" className="btn-ghost" onClick={() => setLimit((l) => l + 18)}>Mais notícias</button></div>
      )}
      <SourcesNote sources={sources} />
    </div>
  );
}

function SourcesNote({ sources }: { sources: { id: string; name: string; home: string; ok: boolean }[] }) {
  const down = sources.filter((s) => !s.ok);
  return (
    <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
      Fontes: {sources.map((s, i) => <span key={s.id}>{i > 0 && ', '}<a href={s.home} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-zinc-300 hover:underline">{s.name}</a></span>)}. Títulos e resumos são das próprias fontes; cada notícia abre a matéria original.
      {down.length > 0 && <> Fora do ar agora: {down.map((s) => s.name).join(', ')}.</>}
    </p>
  );
}
