import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Kind = 'success' | 'info' | 'error';
interface Toast { id: number; message: string; kind: Kind }

const Ctx = createContext<(message: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const Icon = { success: CheckCircle2, info: Info, error: XCircle };
  return (
    <Ctx.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const I = Icon[t.kind];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-white shadow-2xl"
              >
                <I className={t.kind === 'error' ? 'h-5 w-5 text-race' : t.kind === 'info' ? 'h-5 w-5 text-telemetry-cyan' : 'h-5 w-5 text-telemetry-green'} aria-hidden />
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
