import { motion, useScroll, useSpring } from 'framer-motion';
import { Heart, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const GLASS = { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' };

/** Menu em tela cheia com o degradê vermelho da landing e links entrando em sequência. */
function FullMenu({ open, onClose, favorites }: { open: boolean; onClose: () => void; favorites: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  return createPortal(
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      className={`menu-gradient fixed inset-0 z-[80] flex flex-col justify-between overflow-y-auto px-5 pb-8 pt-5 transition-opacity duration-[400ms] sm:px-8 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="flex h-14 items-center justify-between">
        <Link to="/" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="GRID F1 — página inicial"><Logo /></Link>
        <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="Fechar menu" className="flex h-14 w-14 items-center justify-center text-white" style={GLASS}>
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>
      <nav className="my-10 flex flex-col gap-3" aria-label="Menu principal">
        {NAV_LINKS.map((l, i) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className={({ isActive }) => `flex items-baseline gap-4 text-4xl font-bold tracking-tight transition-colors hover:text-gold sm:text-5xl ${isActive ? 'text-gold' : 'text-white'}`}
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateX(0)' : 'translateX(-20px)',
              transition: `opacity 0.6s ${EASE} ${0.1 + i * 0.08}s, transform 0.6s ${EASE} ${0.1 + i * 0.08}s, color 0.2s`,
            }}
          >
            <span className="w-8 text-sm font-normal text-white/50">0{i + 1}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Link to="/favoritos" onClick={onClose} tabIndex={open ? 0 : -1} className="inline-flex items-center gap-2 self-start bg-white px-8 py-3 font-semibold text-black transition hover:bg-gold">
        <Heart className="h-4 w-4" aria-hidden /> Favoritos{favorites > 0 && ` (${favorites})`}
      </Link>
    </div>,
    document.body,
  );
}

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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative whitespace-nowrap px-2 py-2 text-[15px] transition xl:px-3 ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${scrolled ? 'glass border-b border-white/10' : 'bg-gradient-to-b from-black/70 to-transparent'}`}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-black">
        Pular para o conteúdo
      </a>
      <nav className="container-grid flex h-16 items-center justify-between gap-4" aria-label="Principal">
        <Link to="/" aria-label="GRID F1 — página inicial"><Logo /></Link>
        <ul className="hidden items-center lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-gold xl:inset-x-3" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center">
          <button type="button" onClick={onSearch} className="flex h-11 w-11 items-center justify-center bg-white text-black transition hover:bg-gold" aria-label="Abrir pesquisa (Ctrl+K)" title="Pesquisar (Ctrl K)">
            <Search className="h-5 w-5" aria-hidden />
          </button>
          <SoundToggle />
          <Link to="/favoritos" className="btn-icon relative hidden sm:inline-flex" aria-label={`Favoritos (${count})`}>
            <Heart className="h-4 w-4" aria-hidden />
            {count > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">{count}</span>}
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
            style={GLASS}
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Abrir menu"
          >
            <span className="h-[2px] w-[21px] rounded-full bg-white" />
            <span className="ml-[11px] h-[2px] w-[10px] rounded-full bg-white" />
          </button>
        </div>
      </nav>
      <motion.div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-[#8B0000] via-[#E10600] to-gold" style={{ scaleX: progress }} />
      <FullMenu open={open} onClose={() => setOpen(false)} favorites={count} />
    </header>
  );
}
