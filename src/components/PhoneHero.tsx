import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { SEASON } from '../data/calendar2026';
import { useAsync } from '../hooks/useAsync';
import { fetchCareerPoints, fetchConstructorStandings, fetchDriverStandings, LIVE_REFRESH_MS } from '../services/f1Api';

const IMG = {
  bg: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260709_152331_bd312d1a-1f20-46b9-9b68-12bcdcf6d53e.png&w=1280&q=85',
  logo: 'https://framerusercontent.com/images/NZPITJ6zDBvxVT7rc1NH2sOU.png',
  profile: 'https://framerusercontent.com/images/JIl4japgQlMAQRvh1gDHszRvkUY.png?width=92&height=92',
  ukFlag: 'https://framerusercontent.com/images/pqUTggaeyOivtzDImRzkBRdww.png',
  hamilton: 'https://framerusercontent.com/images/m5IyHuJeOQ5P0GOvWx1xv0IR9Y.png',
  avatars: 'https://framerusercontent.com/images/dAAdqktZVxBDjPKk97YCjZjsE.png',
  circuit: 'https://framerusercontent.com/images/raKAG2bJP9xeqi118VMniPLvbAA.png',
  medal: 'https://framerusercontent.com/images/pIXUcwyAF0xzCIaKjtNLahHpasQ.png',
  ferrari: 'https://framerusercontent.com/images/sUDhzMuxKIOvqjSH5U1fn0QSXqI.png',
  chassis: 'https://framerusercontent.com/images/zIA1tYDOAdZo3k6IXX9gBC5FGbY.png',
  car: 'https://framerusercontent.com/images/MzKCSYB4uVt9psQq4jRwQNRDjc.png',
  leclercStats: 'https://framerusercontent.com/images/MJfqhcmEoIBnfimJNhKqoZpq0.png',
  hamiltonStats: 'https://framerusercontent.com/images/3EwXxC1QutaGnlNDZMlAN66ZmTU.png',
};

const MENU_LINKS = [
  { label: 'Biography', to: '/pilotos/hamilton' },
  { label: 'Statistics', to: '/classificacao' },
  { label: 'Career', to: '/equipes/ferrari' },
];

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/** Conta de 0 até `target` com ease-out cúbico, começando depois de `delay` ms. */
function useCountUp(target: number | null, delay: number, duration = 2200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    let raf = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, delay, duration]);
  return value;
}

