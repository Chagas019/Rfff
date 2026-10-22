import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { AnimatePresence, motion } from 'motion/react';
import { Monogram } from './brand';

/**
 * Tela de carregamento com progresso real (texturas e modelos registrados no
 * gerenciador de carregamento do three.js) e tratamento de falhas.
 */
export function LoadingScreen({ chunkReady }: { chunkReady: boolean }) {
  const { progress, active, errors, loaded, total } = useProgress();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (chunkReady && !active && total > 0 && progress >= 100) {
      const id = window.setTimeout(() => setDone(true), 500);
      return () => window.clearTimeout(id);
    }
  }, [chunkReady, active, progress, total]);

  // o código da cena 3D conta como os primeiros 10%
  const pct = chunkReady ? 10 + Math.round(progress * 0.9) : 4;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-6 text-center text-bone"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } }}
          role="status"
          aria-live="polite"
        >
          <Monogram size={56} />
          <h1 className="mt-10 font-display text-3xl font-light tracking-[0.42em] sm:text-5xl">MANSÃO INFINITY</h1>
          <p className="eyebrow mt-4">Uma nova dimensão de arquitetura e luxo</p>
          <p className="numeral mt-14 text-6xl font-light tabular-nums text-bone/90 sm:text-7xl">
            {String(pct).padStart(2, '0')}
            <span className="ml-1 align-top text-2xl text-gold">%</span>
          </p>
          <div className="mt-6 h-px w-56 bg-white/12 sm:w-72" aria-hidden="true">
            <div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-4 text-[10.5px] uppercase tracking-[0.24em] text-bone/45">
            {chunkReady ? `Materiais ${loaded} / ${Math.max(total, loaded)}` : 'Preparando o motor 3D'}
          </p>
          {errors.length > 0 && (
            <div className="mt-8 max-w-md border border-red-300/30 px-5 py-3 text-sm text-red-100" role="alert">
              Não foi possível carregar {errors.length} arquivo(s). Verifique a conexão.
              <button className="ml-3 underline underline-offset-4" onClick={() => window.location.reload()}>
                Tentar de novo
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
