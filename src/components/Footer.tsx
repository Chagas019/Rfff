import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CALENDAR_SOURCE } from '../data/calendar2026';
import { API_SOURCE } from '../services/f1Api';
import { Logo } from './Logo';
import { NAV_LINKS } from './Navbar';

const CREATOR = { handle: 'chagas_catolico', url: 'https://www.instagram.com/chagas_catolico' };

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-carbon-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-race to-transparent" aria-hidden />
      <div className="container-grid grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-zinc-400">A experiência da velocidade. Uma plataforma de fãs para acompanhar a temporada 2026 da Fórmula 1.</p>
          <div className="mt-6">
            <p className="label mb-2">Criador do site</p>
            <a
              href={CREATOR.url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] py-2 pl-2 pr-4 transition hover:border-race/60 hover:bg-race/10"
              aria-label={`Instagram do criador do site: @${CREATOR.handle} (abre em nova aba)`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white" aria-hidden>
                <Instagram className="h-4 w-4" />
              </span>
              <span className="font-condensed text-sm font-semibold uppercase tracking-wider text-zinc-200 group-hover:text-white">@{CREATOR.handle}</span>
            </a>
          </div>
        </div>
        <nav aria-label="Rodapé">
          <p className="label mb-3">Navegação</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[...NAV_LINKS, { to: '/favoritos', label: 'Favoritos' }].map((l) => (
              <li key={l.to}><Link to={l.to} className="text-zinc-400 hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="text-xs leading-relaxed text-zinc-500">
          <p className="label mb-3">Fontes e avisos</p>
          <p>Calendário: <a className="text-zinc-300 hover:text-white" href={CALENDAR_SOURCE.url} target="_blank" rel="noreferrer">{CALENDAR_SOURCE.label}</a>.</p>
          <p className="mt-1">Classificação e resultados: <a className="text-zinc-300 hover:text-white" href={API_SOURCE.url} target="_blank" rel="noreferrer">{API_SOURCE.label}</a>, em tempo real.</p>
          <p className="mt-1">Fotos dos carros: Wikimedia Commons, com autor e licença em cada imagem. Capacetes e traçados são ilustrações deste projeto.</p>
          <p className="mt-3">Site de fãs sem vínculo com a Formula One Group ou a FIA. “Formula 1”, “F1” e marcas relacionadas pertencem aos seus donos.</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">
        © {new Date().getFullYear()} GRID F1 — The race never stops · Criado por{' '}
        <a href={CREATOR.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-race">@{CREATOR.handle}</a>
      </div>
    </footer>
  );
}
