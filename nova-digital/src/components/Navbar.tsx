import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NAV_LINKS, SITE } from '../data/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { SPRING } from '../lib/motion';

const IDS = ['home', ...NAV_LINKS.map((l) => l.id)];

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a
      href="#home"
      className={`group inline-flex items-center gap-2.5 text-[13px] font-medium ${className}`}
      aria-label={`${SITE.brand.first} ${SITE.brand.second}, voltar ao início`}
    >
      <span className="relative grid h-7 w-7 place-items-center" aria-hidden>
        <span className="absolute inset-0 rounded-full border border-cork transition-transform duration-700 ease-expo group-hover:rotate-180" />
        <span className="absolute inset-[6px] rounded-full border border-driftwood" />
        <span className="h-1.5 w-1.5 rounded-full bg-ember" />
      </span>
      <span>
        {SITE.brand.first}
        <span className="mx-1.5 text-ink-mute">/</span>
        <span className="text-ink-soft">{SITE.brand.second}</span>
      </span>
    </a>
  );
}

/** Link com troca vertical das letras no hover. */
function RollLink({ label }: { label: string }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-expo group-hover:-translate-y-full">{label}</span>
      <span
        className="absolute inset-0 block translate-y-full text-ink transition-transform duration-500 ease-expo group-hover:translate-y-0"
        aria-hidden
      >
        {label}
      </span>
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(IDS);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // menu mobile: trava a rolagem, fecha com Esc e devolve o foco
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>('a, button');
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const button = menuButton.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      button?.focus();
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <header
        data-intro="nav"
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || open ? 'border-b border-cork bg-void/70' : 'border-b border-transparent'
        }`}
      >
        <nav className="container-x flex h-[var(--nav-h)] items-center justify-between gap-6" aria-label="Navegação principal">
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={`group relative block rounded-full px-4 py-2 text-[13px] uppercase transition-colors ${isActive ? 'text-ink' : 'text-ink-mute hover:text-ink'}`}
                  >
                    <RollLink label={link.label} />
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-x-4 -bottom-0.5 mx-auto border-b border-dashed border-ink"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <button
              ref={menuButton}
              type="button"
              className="icon-btn lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </nav>
      </header>

      {/* fora do <header>: o backdrop-filter do header viraria o bloco de contenção do menu fixo */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={SPRING.ui}
            className="fixed inset-x-0 bottom-0 top-[var(--nav-h)] z-40 flex flex-col overflow-y-auto bg-void/95 lg:hidden"
          >
            <ul className="container-x flex flex-1 flex-col justify-center gap-1 py-8">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={`#${link.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active === link.id ? 'true' : undefined}
                    className="flex items-baseline justify-between border-b border-cork py-4 text-[clamp(2rem,9vw,3.2rem)] font-medium uppercase leading-[0.9] text-ink-soft transition-colors hover:text-ink aria-[current=true]:text-ink"
                  >
                    {link.label}
                    <span className="font-mono text-xs text-ink-mute">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="container-x pb-10">
              <a href="#explore" onClick={() => setOpen(false)} className="btn-primary w-full">
                Explore the world <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
