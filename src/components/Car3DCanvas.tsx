import type { MotionValue } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Canvas WebGL com o carro 3D. O three.js é carregado sob demanda (chunk
 * separado) e só renderiza enquanto a seção está visível.
 */
export function Car3DCanvas({ progress, className = '', shiftRight = false }: { progress: MotionValue<number>; className?: string; shiftRight?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let raf = 0;
    let visible = true;
    let cleanup = () => {};
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' });
    io.observe(canvas);

    const load = import('../three/carScene').then((m) => () => m.createCarScene(canvas, { shiftRight }));
    load
      .then((create) => {
        if (disposed) return;
        const sc = create();
        let dirty = true;
        const ro = new ResizeObserver(() => { sc.resize(); dirty = true; });
        ro.observe(canvas);
        let smooth = progress.get();
        // só redesenha quando a rolagem muda (economiza GPU/bateria)
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          if (!visible) return;
          const target = progress.get();
          const delta = target - smooth;
          if (Math.abs(delta) < 1e-4 && !dirty) return;
          smooth = Math.abs(delta) < 1e-4 ? target : smooth + delta * 0.12;
          dirty = false;
          sc.setProgress(smooth);
          sc.frame(now / 1000);
        };
        raf = requestAnimationFrame(loop);
        setStatus('ready');
        cleanup = () => { cancelAnimationFrame(raf); ro.disconnect(); sc.dispose(); };
      })
      .catch(() => !disposed && setStatus('error'));

    return () => { disposed = true; io.disconnect(); cleanup(); };
  }, [progress, shiftRight]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" role="img" aria-label="Carro de Fórmula 1 em 3D girando conforme a rolagem" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-zinc-400" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-race" aria-hidden /> Carregando modelo 3D…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-zinc-400" role="alert">
          Seu navegador não conseguiu exibir o modelo 3D (WebGL indisponível).
        </div>
      )}
    </div>
  );
}
