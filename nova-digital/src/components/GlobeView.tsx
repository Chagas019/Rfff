import { lazy, Suspense, useEffect, useState } from 'react';
import { hasWebGL } from '../lib/device';
import { ErrorBoundary } from './ErrorBoundary';
import { GlobeFallback } from './GlobeFallback';
import type { GlobeSceneProps } from './GlobeScene';

// Three.js e a cena ficam num chunk separado, baixado apenas quando o globo é montado.
const GlobeScene = lazy(() => import('./GlobeScene'));

let webglCache: boolean | null = null;
function webglAvailable() {
  if (webglCache === null) webglCache = hasWebGL();
  return webglCache;
}

interface GlobeViewProps extends GlobeSceneProps {
  /** Monta a cena só quando necessário (carregamento sob demanda). */
  mount: boolean;
  focus?: { lat: number; lon: number } | null;
  /** Informa se a página está usando o globo vetorial alternativo. */
  onFallback?: () => void;
}

/** Escolhe entre o globo WebGL e o globo vetorial, com tratamento de erros. */
export function GlobeView({ mount, focus, onFallback, ...scene }: GlobeViewProps) {
  const [failed, setFailed] = useState(() => !webglAvailable());

  const fallback = (
    <GlobeFallback
      cities={scene.cities}
      selectedId={scene.selectedId}
      reduced={scene.reduced}
      onSelectCity={scene.onSelectCity}
      focus={focus}
    />
  );

  useEffect(() => {
    if (failed) onFallback?.();
  }, [failed, onFallback]);

  if (failed) return fallback;
  if (!mount) return null;

  const fail = () => setFailed(true);

  return (
    <ErrorBoundary fallback={fallback} onError={fail}>
      <Suspense fallback={null}>
        <GlobeScene {...scene} onContextLost={fail} />
      </Suspense>
    </ErrorBoundary>
  );
}
