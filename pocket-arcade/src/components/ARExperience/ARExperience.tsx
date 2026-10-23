import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArcadeRuntime } from '../../app/runtime';
import {
  AR_ASSETS,
  ARError,
  absoluteAssetUrl,
  assetExists,
  chooseARRoute,
  detectARSupport,
  openQuickLook,
  sceneViewerIntent,
  unavailableReason,
  type ARRoute,
  type ARSupport,
} from '../../services/arSupport';
import { ARSession, type ARPhase } from '../../three/ar/ARSession';
import { ArcadeControls } from '../ArcadeControls/ArcadeControls';
import { IconClose, IconMinus, IconPlus, IconRotate } from '../icons';

export interface ARState {
  support: ARSupport | null;
  route: ARRoute | null;
  /** Arquivos GLB/USDZ exportados existem no servidor. */
  assets: { glb: boolean; usdz: boolean };
}

/** Detecta o suporte uma vez e oferece a função de abrir a RA (chamada dentro do clique). */
export function useAR(runtime: ArcadeRuntime | null) {
  const [state, setState] = useState<ARState>({ support: null, route: null, assets: { glb: false, usdz: false } });
  const [phase, setPhase] = useState<ARPhase>('ended');
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(null);
  const [info, setInfo] = useState<{ anchors: boolean; domOverlay: boolean } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<ARSession | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const support = await detectARSupport();
      const [glb, usdz] = await Promise.all([
        support.sceneViewer ? assetExists(absoluteAssetUrl(AR_ASSETS.glb)) : Promise.resolve(false),
        support.quickLook ? assetExists(absoluteAssetUrl(AR_ASSETS.usdz)) : Promise.resolve(false),
      ]);
      if (alive) setState({ support, route: chooseARRoute(support), assets: { glb, usdz } });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(() => {
    if (!runtime || !state.support) return;
    const route = state.route;
    if (route === 'webxr' && overlayRef.current) {
      const prevMode = runtime.mode === 'ar' ? 'explore' : runtime.mode;
      const session = new ARSession(runtime.stage, overlayRef.current, {
        onPhase: (p) => {
          setPhase(p);
          if (p === 'ended') {
            sessionRef.current = null;
            runtime.setMode(prevMode);
          }
        },
        onInfo: setInfo,
      });
      sessionRef.current = session;
      runtime.setMode('ar');
      session.start().catch((err: unknown) => {
        sessionRef.current = null;
        runtime.setMode(prevMode);
        const e = err instanceof ARError ? err : null;
        setDialog({
          title: e?.code === 'denied' ? 'Câmera não liberada' : 'Realidade aumentada indisponível',
          body: e?.message ?? 'Não foi possível iniciar a realidade aumentada.',
        });
      });
      return;
    }
    if (route === 'quick-look') {
      if (!state.assets.usdz) {
        setDialog({ title: 'Modelo para AR Quick Look não encontrado', body: 'O arquivo USDZ ainda não foi gerado nesta publicação (veja "npm run export:models" no README). O modo 3D continua disponível.' });
        return;
      }
      openQuickLook(absoluteAssetUrl(AR_ASSETS.usdz));
      return;
    }
    if (route === 'scene-viewer') {
      if (!state.assets.glb) {
        setDialog({ title: 'Modelo para o Scene Viewer não encontrado', body: 'O arquivo GLB ainda não foi gerado nesta publicação (veja "npm run export:models" no README). O modo 3D continua disponível.' });
        return;
      }
      window.location.href = sceneViewerIntent(absoluteAssetUrl(AR_ASSETS.glb), 'Pocket Arcade', window.location.href);
      return;
    }
    setDialog({ title: 'Realidade aumentada indisponível neste navegador', body: unavailableReason(state.support) });
  }, [runtime, state]);

  return { state, phase, info, dialog, setDialog, start, overlayRef, sessionRef };
}

type ARController = ReturnType<typeof useAR>;

const PHASE_MSG: Record<ARPhase, string> = {
  starting: 'Abrindo a câmera…',
  scanning: 'Mova o celular devagar apontando para uma mesa. Quando o círculo aparecer, toque para colocar o aparelho.',
  placed: 'Arraste com um dedo para girar, use dois dedos para mudar o tamanho e toque em outro ponto para mover.',
  ended: '',
};

/** Sobreposição DOM da sessão WebXR + diálogos de limitação/erro. */
export function ARLayer({ ar, runtime }: { ar: ARController; runtime: ArcadeRuntime | null }) {
  const active = ar.phase !== 'ended';
  const s = ar.sessionRef.current;
  return (
    <>
      <div ref={ar.overlayRef} className="ar-overlay" data-active={active} aria-hidden={!active}>
        {active && (
          <>
            <div className="ar-top">
              <div className="ar-msg" role="status" aria-live="polite">
                {PHASE_MSG[ar.phase]}
                {ar.phase === 'placed' && ar.info && <div style={{ opacity: 0.75, marginTop: 4, fontSize: 12 }}>{ar.info.anchors ? 'Ancorado à superfície.' : 'Fixo no espaço (este navegador não oferece âncoras).'}</div>}
              </div>
              <button type="button" className="icon-btn" data-xr-ui="" onClick={() => s?.end()} aria-label="Sair da realidade aumentada">
                <IconClose />
              </button>
            </div>
            <div className="ar-bottom">
              {ar.phase === 'placed' && (
                <div className="ar-tools" data-xr-ui="">
                  <button type="button" className="icon-btn" onClick={() => s?.rotate(-Math.PI / 8)} aria-label="Girar para a esquerda">
                    <IconRotate dir={-1} />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => s?.rotate(Math.PI / 8)} aria-label="Girar para a direita">
                    <IconRotate />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => s?.scaleBy(1 / 1.25)} aria-label="Diminuir">
                    <IconMinus />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => s?.scaleBy(1.25)} aria-label="Aumentar">
                    <IconPlus />
                  </button>
                </div>
              )}
              {ar.phase === 'placed' && runtime && <ArcadeControls runtime={runtime} xr />}
            </div>
          </>
        )}
      </div>
      {ar.dialog && (
        <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && ar.setDialog(null)}>
          <div className="sheet" role="alertdialog" aria-modal="true" aria-labelledby="ar-dialog-title" aria-describedby="ar-dialog-body">
            <header>
              <h2 id="ar-dialog-title">{ar.dialog.title}</h2>
            </header>
            <p id="ar-dialog-body">{ar.dialog.body}</p>
            <p>
              Enquanto isso, o modelo 3D continua aqui: gire, aproxime e jogue normalmente. Nenhuma câmera foi aberta.
            </p>
            <div className="btn-row">
              <button type="button" className="btn" autoFocus onClick={() => ar.setDialog(null)}>
                Continuar no 3D
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