/** Moldura de iPhone; o conteúdo é desenhado em 390 px de largura e escalado para caber na tela. */
function PhoneMockup({ children }: { children: ReactNode }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 844 });
  useEffect(() => {
    const el = screenRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = size.w / 390 || 1;
  const contentH = size.h / scale;

  return (
    <div className="flex flex-col items-center">
      <div className="phone-frame relative rounded-[clamp(30px,4vw,54px)] bg-black p-[clamp(6px,1vw,12px)] shadow-2xl shadow-black/60">
        <div className="pointer-events-none absolute inset-0 rounded-[clamp(30px,4vw,54px)] ring-1 ring-white/15" />
        {/* botões laterais */}
        <span className="absolute -left-[3px] top-[19%] h-[4.5%] w-[3px] rounded-l bg-neutral-700" aria-hidden />
        <span className="absolute -left-[3px] top-[26%] h-[7.3%] w-[3px] rounded-l bg-neutral-700" aria-hidden />
        <span className="absolute -left-[3px] top-[35.5%] h-[7.3%] w-[3px] rounded-l bg-neutral-700" aria-hidden />
        <span className="absolute -right-[3px] top-[30.8%] h-[11.4%] w-[3px] rounded-r bg-neutral-700" aria-hidden />
        <div ref={screenRef} className="relative h-full w-full overflow-hidden rounded-[clamp(24px,3.2vw,44px)] bg-[#0a0e1c]">
          <div className="absolute left-1/2 top-[3%] z-50 h-[4%] w-[30%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
          <div className="absolute left-0 top-0" style={{ width: 390, height: contentH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenBackground() {
  return (
    <>
      <img src={IMG.bg} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="absolute inset-0 z-0 bg-black/60" />
    </>
  );
}

function PhoneNav({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="absolute left-0 right-0 top-0 z-30 mt-[20px] flex h-14 items-center justify-between px-5">
      <img src={IMG.logo} alt="F1" className="h-7 w-auto object-contain" />
      <div className="flex">
        <Link to="/pilotos" aria-label="Ver pilotos" className="flex h-14 w-14 items-center justify-center bg-white">
          <img src={IMG.profile} alt="" className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menu"
          className="flex h-14 w-14 flex-col items-center justify-center gap-[5px]"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <span className="h-[2px] w-[21px] rounded-full bg-white" />
          <span className="h-[2px] w-[10px] self-center rounded-full bg-white" style={{ marginLeft: 11 }} />
        </button>
      </div>
    </div>
  );
}

function Location({ className }: { className: string }) {
  return (
    <div className={`relative z-10 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-[16px] text-white/60">United Kingdom</span>
        <img src={IMG.ukFlag} alt="" className="h-6 w-6" />
      </div>
      <h2 className="mt-1 font-albert text-[48px] font-normal normal-case leading-[0.95] tracking-[-0.05em] text-white">
        Silverstone<br />England
      </h2>
    </div>
  );
}

function ScreenHamilton({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-5 pb-0 pt-[76px]">
      <ScreenBackground />
      <PhoneNav onMenu={onMenu} />
      <Location className="mb-2 mt-4 animate-fade-slide-up anim-delay-300" />
      <div className="absolute inset-0 z-[5] flex items-end justify-center">
        <img src={IMG.hamilton} alt="Lewis Hamilton" className="h-auto w-[calc(140%-5px)] max-w-none origin-bottom object-contain animate-scale-in anim-delay-500" />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[50%]"
          style={{
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            mask: 'linear-gradient(to bottom, transparent 0%, black 50%)',
            WebkitMask: 'linear-gradient(to bottom, transparent 0%, black 50%)',
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5">
        <img src={IMG.avatars} alt="" className="mb-3 h-12 w-auto animate-fade-slide-up anim-delay-700" />
        <Link to="/pilotos/hamilton" className="block overflow-hidden">
          <h2 className="font-albert text-[64px] font-semibold normal-case leading-[0.82] tracking-[-0.05em] text-white animate-speed-reveal anim-delay-800">
            Lewis<br />Hamilton
          </h2>
        </Link>
      </div>
    </div>
  );
}

function StatNumber({ value, delay, caption, gold }: { value: number | null; delay: number; caption: string; gold?: boolean }) {
  const n = useCountUp(value, delay);
  return (
    <div className="flex items-end justify-between gap-2">
      <span
        className={`font-semibold tracking-[-0.06em] ${gold ? '' : 'bg-clip-text text-transparent'}`}
        style={{
          fontSize: 110,
          lineHeight: 0.72,
          ...(gold ? { color: '#EDB40B' } : { backgroundImage: 'linear-gradient(to bottom, white 0%, rgba(255,255,255,0.4) 50%, transparent 85%)' }),
        }}
      >
        {value === null ? '—' : n}
      </span>
      <span className="mb-1 shrink-0 whitespace-pre-line text-right text-[12px] leading-tight text-white/50">{caption}</span>
    </div>
  );
}

function ScreenStats({ onMenu, stats }: { onMenu: () => void; stats: HeroStats }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-5 pb-8 pt-[76px]">
      <ScreenBackground />
      <PhoneNav onMenu={onMenu} />
      <Location className="mb-4 animate-fade-slide-up anim-delay-400" />
      <Link to="/circuitos/silverstone" className="relative z-10 -mx-5 flex min-h-0 flex-1 items-center justify-center px-2 animate-scale-in anim-delay-600" aria-label="Ver o circuito de Silverstone">
        <img src={IMG.circuit} alt="Traçado de Silverstone" className="h-full w-full object-contain" />
      </Link>
      <div className="relative z-10 mt-auto pt-4 animate-fade-slide-up anim-delay-800">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[16px] text-white/60">Season Points</span>
          <img src={IMG.medal} alt="" className="h-6 w-6" />
        </div>
        <div className="space-y-3">
          <StatNumber value={stats.hamiltonPoints} delay={800} caption={`Hamilton\n${SEASON}`} />
          <StatNumber value={stats.ferrariPoints} delay={1000} caption={`Ferrari\n${SEASON}`} />
          <StatNumber value={stats.careerPoints} delay={1200} caption="Hamilton · carreira" gold />
        </div>
      </div>
    </div>
  );
}

function DriverPanel({ name, stats, number, to }: { name: string; stats: string; number: string; to: string }) {
  return (
    <Link
      to={to}
      className="h-[200px] w-1/2 rounded-t-2xl p-3"
      style={{ background: 'rgba(20,20,30,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/60">{name}</span>
        <img src={IMG.profile} alt="" className="h-4 w-4 opacity-60" />
      </div>
      <img src={stats} alt="" className="mt-2 h-5" />
      <span className="mt-6 block font-semibold leading-[0.79] text-white" style={{ fontSize: 110, letterSpacing: '-0.08em' }}>{number}</span>
    </Link>
  );
}

function ScreenFerrari({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <ScreenBackground />
      <PhoneNav onMenu={onMenu} />
      <div className="absolute left-5 top-[100px] z-10 animate-fade-slide-up anim-delay-300">
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-white/60">Team Name</span>
          <img src={IMG.ferrari} alt="" className="h-5 w-5" />
        </div>
        <h2 className="mt-2 font-albert text-[52px] font-normal normal-case leading-[0.83] text-white" style={{ letterSpacing: '-0.08em' }}>
          Scuderia<br />Ferrari
        </h2>
      </div>
      <div className="absolute left-5 top-[245px] z-10 animate-fade-slide-up anim-delay-500">
        <div className="flex items-center gap-2">
          <img src={IMG.chassis} alt="" className="h-5 w-5" />
          <span className="text-[15px] text-white/60">Chassis</span>
        </div>
        <span className="mt-2 block font-semibold leading-[0.79] text-[#EDB40B]" style={{ fontSize: 120, letterSpacing: '-0.08em' }}>SF-26</span>
      </div>
      <img src={IMG.car} alt="Ferrari SF-26" className="absolute left-3 right-3 top-[390px] z-10 h-auto w-[calc(100%-24px)] object-contain animate-fade-slide-left anim-delay-700" />
      <div className="absolute bottom-0 left-0 right-0 z-10 flex animate-fade-slide-up anim-delay-900">
        <DriverPanel name="Charles Leclerc" stats={IMG.leclercStats} number="16" to="/pilotos/leclerc" />
        <DriverPanel name="Lewis Hamilton" stats={IMG.hamiltonStats} number="44" to="/pilotos/hamilton" />
      </div>
    </div>
  );
}

function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      className={`fixed inset-0 z-[80] flex flex-col justify-between p-8 font-albert transition-opacity duration-[400ms] ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      style={{ background: 'linear-gradient(160deg, #1a0000 0%, #8B0000 40%, #E10600 100%)' }}
    >
      <div className="flex items-center justify-between">
        <img src={IMG.logo} alt="F1" className="h-7 w-auto object-contain" />
        <button type="button" onClick={onClose} aria-label="Fechar menu" tabIndex={open ? 0 : -1} className="flex h-14 w-14 items-center justify-center bg-white/15 text-white">
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>
      <nav className="flex flex-col gap-4">
        {MENU_LINKS.map((l, i) => (
          <Link
            key={l.label}
            to={l.to}
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="text-3xl font-bold tracking-tight text-white transition-colors hover:text-[#EDB40B]"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateX(0)' : 'translateX(-20px)',
              transition: `opacity 0.6s ${EASE} ${0.1 + i * 0.08}s, transform 0.6s ${EASE} ${0.1 + i * 0.08}s, color 0.2s`,
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <Link to="/favoritos" onClick={onClose} tabIndex={open ? 0 : -1} className="self-start bg-white px-8 py-3 font-semibold text-black">
        Sign in
      </Link>
    </div>,
    document.body,
  );
}

interface HeroStats { hamiltonPoints: number | null; ferrariPoints: number | null; careerPoints: number | null }

async function fetchHeroStats(signal: AbortSignal): Promise<HeroStats> {
  const [drivers, constructors, career] = await Promise.allSettled([
    fetchDriverStandings(SEASON, signal),
    fetchConstructorStandings(SEASON, signal),
    fetchCareerPoints('hamilton', signal),
  ]);
  return {
    hamiltonPoints: drivers.status === 'fulfilled' ? drivers.value.items.find((d) => d.driverId === 'hamilton')?.points ?? null : null,
    ferrariPoints: constructors.status === 'fulfilled' ? constructors.value.items.find((c) => c.constructorId === 'ferrari')?.points ?? null : null,
    careerPoints: career.status === 'fulfilled' ? career.value : null,
  };
}

const EMPTY: HeroStats = { hamiltonPoints: null, ferrariPoints: null, careerPoints: null };

/** Landing com três celulares: Hamilton em Silverstone, pontos ao vivo e a Ferrari SF-26. */
export function PhoneHero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { state } = useAsync(fetchHeroStats, [], { refreshMs: LIVE_REFRESH_MS });
  const stats = state.status === 'success' ? state.data : EMPTY;
  const open = () => setMenuOpen(true);

  const phones = [
    <ScreenHamilton key="ham" onMenu={open} />,
    <ScreenStats key="stats" onMenu={open} stats={stats} />,
    <ScreenFerrari key="ferrari" onMenu={open} />,
  ];
  const delays = ['anim-delay-300', 'anim-delay-500', 'anim-delay-700'];

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0e1c] font-albert antialiased" aria-label="Destaque: Lewis Hamilton, Silverstone e Ferrari">
      <img src={IMG.bg} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="absolute inset-0 z-[1] bg-black/70" />

      {/* desktop */}
      <div className="relative z-[2] hidden min-h-screen w-full items-center justify-center pb-6 pt-20 md:flex">
        <div className="flex items-end justify-center gap-[2vw]">
          {phones.map((p, i) => (
            <div key={i} className={`animate-fade-slide-up ${delays[i]} ${i === 1 ? '-mb-6' : ''}`}>
              <PhoneMockup>{p}</PhoneMockup>
            </div>
          ))}
        </div>
      </div>

      {/* celular */}
      <div className="relative z-[2] flex flex-col items-center gap-[50px] px-[20px] pb-[20px] pt-[84px] md:hidden">
        {phones.map((p, i) => (
          <div key={i} className={`animate-fade-slide-up ${delays[i]}`}>
            <PhoneMockup>{p}</PhoneMockup>
          </div>
        ))}
      </div>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </section>
  );
}
