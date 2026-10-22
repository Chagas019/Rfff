import { motion } from 'motion/react';
import { roomById, rectArea, rectSize, roomHeight, LEVEL_NAMES, CATEGORY_NAMES } from '../data/plan';
import { furnitureForRoom } from '../data/furniture';
import { useExperience } from '../store/useExperience';
import { fmtArea, fmtLen } from '../utils/plan2d';
import { IconBulb, IconClose, IconWalk } from './icons';

/** Ficha técnica do cômodo selecionado: área, medidas, materiais, destaques e ações. */
export function RoomInfoPanel() {
  const id = useExperience((s) => s.selectedRoom);
  const lightOn = useExperience((s) => (id ? !!s.lights[id] : false));
  const toggleLight = useExperience((s) => s.toggleRoomLight);
  const walkInto = useExperience((s) => s.walkInto);
  const selectRoom = useExperience((s) => s.selectRoom);
  const rm = id ? roomById(id) : undefined;
  if (!rm) return null;
  const { w, d } = rectSize(rm.rect);
  const pieces = furnitureForRoom(rm.id).length;
  return (
    <motion.aside
      key={rm.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-2xl sm:w-80"
      aria-labelledby="room-title"
    >
      <div className="flex items-start justify-between gap-2 px-5 pt-4">
        <div>
          <p className="eyebrow">
            {LEVEL_NAMES[rm.level]} · {CATEGORY_NAMES[rm.category]}
          </p>
          <h2 id="room-title" className="mt-1 font-display text-3xl font-normal leading-tight text-bone">
            {rm.name}
          </h2>
        </div>
        <button className="btn-icon -mr-2" onClick={() => selectRoom(null)} aria-label="Fechar ficha do ambiente">
          <IconClose size={18} />
        </button>
      </div>
      <div className="scroll-thin overflow-y-auto px-5 pb-5">
        <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/10 text-center">
          {[
            ['Área', fmtArea(rectArea(rm.rect))],
            ['Medidas', `${fmtLen(w)} × ${fmtLen(d)}`],
            [rm.outdoor ? 'Peças' : 'Pé-direito', rm.outdoor ? String(pieces) : `${fmtLen(roomHeight(rm))} m`],
          ].map(([k, v]) => (
            <div key={k} className="bg-ink/60 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-bone/60">{k}</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-bone">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-bone/85">{rm.description}</p>
        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Materiais</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {rm.materials.map((m) => (
            <li key={m} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-bone/85">
              {m}
            </li>
          ))}
        </ul>
        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Destaques</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-bone/85">
          {rm.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-2 h-px w-3 shrink-0 bg-gold" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={() => walkInto(rm.id)} className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-bone px-4 text-sm font-semibold text-ink transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
            <IconWalk size={18} /> Caminhar aqui
          </button>
          {!rm.outdoor ? (
            <button
              onClick={() => toggleLight(rm.id)}
              aria-pressed={lightOn}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${lightOn ? 'border-gold/70 bg-gold/15 text-bone' : 'border-white/20 text-bone/80 hover:bg-white/10'}`}
            >
              <IconBulb size={18} /> {lightOn ? 'Luz acesa' : 'Luz apagada'}
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </motion.aside>
  );
}
