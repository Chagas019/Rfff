import { motion } from 'motion/react';
import { ROOMS, roomById, rectArea, rectSize, roomHeight, LEVEL_NAMES, CATEGORY_NAMES } from '../data/plan';
import { useExperience } from '../store/useExperience';
import { fmtArea, fmtLen } from '../utils/plan2d';
import { IconArrowRight, IconBulb, IconClose } from './icons';

/** Ficha do cômodo em estilo de caderno de projeto: número, nome, medidas, materiais e ações. */
export function RoomInfoPanel() {
  const id = useExperience((s) => s.selectedRoom);
  const lightOn = useExperience((s) => (id ? !!s.lights[id] : false));
  const toggleLight = useExperience((s) => s.toggleRoomLight);
  const walkInto = useExperience((s) => s.walkInto);
  const selectRoom = useExperience((s) => s.selectRoom);
  const rm = id ? roomById(id) : undefined;
  if (!rm) return null;
  const { w, d } = rectSize(rm.rect);
  const index = ROOMS.indexOf(rm) + 1;
  return (
    <motion.aside
      key={rm.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong pointer-events-auto flex max-h-full w-full flex-col overflow-hidden sm:w-[22rem]"
      aria-labelledby="room-title"
    >
      <div className="flex items-start justify-between border-b border-white/10 py-2 pl-7 pr-2">
        <p className="eyebrow pt-3">
          <span className="numeral mr-3 text-[13px] tracking-normal text-gold">{String(index).padStart(2, '0')}</span>
          {LEVEL_NAMES[rm.level]} · {CATEGORY_NAMES[rm.category]}
        </p>
        <button className="btn-icon" onClick={() => selectRoom(null)} aria-label="Fechar ficha do ambiente">
          <IconClose size={16} />
        </button>
      </div>
      <div className="scroll-thin overflow-y-auto px-7 pb-7">
        <h2 id="room-title" className="mt-5 font-display text-[2.4rem] font-light leading-[1.02] text-bone">
          {rm.name}
        </h2>
        <dl className="mt-6 grid grid-cols-3 border-y border-white/10">
          {[
            ['Área', fmtArea(rectArea(rm.rect))],
            ['Medidas', `${fmtLen(w)}×${fmtLen(d)}`],
            [rm.outdoor ? 'Uso' : 'Pé-direito', rm.outdoor ? 'Externo' : `${fmtLen(roomHeight(rm))} m`],
          ].map(([k, v], i) => (
            <div key={k} className={`py-3.5 ${i > 0 ? 'border-l border-white/10 pl-4' : ''}`}>
              <dt className="text-[9.5px] uppercase tracking-[0.24em] text-bone/50">{k}</dt>
              <dd className="numeral mt-1 whitespace-nowrap text-[17px] text-bone">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[13.5px] font-light leading-relaxed text-bone/80">{rm.description}</p>

        <h3 className="eyebrow mt-7 text-[10px]">Materiais</h3>
        <ul className="mt-2 divide-y divide-white/[0.07] text-[13px] text-bone/85">
          {rm.materials.map((m) => (
            <li key={m} className="py-2">
              {m}
            </li>
          ))}
        </ul>

        <h3 className="eyebrow mt-6 text-[10px]">Destaques</h3>
        <ol className="mt-2 space-y-2 text-[13px] text-bone/85">
          {rm.features.map((f, i) => (
            <li key={f} className="grid grid-cols-[1.75rem_1fr]">
              <span className="numeral text-[13px] text-gold/80">{String(i + 1).padStart(2, '0')}</span>
              {f}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <button onClick={() => walkInto(rm.id)} className="btn-primary group min-h-[46px] px-5">
            Caminhar aqui <IconArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          {!rm.outdoor && (
            <button onClick={() => toggleLight(rm.id)} aria-pressed={lightOn} className={`btn-line ${lightOn ? 'text-gold' : ''}`}>
              <IconBulb size={16} /> {lightOn ? 'Luz acesa' : 'Luz apagada'}
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
