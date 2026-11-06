import { useReducedMotion } from 'framer-motion';
import { Box, Eye, Loader2, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CAR_MODELS, type CarModel } from '../../data/carModels';
import { teamById, teams } from '../../data/teams';
import type { View } from '../../three/carStudio';

const VIEWS: { id: View; label: string }[] = [
  { id: 'tresQuartos', label: '3/4' },
  { id: 'lateral', label: 'Lateral' },
  { id: 'superior', label: 'Superior' },
  { id: 'frontal', label: 'Frontal' },
];

const webglOk = () => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};

/** Só no ambiente de desenvolvimento: ?modeloTeste=1 carrega um GLB de teste (não publicado). */
const testFile = () => (import.meta.env.DEV && new URLSearchParams(location.search).has('modeloTeste') ? '/__test__/test.glb' : null);

/**
 * Configurador 3D: modelos licenciados de cada equipe em estúdio com iluminação PBR,
 * reflexos e sombras, rotação por mouse/toque e vistas superior, lateral e frontal.
 * Equipe sem modelo licenciado aparece como pendente — nunca é trocada por fotografia.
 */
export function CarConfigurator({ initialTeam = 'ferrari' }: { initialTeam?: string }) {
  const reduce = useReducedMotion() ?? false;
  const [teamId, setTeamId] = useState(initialTeam);
  const [view, setView] = useState<View>('tresQuartos');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const holder = useRef<HTMLDivElement>(null);
  const studio = useRef<Awaited<ReturnType<typeof import('../../three/carStudio')['createCarStudio']>> | null>(null);
  const team = teamById(teamId)!;
  const model: CarModel | undefined = CAR_MODELS.find((m) => m.teamId === teamId);
  const file = testFile() ?? (model?.status === 'available' ? model.file : undefined);
  const supported = typeof document !== 'undefined' && webglOk();

  useEffect(() => {
    if (!file || !supported || !holder.current) return;
    let cancelled = false;
    setStatus('loading');
    setProgress(0);
    (async () => {
      const { createCarStudio } = await import('../../three/carStudio');
      if (cancelled || !holder.current) return;
      if (!studio.current) {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--ev-accent').trim() || '#EDB40B';
        // fundo do estúdio = cor de base do site (tingida pelo país do evento)
        const probe = document.createElement('span');
        probe.style.color = 'var(--c-950)';
        document.body.appendChild(probe);
        const background = getComputedStyle(probe).color;
        probe.remove();
        studio.current = createCarStudio(holder.current, { reducedMotion: reduce, accent, background, onProgress: setProgress });
      }
      try {
        await studio.current.load(file);
        if (!cancelled) { setStatus('ready'); setView('tresQuartos'); }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [file, supported, reduce]);

  useEffect(() => () => { studio.current?.dispose(); studio.current = null; }, []);
  useEffect(() => { if (!file && studio.current) { studio.current.dispose(); studio.current = null; setStatus('idle'); } }, [file]);

  const changeView = (v: View) => { setView(v); studio.current?.setView(v); };
  const available = CAR_MODELS.filter((m) => m.status === 'available').length;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-carbon-950" style={{ boxShadow: `inset 0 0 120px -40px ${team.color}` }}>
        <div className="event-stripe absolute inset-x-0 top-0 z-10 h-0.5" aria-hidden />
        <div ref={holder} className="relative aspect-[16/10] w-full sm:aspect-[16/9]" role="img" aria-label={file ? `Modelo 3D do ${model?.title}. Arraste para girar.` : `Modelo 3D do ${team.car} pendente`} />

        {/* estados sobre o palco */}
        {!supported && <Overlay title="Seu navegador não suporta WebGL 2" text="O configurador 3D precisa de WebGL 2. Tente um navegador atualizado." />}
        {supported && !file && (
          <Overlay
            icon={<Box className="h-10 w-10 text-white/30" aria-hidden />}
            title={`Modelo 3D do ${team.car} pendente`}
            text={model?.note ?? 'Ainda não há modelo 3D licenciado para esta equipe.'}
          />
        )}
        {status === 'loading' && file && <Overlay icon={<Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />} title="Carregando modelo 3D" text={`${Math.round(progress * 100)}%`} />}
        {status === 'error' && <Overlay title="Não foi possível carregar o modelo" text="Verifique sua conexão e tente novamente." />}

        {status === 'ready' && (
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
            <div className="flex gap-1 rounded-full bg-black/50 p-1 backdrop-blur" role="group" aria-label="Ângulo de visão">
              {VIEWS.map((v) => (
                <button key={v.id} type="button" onClick={() => changeView(v.id)} aria-pressed={view === v.id}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${view === v.id ? 'bg-white text-black' : 'text-white/80 hover:text-white'}`}>{v.label}</button>
              ))}
            </div>
            <p className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur"><RotateCw className="h-3.5 w-3.5" aria-hidden />Arraste para girar · pinça/roda para zoom</p>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="panel p-4">
          <p className="kicker mb-3 text-white/50">Equipe</p>
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-3" role="radiogroup" aria-label="Escolha a equipe">
            {teams.map((t) => {
              const m = CAR_MODELS.find((x) => x.teamId === t.id);
              const on = t.id === teamId;
              return (
                <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => setTeamId(t.id)} title={`${t.name} ${t.car}${m?.status === 'available' ? '' : ' — modelo pendente'}`}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] transition ${on ? 'border-white/60 bg-white/10 text-white' : 'border-white/10 text-white/60 hover:border-white/30'}`}>
                  <span className="h-3 w-3 rounded-full" style={{ background: t.color }} aria-hidden />
                  <span className="truncate">{t.car}</span>
                  {m?.status !== 'available' && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/30" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/45">{available} de {CAR_MODELS.length} modelos disponíveis. Ponto cinza: pendente.</p>
        </div>

        <div className="panel p-4 text-sm">
          <p className="kicker mb-1 text-gold">{team.name}</p>
          <h3 className="text-2xl">{team.car}</h3>
          <dl className="mt-3 space-y-1.5 text-white/70">
            <div className="flex justify-between gap-3"><dt>Motor</dt><dd className="text-white">{team.powerUnit}</dd></div>
            <div className="flex justify-between gap-3"><dt>Sede</dt><dd className="text-right text-white">{team.base}</dd></div>
          </dl>
          <Link to={`/equipes/${team.id}`} className="btn-ghost mt-4 w-full py-2 text-xs"><Eye className="h-4 w-4" aria-hidden />Ficha da equipe</Link>
        </div>

        {model?.author && (
          <p className="text-[11px] leading-relaxed text-white/45">
            Modelo 3D: “{model.title}” por <a href={model.authorUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{model.author}</a>, <a href={model.sourceUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">Sketchfab</a>, licença <a href={model.license?.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{model.license?.label}</a>. Pintura e patrocinadores da temporada 2026; carroceria baseada no regulamento 2026, comum aos carros da série.
          </p>
        )}
      </aside>
    </div>
  );
}

function Overlay({ icon, title, text }: { icon?: React.ReactNode; title: string; text: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ background: 'radial-gradient(60% 60% at 50% 55%, rgba(255,255,255,0.05), transparent 70%)' }}>
      {icon}
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="max-w-sm text-sm text-white/60">{text}</p>
      <span className="mt-2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
    </div>
  );
}
