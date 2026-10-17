import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CalendarDays, CornerDownLeft, Map, Search, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { buildSearchIndex, searchIndex, type SearchKind } from '../utils/search';

const ICONS: Record<SearchKind, typeof Search> = { Corrida: CalendarDays, Circuito: Map, Piloto: User, Equipe: Building2 };
const SUGGESTIONS = ['Interlagos', 'Hamilton', 'Ferrari', 'Singapura', 'Mônaco'];

/** Pesquisa global (atalho Ctrl/⌘ + K ou "/"). */
export function SearchBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useMemo(buildSearchIndex, []);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const results = useMemo(() => searchIndex(index, query), [index, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);
  useEffect(() => setActive(0), [query]);

  const go = (to: string) => { onClose(); navigate(to); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) go(results[active].to);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Pesquisa global"
            initial={{ y: -20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0 }}
            className="glass relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-5 w-5 text-gold" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque corridas, circuitos, pilotos ou equipes…"
                className="h-14 flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `sr-${results[active].kind}-${results[active].id}` : undefined}
                aria-label="Termo de pesquisa"
              />
              <button type="button" onClick={onClose} className="btn-icon h-8 w-8" aria-label="Fechar pesquisa"><X className="h-4 w-4" aria-hidden /></button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!query && (
                <div className="p-4">
                  <p className="label mb-3">Sugestões</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} type="button" className="chip hover:border-gold/60 hover:text-white" onClick={() => setQuery(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {query && results.length === 0 && (
                <p className="p-6 text-center text-sm text-zinc-400">Nenhum resultado para “{query}”.</p>
              )}
              <ul id="search-results" role="listbox" aria-label="Resultados">
                {results.map((r, i) => {
                  const Icon = ICONS[r.kind];
                  return (
                    <li key={`${r.kind}-${r.id}`} id={`sr-${r.kind}-${r.id}`} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(r.to)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${i === active ? 'bg-gold/15 text-white' : 'text-zinc-300'}`}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5"><Icon className="h-4 w-4 text-gold" aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{r.title}</span>
                          <span className="block truncate text-xs text-zinc-500">{r.kind} · {r.subtitle}</span>
                        </span>
                        {i === active && <CornerDownLeft className="h-4 w-4 text-zinc-500" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-zinc-500">
              <span>↑↓ navegar</span><span>Enter abrir</span><span>Esc fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
