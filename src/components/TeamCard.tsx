import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { drivers } from '../data/drivers';
import type { Team } from '../types';
import { CarIllustration } from './CarIllustration';
import { FavoriteButton } from './FavoriteButton';

export function TeamCard({ team, onOpen }: { team: Team; onOpen: () => void }) {
  const lineup = drivers.filter((d) => d.teamId === team.id);
  return (
    <motion.article layout className="panel group relative h-full overflow-hidden">
      <div className="absolute inset-0 opacity-30 transition duration-500 group-hover:opacity-60" style={{ background: `radial-gradient(600px 200px at 70% 0%, ${team.color}55, transparent 70%)` }} aria-hidden />
      <div className="relative flex items-start justify-between p-6 pb-0">
        <div>
          <p className="label" style={{ color: team.color }}>{team.powerUnit} · {team.base.split(',')[0]}</p>
          <h3 className="mt-1 text-2xl font-black uppercase">{team.name}</h3>
          <p className="text-xs text-zinc-500">{team.fullName}</p>
        </div>
        <FavoriteButton kind="team" id={team.id} label={team.name} />
      </div>
      <div className="relative h-40 overflow-hidden">
        <motion.div className="absolute inset-x-0 bottom-0" whileHover={{ scale: 1.08, x: 10 }} transition={{ type: 'spring', stiffness: 200 }}>
          <CarIllustration color={team.color} accent={team.accent} title={`Ilustração genérica nas cores da ${team.name} (não é o carro oficial)`} className="w-full transition duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_30px_rgba(225,6,0,0.35)]" />
        </motion.div>
      </div>
      <div className="relative flex items-center justify-between gap-3 border-t border-white/5 p-6 pt-4">
        <ul className="text-sm">
          {lineup.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-zinc-300">
              <span className="w-7 font-display text-xs font-bold" style={{ color: team.color }}>#{d.number}</span>
              {d.firstName} <strong className="uppercase text-white">{d.lastName}</strong>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onOpen} className="btn-icon shrink-0" aria-label={`Ver história da ${team.name}`}>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="flex h-1.5" aria-hidden>
        <span className="flex-[3]" style={{ background: team.color }} />
        <span className="flex-1" style={{ background: team.accent }} />
      </div>
    </motion.article>
  );
}
