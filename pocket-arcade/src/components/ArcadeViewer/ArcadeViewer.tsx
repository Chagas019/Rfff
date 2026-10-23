import { useEffect, useRef, useState } from 'react';
import { ArcadeRuntime } from '../../app/runtime';

interface Props {
  onReady: (rt: ArcadeRuntime) => void;
  onError: (message: string) => void;
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Hospeda o palco 3D. Cria o runtime uma vez, mostra o progresso real das etapas de
 * carregamento (arte da tela, geometria, shaders) e libera tudo ao desmontar.
 */
export function ArcadeViewer({ onReady, onError }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState({ step: 'Preparando o estúdio', f: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!supportsWebGL()) {
      onError('Seu navegador não tem WebGL ativado, então o modelo 3D não pode ser exibido.');
      return;
    }
    const lowPower = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rt = new ArcadeRuntime(el, { lowPower, reducedMotion, bootImageUrl: `${import.meta.env.BASE_URL}textures/screen-reference.jpg` });
    let cancelled = false;
    rt.init((step, f) => !cancelled && setProgress({ step, f }))
      .then(() => {
        if (cancelled) return;
        setDone(true);
        onReady(rt);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) onError('Não foi possível montar o modelo 3D neste aparelho.');
      });
    return () => {
      cancelled = true;
      rt.dispose();
    };
    // o runtime é criado uma única vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div ref={ref} className="stage" />
      <div className="loading" data-done={done} role="status" aria-live="polite" aria-hidden={done}>
        <div className="loading-card">
          <h2>Montando o Pocket Arcade</h2>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.f * 100)}>
            <span style={{ width: `${Math.round(progress.f * 100)}%` }} />
          </div>
          <p>{progress.step}…</p>
        </div>
      </div>
    </>
  );
}
