import { useCallback, useEffect, useState } from 'react';
import type { ArcadeRuntime, AppMode } from './runtime';
import type { ConsoleSnapshot } from '../games/console/ArcadeConsole';
import { ArcadeViewer } from '../components/ArcadeViewer/ArcadeViewer';
import { ArcadeControls } from '../components/ArcadeControls/ArcadeControls';
import { CartridgeSelector } from '../components/CartridgeSelector/CartridgeSelector';
import { ARLayer, useAR } from '../components/ARExperience/ARExperience';
import { HelpSheet } from '../components/HelpSheet/HelpSheet';
import { VIEWS, type ViewId } from '../three/CameraControls/views';
import {
  IconAR,
  IconCart,
  IconExitFullscreen,
  IconFullscreen,
  IconHelp,
  IconMute,
  IconOrbit,
  IconPause,
  IconPlay,
  IconReset,
  IconSound,
} from '../components/icons';

const EXPLORE_VIEWS: ViewId[] = ['hero', 'front', 'left', 'right', 'back', 'top'];

declare global {
  interface Window {
    /** Gancho para os testes automatizados e para a exportação dos modelos. */
    __pocketArcade?: ArcadeRuntime;
    __ready?: boolean;
  }
}

export function App() {
  const [runtime, setRuntime] = useState<ArcadeRuntime | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>('explore');
  const [view, setView] = useState<ViewId | 'custom'>('hero');
  const [snap, setSnap] = useState<ConsoleSnapshot | null>(null);
  const [muted, setMuted] = useState(false);
  const [sheet, setSheet] = useState<'carts' | 'help' | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const ar = useAR(runtime);
  const fullscreenSupported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;

  // ?capture=1 esconde a interface (comparação com a foto); ?view=… escolhe a vista inicial
  const [params] = useState(() => new URLSearchParams(typeof location !== 'undefined' ? location.search : ''));
  const capture = params.has('capture');

  const onReady = useCallback(
    (rt: ArcadeRuntime) => {
      setRuntime(rt);
      setMuted(rt.audio.muted);
      const v = params.get('view') as ViewId | null;
      if (v && v in VIEWS) {
        rt.stage.setView(v, true);
        setView(v);
      }
      window.__pocketArcade = rt;
      window.__ready = true;
    },
    [params],
  );

  useEffect(() => {
    if (!runtime) return;
    const offs = [
      runtime.onMode(setMode),
      runtime.console.subscribe(setSnap),
    ];
    runtime.stage.onUserOrbit = () => setView((v) => (v === 'play' ? v : 'custom'));
    return () => offs.forEach((f) => f());
  }, [runtime]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const go = (m: AppMode) => {
    if (!runtime) return;
    if (m === 'ar') {
      ar.start();
      return;
    }
    runtime.setMode(m);
    setView(m === 'play' ? 'play' : 'hero');
    if (m === 'play') runtime.stage.renderer.domElement.focus({ preventScroll: true });
  };

  const pickView = (v: ViewId) => {
    runtime?.setView(v);
    setView(v);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* o navegador recusou: nada a fazer */
    }
  };

  const toggleMute = () => {
    if (!runtime) return;
    runtime.audio.unlock();
    runtime.audio.setMuted(!muted);
    setMuted(!muted);
    if (muted) runtime.audio.play('confirm');
  };

  const inGame = snap?.mode === 'game';
  const paused = snap?.status === 'paused';
  const arLabel =
    ar.state.route === 'webxr'
      ? 'Ver no meu espaço'
      : ar.state.route === 'quick-look'
        ? 'Ver no meu espaço (AR Quick Look)'
        : ar.state.route === 'scene-viewer'
          ? 'Ver no meu espaço (Scene Viewer)'
          : 'Ver no meu espaço (indisponível aqui)';

  if (fatal) {
    return (
      <main className="app" style={{ placeItems: 'center', display: 'grid', padding: 24 }}>
        <div className="sheet" role="alert" style={{ borderRadius: 22 }}>
          <h2>Não foi possível abrir o 3D</h2>
          <p>{fatal}</p>
        </div>
      </main>
    );
  }

  if (capture) {
    return (
      <main className="app">
        <ArcadeViewer onReady={onReady} onError={setFatal} />
      </main>
    );
  }

  return (
    <main className="app" data-mode={mode}>
      <ArcadeViewer onReady={onReady} onError={setFatal} />

      <div className="topbar">
        <div className="brand">
          <h1>Pocket Arcade</h1>
          <p>Modelo 3D interativo · 4 jogos · realidade aumentada</p>
        </div>
        <div className="icon-row">
          <button type="button" className="icon-btn" onClick={() => setSheet('help')} aria-label="Ajuda e controles">
            <IconHelp />
          </button>
          <button type="button" className="icon-btn" onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Desativar som'} aria-pressed={!muted}>
            {muted ? <IconMute /> : <IconSound />}
          </button>
          {fullscreenSupported && (
            <button type="button" className="icon-btn" onClick={toggleFullscreen} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
              {fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
            </button>
          )}
        </div>
      </div>

      <nav className="dock" aria-label="Modos e ações">
        {mode === 'play' && runtime && (touch || window.innerWidth < 900) && <ArcadeControls runtime={runtime} disabled={!!sheet} />}

        {mode === 'explore' && (
          <div className="chips" role="group" aria-label="Vistas">
            {EXPLORE_VIEWS.map((v) => (
              <button key={v} type="button" className="chip" aria-pressed={view === v} onClick={() => pickView(v)} disabled={!runtime}>
                {VIEWS[v].label}
              </button>
            ))}
          </div>
        )}

        <div className="chips" role="group" aria-label="Ações">
          <button type="button" className="chip" onClick={() => setSheet('carts')} disabled={!runtime}>
            <IconCart /> Selecionar cartucho
          </button>
          {mode === 'play' && inGame && (
            <button type="button" className="chip" aria-pressed={paused} onClick={() => runtime?.console.togglePause()}>
              <IconPause /> {paused ? 'Continuar' : 'Pausar'}
            </button>
          )}
          <button
            type="button"
            className="chip"
            onClick={() => {
              runtime?.resetView();
              setView(mode === 'play' ? 'play' : 'hero');
            }}
            disabled={!runtime}
          >
            <IconReset /> Reiniciar visualização
          </button>
        </div>

        <div className="segmented" role="group" aria-label="Modo">
          <button type="button" className="seg-btn" aria-pressed={mode === 'explore'} onClick={() => go('explore')} disabled={!runtime}>
            <IconOrbit />
            <span>
              Explorar<span className="long"> em 3D</span>
            </span>
          </button>
          <button type="button" className="seg-btn" aria-pressed={mode === 'play'} onClick={() => go('play')} disabled={!runtime}>
            <IconPlay /> Jogar
          </button>
          <button
            type="button"
            className="seg-btn"
            aria-pressed={mode === 'ar'}
            onClick={() => go('ar')}
            disabled={!runtime || !ar.state.support}
            title={arLabel}
            aria-label={arLabel}
          >
            <IconAR />
            <span>
              <span className="long">Ver no meu </span>espaço
            </span>
          </button>
        </div>
        {mode === 'explore' && <p className="hint">Arraste para girar 360° · role ou faça pinça para aproximar · toque nos botões, no joystick e nos cartuchos do aparelho</p>}
        {mode === 'play' && !touch && <p className="hint">Teclado: setas movem · Z azul · X amarelo · C vermelho · Enter Start/Pausa · clique direto nos botões do aparelho</p>}
      </nav>

      {sheet === 'carts' && runtime && <CartridgeSelector runtime={runtime} currentGame={snap?.gameId ?? null} onClose={() => setSheet(null)} />}
      {sheet === 'help' && <HelpSheet ar={ar.state} onClose={() => setSheet(null)} runtime={runtime} />}
      <ARLayer ar={ar} runtime={runtime} />
    </main>
  );
}
