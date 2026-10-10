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
    let visible = false;
    let cleanup = () => {};
    let startLoad: () => void = () => {};
    const near = new Promise<void>((res) => { startLoad = res; });
    // só baixa e monta o 3D quando a seção está chegando perto da tela
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (e.isIntersecting) startLoad(); }, { rootMargin: '150% 0px' });
    io.observe(canvas);

    near
      .then(() => import('../three/carScene'))
      .then((m) => m.createCarScene(canvas, { shiftRight }))
      .then((sc) => {
        if (disposed) { sc.dispose(); return; }
        let dirty = true;
        const ro = new ResizeObserver(() => { sc.resize(); dirty = true; });
        ro.observe(canvas);
        let smooth = progress.get();
        // qualidade adaptativa: se os quadros ficarem lentos, reduz o custo
        let last = 0, slow = 0, count = 0;
        // só redesenha quando a rolagem muda (economiza GPU/bateria)
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          if (!visible) { last = 0; return; }
          const target = progress.get();
          const delta = target - smooth;
          if (Math.abs(delta) < 1e-4 && !dirty) { last = 0; return; }
          smooth = Math.abs(delta) < 2e-4 ? target : smooth + delta * 0.18;
          dirty = false;
          sc.setProgress(smooth);
          sc.frame(now / 1000);
          if (last) {
            count++;
            if (now - last > 28) slow++;
            if (count >= 30) { if (slow > 12 && sc.degrade()) dirty = true; count = 0; slow = 0; }
          }
          last = now;
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
