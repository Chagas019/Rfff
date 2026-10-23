import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';
import { UIOverlay } from './ui/UIOverlay';
import { useExperience } from './store/useExperience';

// gancho de QA/automação: ?qa expõe o estado da experiência no console
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('qa')) {
  (window as unknown as { mansion: typeof useExperience }).mansion = useExperience;
}

/** O motor 3D (three, R3F, pós-processamento) vem num pacote separado, carregado sob demanda. */
const Experience = lazy(() =>
  import('./three/Experience').then((m) => {
    window.dispatchEvent(new Event('mansion:chunk'));
    return m;
  }),
);

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) return <Fallback message="Ocorreu um erro ao montar a cena 3D." detail={this.state.error.message} />;
    return this.props.children;
  }
}

function Fallback({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-6 text-center" role="alert">
      <h1 className="font-display text-4xl tracking-[0.18em] text-bone">MANSÃO INFINITY</h1>
      <p className="mt-6 max-w-md text-bone/85">{message}</p>
      {detail && <p className="mt-2 max-w-md text-xs text-bone/50">{detail}</p>}
      <button className="mt-6 min-h-[44px] rounded-full bg-bone px-6 text-sm font-semibold text-ink" onClick={() => window.location.reload()}>
        Recarregar
      </button>
    </div>
  );
}

export default function App() {
  const [chunkReady, setChunkReady] = useState(false);
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    const on = () => setChunkReady(true);
    window.addEventListener('mansion:chunk', on);
    return () => window.removeEventListener('mansion:chunk', on);
  }, []);

  if (!webgl) return <Fallback message="Seu navegador não oferece WebGL, necessário para a experiência 3D. Tente um navegador atualizado com aceleração de hardware ativada." />;

  return (
    <MotionConfig reducedMotion="user">
      <main className="fixed inset-0">
        <SceneBoundary>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </SceneBoundary>
        <UIOverlay ready={chunkReady} />
        <LoadingScreen chunkReady={chunkReady} />
      </main>
    </MotionConfig>
  );
}
