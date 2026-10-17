import { motion } from 'framer-motion';
import { ArrowUpRight, Timer } from 'lucide-react';
import type { Circuit } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { Flag } from './Flag';
import { TiltCard } from './TiltCard';
import { TrackMap } from './TrackMap';

export function CircuitCard({ circuit, round, onOpen, cancelled }: { circuit: Circuit; round: number | null; onOpen: () => void; cancelled?: boolean }) {
  return (
    <TiltCard className="h-full">
    <motion.article layout className={`panel panel-hover group flex h-full flex-col ${cancelled ? 'opacity-60' : ''}`}>
      <div className="relative h-52 overflow-hidden border-b border-white/5 bg-gradient-to-br from-carbon-800 to-carbon-950">
        <div className="grid-bg absolute inset-0 opacity-70" aria-hidden />
        <div className="absolute left-4 top-4 z-10 flex gap-2">
          <span className="chip bg-black/60">{round ? `Rodada ${round}` : 'Cancelada em 2026'}</span>
        </div>
        <div className="absolute right-4 top-4 z-10"><FavoriteButton kind="circuit" id={circuit.id} label={circuit.name} /></div>
        <div className="absolute inset-0 p-8 pt-12 transition duration-500 group-hover:scale-110">
          <TrackMap points={circuit.layout} name={circuit.name} className="h-full w-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-sm text-zinc-400"><Flag code={circuit.countryCode} country={circuit.country} /> {circuit.city}, {circuit.country}</p>
        <h3 className="mt-1 text-lg font-bold leading-tight">{circuit.name}</h3>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Km', circuit.lengthKm.toFixed(3)],
            ['Curvas', circuit.turns],
            ['Voltas', circuit.laps],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/[0.03] py-2">
              <dt className="label text-[12px]">{k}</dt>
              <dd className="font-display text-lg font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <Timer className="h-3.5 w-3.5 text-telemetry-purple" aria-hidden />
          {circuit.lapRecord ? <>Recorde: <span className="font-mono text-zinc-200">{circuit.lapRecord.time}</span> · {circuit.lapRecord.driver} ({circuit.lapRecord.year})</> : 'Recorde: sem dado verificado'}
        </p>
        <button type="button" onClick={onOpen} className="btn-ghost mt-5 w-full">
          Ver detalhes <ArrowUpRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.article>
    </TiltCard>
  );
}
