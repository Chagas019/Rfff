import { Link } from 'react-router-dom';
import { CALENDAR_SOURCE } from '../data/calendar2026';
import { API_SOURCE } from '../services/f1Api';
import { Logo } from './Logo';
import { NAV_LINKS } from './Navbar';

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-carbon-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-race to-transparent" aria-hidden />
      <div className="container-grid grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-zinc-400">A experiência da velocidade. Uma plataforma de fãs para acompanhar a temporada 2026 da Fórmula 1.</p>
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
        © {new Date().getFullYear()} GRID F1 — The race never stops
      </div>
    </footer>
  );
}
