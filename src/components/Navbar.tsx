import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Heart, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { Logo } from './Logo';
import { SoundToggle } from './SoundToggle';

export const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/calendario', label: 'Calendário' },
  { to: '/circuitos', label: 'Circuitos' },
  { to: '/pilotos', label: 'Pilotos' },
  { to: '/equipes', label: 'Equipes' },
  { to: '/classificacao', label: 'Classificação' },
  { to: '/jogos', label: 'Jogos' },
];

export function Navbar({ onSearch }: { onSearch: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useFavorites();
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative whitespace-nowrap px-2 py-2 text-[13px] font-semibold uppercase tracking-wide transition xl:px-3 xl:text-sm xl:tracking-wider ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${scrolled || open ? 'glass border-b border-white/10' : 'bg-gradient-to-b from-black/70 to-transparent'}`}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-race focus:px-4 focus:py-2 focus:text-white">
        Pular para o conteúdo
      </a>
      <nav className="container-grid flex h-16 items-center justify-between gap-4" aria-label="Principal">
        <Link to="/" aria-label="GRID F1 — página inicial"><Logo /></Link>
        <ul className="hidden items-center gap-0 lg:flex xl:gap-1">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-race xl:inset-x-3" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSearch} className="btn-icon w-auto gap-2 px-3" aria-label="Abrir pesquisa (Ctrl+K)">
            <Search className="h-4 w-4" aria-hidden />
            <kbd className="hidden whitespace-nowrap rounded border border-white/10 px-1.5 font-mono text-[10px] text-zinc-500 md:inline lg:hidden xl:inline">Ctrl K</kbd>
          </button>
          <SoundToggle />
          <Link to="/favoritos" className="btn-icon relative" aria-label={`Favoritos (${count})`}>
            <Heart className="h-4 w-4" aria-hidden />
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-race px-1 text-[10px] font-bold text-white">{count}</span>}
          </Link>
          <button type="button" className="btn-icon lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Fechar menu' : 'Abrir menu'}>
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </nav>
      <motion.div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-race via-race-400 to-telemetry-yellow" style={{ scaleX: progress }} />
      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 lg:hidden">
            <ul className="container-grid flex flex-col py-4">
              {[...NAV_LINKS, { to: '/favoritos', label: 'Favoritos' }].map((l, i) => (
                <motion.li key={l.to} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <NavLink to={l.to} end={l.to === '/'} className={({ isActive }) => `flex items-center justify-between border-b border-white/5 py-4 font-display text-lg font-bold uppercase ${isActive ? 'text-race' : 'text-white'}`}>
                    {l.label}
                    <span className="font-mono text-xs text-zinc-600">0{i + 1}</span>
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
