import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { races as localRaces } from '../data/calendar2026';
import { EVENT_THEMES, themeFor, type EventTheme } from '../data/eventThemes';
import { fetchSchedule } from '../services/schedule';
import type { Race } from '../types';
import { getBaseStatus, getRaceStart } from '../utils/race';

export interface ActiveEvent {
  race: Race | null;
  /** 'live': fim de semana em andamento · 'next': próxima etapa · 'none': temporada encerrada. */
  phase: 'live' | 'next' | 'none';
  theme: EventTheme;
  /** De onde veio o calendário: API oficial, cache local ou dados embutidos. */
  source: 'api' | 'cache' | 'local';
  /** Visualização forçada pela URL (?gp=...) para conferir outras paletas. */
  preview: boolean;
}

/**
 * Etapa que define a identidade visual: a que está acontecendo (do TL1 até o fim da corrida)
 * ou, fora disso, a próxima do calendário. Terminada a corrida, já passa para a seguinte.
 */
export function pickActiveRace(races: Race[], now: Date): { race: Race | null; phase: ActiveEvent['phase'] } {
  const active = races.filter((r) => !r.cancelled && r.sessions.length);
  const live = active.find((r) => getBaseStatus(r, now) === 'live');
  if (live) return { race: live, phase: 'live' };
  const next = active.filter((r) => getBaseStatus(r, now) === 'upcoming').sort((a, b) => (getRaceStart(a)?.getTime() ?? 0) - (getRaceStart(b)?.getTime() ?? 0))[0];
  return next ? { race: next, phase: 'next' } : { race: null, phase: 'none' };
}

/** Aplica a paleta nas variáveis CSS (as cores interpolam suavemente via @property). */
export function applyTheme(theme: EventTheme, countryCode = '') {
  const root = document.documentElement;
  root.style.setProperty('--ev-accent', theme.accent);
  root.style.setProperty('--ev-1', theme.c1);
  root.style.setProperty('--ev-2', theme.c2);
  root.style.setProperty('--ev-3', theme.c3);
  root.dataset.event = countryCode;
  // barra do navegador no celular acompanha a cor do site
  const meta = document.querySelector('meta[name="theme-color"]') ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
  meta.setAttribute('content', mixDark(theme.c1, 0.26));
}

/** Mesma mistura da base do site (cor do país 26% + quase preto), em hex para a meta tag. */
export function mixDark(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const base = [5, 7, 13];
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => Math.round(base[i] + (v - base[i]) * amt));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const Ctx = createContext<ActiveEvent>({ race: null, phase: 'none', theme: themeFor(), source: 'local', preview: false });

/** Lê ?gp= (id da etapa ou código do país) e ?agora= (data simulada) para visualização e testes. */
function readOverrides(): { gp: string | null; now: Date | null } {
  if (typeof window === 'undefined') return { gp: null, now: null };
  const q = new URLSearchParams(window.location.search);
  try {
    if (q.has('gp')) q.get('gp') === 'auto' ? sessionStorage.removeItem('gridf1:gp') : sessionStorage.setItem('gridf1:gp', q.get('gp')!);
  } catch { /* sem armazenamento */ }
  let gp: string | null = q.get('gp');
  try { gp = gp ?? sessionStorage.getItem('gridf1:gp'); } catch { /* idem */ }
  if (gp === 'auto') gp = null;
  const t = q.get('agora');
  const now = t && !Number.isNaN(new Date(t).getTime()) ? new Date(t) : null;
  return { gp, now };
}

export function EventThemeProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<{ races: Race[]; source: ActiveEvent['source'] }>({ races: localRaces, source: 'local' });
  const [tick, setTick] = useState(0);
  const overrides = useMemo(readOverrides, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchSchedule(ctrl.signal).then((s) => setSchedule(s)).catch(() => {});
    return () => ctrl.abort();
  }, []);

  // reavalia a cada minuto e quando a aba volta a ficar visível
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    const onVis = () => document.visibilityState === 'visible' && setTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const value = useMemo<ActiveEvent>(() => {
    const now = overrides.now ?? new Date();
    if (overrides.gp) {
      const g = overrides.gp.toLowerCase();
      const race = schedule.races.find((r) => r.id === g) ?? schedule.races.find((r) => r.countryCode.toLowerCase() === g && !r.cancelled) ?? null;
      if (race || EVENT_THEMES[g.toUpperCase()]) {
        return { race, phase: race ? (getBaseStatus(race, now) === 'live' ? 'live' : 'next') : 'next', theme: themeFor(race?.countryCode ?? g.toUpperCase()), source: schedule.source, preview: true };
      }
    }
    const { race, phase } = pickActiveRace(schedule.races, now);
    return { race, phase, theme: themeFor(race?.countryCode), source: schedule.source, preview: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, tick, overrides]);

  useEffect(() => { applyTheme(value.theme, value.race?.countryCode); }, [value.theme, value.race?.countryCode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useEventTheme = () => useContext(Ctx);
