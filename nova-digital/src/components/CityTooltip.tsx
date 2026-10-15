import { AnimatePresence, motion } from 'framer-motion';
import type { City } from '../data/types';

interface Props {
  hover: { city: City; x: number; y: number } | null;
}

/** Etiqueta que acompanha o cursor ao passar sobre um ponto do globo. */
export function CityTooltip({ hover }: Props) {
  return (
    <AnimatePresence>
      {hover && (
        <motion.div
          key={hover.city.id}
          role="tooltip"
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed z-[60] -translate-x-1/2 rounded-xl border border-cork bg-void-800/85 px-3.5 py-2.5"
          style={{ left: hover.x, top: hover.y - 74 }}
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-glow" />
            <span className="text-sm font-medium text-ink">{hover.city.name}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase text-ink-mute">
            {hover.city.country} · clique para detalhes
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
