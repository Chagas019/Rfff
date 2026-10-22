import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Tela de carregamento com progresso real (texturas e modelos registrados no
 * gerenciador de carregamento do three.js) e tratamento de falhas.
 */
export function LoadingScreen({ chunkReady }: { chunkReady: boolean }) {
  const { progress, active, errors, loaded, total } = useProgress();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (chunkReady && !active && total > 0 && progress >= 100) {
      const id = window.setTimeout(() => setDone(true), 450);
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-6 text-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
          role="status"
          aria-live="polite"
        >
          <p className="eyebrow mb-5">Experiência arquitetônica 3D</p>
          <h1 className="font-display text-4xl font-light tracking-[0.18em] text-bone sm:text-6xl">MANSÃO INFINITY</h1>
          <div className="mt-10 h-px w-64 overflow-hidden bg-white/15 sm:w-80" aria-hidden="true">
            <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-4 text-sm tabular-nums text-bone/80">
            {pct}% <span className="text-bone/50">· {chunkReady ? `${loaded} de ${Math.max(total, loaded)} texturas PBR` : 'preparando o motor 3D'}</span>
          </p>
          {errors.length > 0 && (
            <div className="mt-6 max-w-md rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100" role="alert">
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
