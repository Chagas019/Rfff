import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Box, Expand, Eye, Layers, Loader2, Minimize, Minus, Plus, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CAR_MODELS, MODEL_SEASONS, modelFor } from '../../data/carModels';
import { drivers } from '../../data/drivers';
import { teamById, teams } from '../../data/teams';
import type { PartLabel, View } from '../../three/carStudio';
import { DriverPhoto } from '../DriverPhoto';
import { Flag } from '../Flag';

const VIEWS: { id: View; label: string }[] = [
  { id: 'tresQuartos', label: '3/4' },
  { id: 'frontal', label: 'Frente' },
  { id: 'traseira', label: 'Traseira' },
  { id: 'lateral', label: 'Lateral' },
  { id: 'superior', label: 'Superior' },
];

/** Verifica WebGL 2 uma única vez e libera o contexto de teste (navegadores limitam quantos existem). */
let webglCache: boolean | null = null;
const webglOk = () => {
  if (webglCache !== null) return webglCache;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    webglCache = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
};

/** Só no ambiente de desenvolvimento: ?modeloTeste=1 carrega um GLB de teste (não publicado). */
const testFile = () => (import.meta.env.DEV && new URLSearchParams(location.search).has('modeloTeste') ? '/__test__/test.glb' : null);

/**
 * Cor CSS resolvida em hex (para o three.js). Passa por um canvas porque o navegador pode
 * devolver formatos que o three.js não lê, como oklab() vindo de color-mix().
 */
function cssColor(value: string) {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return '#0b0f1d';
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return '#0b0f1d';
  }
}

type Studio = Awaited<ReturnType<typeof import('../../three/carStudio')['createCarStudio']>>;

/**
 * Configurador 3D: modelos licenciados de cada equipe em estúdio com iluminação PBR, reflexos
 * e sombras; rotação 360°, zoom, cinco vistas, tela cheia e vista explodida das peças.
 * Equipe sem modelo licenciado aparece como indisponível — nunca é trocada por fotografia.
 */
export function CarConfigurator({ initialTeam = 'ferrari', initialDriver }: { initialTeam?: string; initialDriver?: string }) {
  const reduce = useReducedMotion() ?? false;
  const [teamId, setTeamId] = useState(initialTeam);
  const [driverId, setDriverId] = useState<string | undefined>(initialDriver);
  const [season, setSeason] = useState(2026);
  const [view, setView] = useState<View>('tresQuartos');
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState<PartLabel[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [full, setFull] = useState(false);
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined');
  const frame = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const studio = useRef<Studio | null>(null);

  const team = teamById(teamId)!;
  const lineup = drivers.filter((d) => d.teamId === teamId);
  const driver = lineup.find((d) => d.id === driverId);
  const model = modelFor(teamId, season);
  const mobile = typeof window !== 'undefined' && matchMedia('(max-width: 768px)').matches;
  const file = testFile() ?? (model?.status === 'available' ? `${(mobile && model.fileMobile) || model.file}?v=${model.version}` : undefined);
  const supported = typeof document !== 'undefined' && webglOk();

  // carrega só quando o palco chega perto da tela
  useEffect(() => {
    if (inView || !frame.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(frame.current);
    return () => io.disconnect();
  }, [inView]);

  // piloto escolhido precisa ser da equipe escolhida
  useEffect(() => { if (driverId && !lineup.some((d) => d.id === driverId)) setDriverId(undefined); }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!file || !supported || !holder.current || !inView) return;
    let cancelled = false;
    setStatus('loading');
    setProgress(0);
    setExploded(false);
    setLabels([]);
    (async () => {
      const { createCarStudio } = await import('../../three/carStudio');
      if (cancelled || !holder.current) return;
      if (!studio.current) {
        studio.current = createCarStudio(holder.current, { reducedMotion: reduce, accent: team.color, background: cssColor('var(--c-950)'), onProgress: setProgress, onLabels: setLabels });
      }
      studio.current.setAccent(team.color);
      try {
        await studio.current.load(file);
        if (!cancelled) { setStatus('ready'); setView('tresQuartos'); }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [file, supported, reduce, inView]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { studio.current?.setAccent(team.color); }, [team.color]);
  useEffect(() => () => { studio.current?.dispose(); studio.current = null; }, []);
  useEffect(() => { if (!file && studio.current) { studio.current.dispose(); studio.current = null; setStatus('idle'); setLabels([]); } }, [file]);

  // tela cheia
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen?.());

  const changeView = (v: View) => { setView(v); studio.current?.setView(v); };
  const toggleExplode = () => { const next = !exploded; setExploded(next); studio.current?.setExploded(next); };
  const available = CAR_MODELS.filter((m) => m.status === 'available' && m.season === season).length;
  const total = CAR_MODELS.filter((m) => m.season === season).length;

  return (
    <div className="space-y-5">
      {/* palco: o carro é o protagonista */}
      <div ref={frame} className={`relative overflow-hidden border border-white/10 bg-carbon-950 ${full ? 'h-screen w-screen' : 'rounded-2xl'}`}
        style={{ backgroundImage: `radial-gradient(70% 70% at 50% 60%, color-mix(in srgb, ${team.color} 26%, transparent), transparent 72%)` }}>
        <div className="absolute inset-x-0 top-0 z-10 h-1" style={{ background: team.color }} aria-hidden />
        <div ref={holder} className={`relative w-full ${full ? 'h-full' : 'h-[62vh] min-h-[380px] sm:h-[72vh]'}`} role="img"
          aria-label={file ? `Modelo 3D do ${model?.title}. Arraste para girar.` : `Modelo 3D do ${team.car} indisponível`} />

        {/* cabeçalho sobre o palco */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6">
          <div>
            <p className="kicker text-white/60">{team.name} · Temporada {season}</p>
            <p className="text-3xl font-semibold text-white sm:text-5xl" style={{ letterSpacing: '-0.04em' }}>{team.car}</p>
            {driver && (
              <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <span className="font-display text-xl font-semibold" style={{ color: team.color }}>#{driver.number}</span>
                {driver.firstName} {driver.lastName} · <Flag code={driver.countryCode} country={driver.nationality} />
              </p>
            )}
          </div>
          {status === 'ready' && (
            <div className="pointer-events-auto flex gap-1.5">
              <button type="button" onClick={() => studio.current?.zoom(0.82)} className="btn-icon h-10 w-10" aria-label="Aproximar"><Plus className="h-4 w-4" aria-hidden /></button>
              <button type="button" onClick={() => studio.current?.zoom(1.2)} className="btn-icon h-10 w-10" aria-label="Afastar"><Minus className="h-4 w-4" aria-hidden /></button>
              <button type="button" onClick={toggleFull} className="btn-icon h-10 w-10" aria-label={full ? 'Sair da tela cheia' : 'Tela cheia'}>{full ? <Minimize className="h-4 w-4" aria-hidden /> : <Expand className="h-4 w-4" aria-hidden />}</button>
            </div>
          )}
        </div>

        {/* rótulos da vista explodida */}
        <AnimatePresence>
          {exploded && labels.filter((l) => l.visible).map((l) => (
            <motion.span key={l.group} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"
              style={{ left: l.x, top: l.y - 6 }}>
              {l.label}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* estados */}
        {!supported && <Overlay title="Seu navegador não suporta WebGL 2" text="O configurador 3D precisa de WebGL 2. Tente um navegador atualizado." />}
        {supported && !file && (
          <Overlay icon={<Box className="h-12 w-12 text-white/30" aria-hidden />} title={`Modelo 3D do ${team.car} indisponível`}
            text={model?.note ?? `Não há modelo 3D licenciado do ${team.car} para a temporada ${season}.`} />
        )}
        {status === 'loading' && file && <Overlay icon={<Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />} title="Carregando modelo 3D" text={`${Math.round(progress * 100)}%`} />}
        {status === 'error' && <Overlay title="Não foi possível carregar o modelo" text="Verifique sua conexão e tente novamente." />}

        {status === 'ready' && (
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-5">
            <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-full bg-black/55 p-1 backdrop-blur" role="group" aria-label="Ângulo de visão">
              {VIEWS.map((v) => (
                <button key={v.id} type="button" onClick={() => changeView(v.id)} aria-pressed={view === v.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${view === v.id ? 'bg-white text-black' : 'text-white/80 hover:text-white'}`}>{v.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleExplode} aria-pressed={exploded}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${exploded ? 'bg-white text-black' : 'bg-black/55 text-white backdrop-blur hover:bg-black/70'}`}>
                <Layers className="h-4 w-4" aria-hidden />{exploded ? 'Montar o carro' : 'Vista explodida'}
              </button>
              <p className="hidden items-center gap-1.5 rounded-full bg-black/55 px-3 py-2 text-[11px] text-white/70 backdrop-blur md:flex"><RotateCw className="h-3.5 w-3.5" aria-hidden />Arraste para girar · roda/pinça para zoom</p>
            </div>
          </div>
        )}
      </div>

      {/* seleção: temporada, equipe e piloto */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="kicker text-white/50">Equipe</p>
            <label className="flex items-center gap-2 text-xs text-white/60">Temporada
              <select className="input w-auto py-1 text-xs" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
                {MODEL_SEASONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4" role="radiogroup" aria-label="Escolha a equipe">
            {teams.map((t) => {
              const m = modelFor(t.id, season);
              const on = t.id === teamId;
              return (
                <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => setTeamId(t.id)} title={`${t.name} ${t.car}${m?.status === 'available' ? '' : ' — modelo indisponível'}`}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] transition ${on ? 'border-white/60 bg-white/10 text-white' : 'border-white/10 text-white/60 hover:border-white/30'}`}>
                  <span className="h-3 w-3 rounded-full" style={{ background: t.color }} aria-hidden />
                  <span className="truncate">{t.car}</span>
                  {m?.status !== 'available' && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/30" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/45">{available} de {total} modelos disponíveis em {season}. Ponto cinza: indisponível.</p>
        </div>

        <div className="panel p-4">
          <p className="kicker mb-3 text-white/50">Piloto</p>
          <div className="grid grid-cols-2 gap-2">
            {lineup.map((d) => {
              const on = d.id === driverId;
              return (
                <button key={d.id} type="button" onClick={() => setDriverId(on ? undefined : d.id)} aria-pressed={on}
                  className={`flex flex-col items-center gap-1 overflow-hidden rounded-xl border p-2 text-center transition ${on ? 'border-white/60 bg-white/10' : 'border-white/10 hover:border-white/30'}`}>
                  <DriverPhoto driver={d} team={team} width={160} className="h-16 w-16 rounded-full bg-white/5" />
                  <span className="text-xs font-semibold text-white">{d.lastName}</span>
                  <span className="font-mono text-[10px] text-white/50">#{d.number} · <Flag code={d.countryCode} country={d.nationality} /></span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/45">O carro é o mesmo para os dois pilotos da equipe.</p>
        </div>

        <div className="panel p-4 text-sm">
          <p className="kicker mb-1" style={{ color: team.color }}>{team.name}</p>
          <h3 className="text-2xl">{team.car}</h3>
          <dl className="mt-3 space-y-1.5 text-white/70">
            <div className="flex justify-between gap-3"><dt>Temporada</dt><dd className="text-white">{season}</dd></div>
            <div className="flex justify-between gap-3"><dt>Motor</dt><dd className="text-white">{team.powerUnit}</dd></div>
            <div className="flex justify-between gap-3"><dt>Sede</dt><dd className="text-right text-white">{team.base}</dd></div>
          </dl>
          <Link to={`/equipes/${team.id}`} className="btn-ghost mt-4 w-full py-2 text-xs"><Eye className="h-4 w-4" aria-hidden />Ficha da equipe</Link>
        </div>
      </div>

      {model?.author && (
        <p className="text-[11px] leading-relaxed text-white/45">
          Modelo 3D: “{model.title}” por <a href={model.authorUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{model.author}</a> (<a href={model.sourceUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">Sketchfab</a>), licença <a href={model.license?.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{model.license?.label}</a>. Pintura e patrocinadores da temporada {season}; carroceria baseada no regulamento {season}, comum aos carros da série — não é a aerodinâmica exata de cada equipe. Na vista explodida as peças são separadas a partir das malhas do próprio modelo.
        </p>
      )}
    </div>
  );
}

function Overlay({ icon, title, text }: { icon?: React.ReactNode; title: string; text: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
      {icon}
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="max-w-md text-sm text-white/60">{text}</p>
      <span className="mt-2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
    </div>
  );
}
