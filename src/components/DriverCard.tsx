import { motion } from 'framer-motion';
import { teamById } from '../data/teams';
import type { Driver } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { Flag } from './Flag';
import { HelmetAvatar } from './HelmetAvatar';

export function DriverCard({ driver, onOpen }: { driver: Driver; onOpen: () => void }) {
  const team = teamById(driver.teamId)!;
  return (
    <motion.article layout whileHover={{ y: -6 }} className="panel group relative h-full transition" style={{ ['--team' as string]: team.color }}>
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: team.color }} aria-hidden />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-50" style={{ background: team.color }} aria-hidden />
      <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`Abrir perfil de ${driver.firstName} ${driver.lastName}`}>
        <div className="relative h-48 overflow-hidden">
          <span className="absolute left-4 top-3 font-display text-6xl font-black italic leading-none" style={{ color: team.color, opacity: 0.85 }}>{driver.number}</span>
          {driver.photoUrl ? (
            <img src={driver.photoUrl} alt={`${driver.firstName} ${driver.lastName}`} className="absolute bottom-0 right-0 h-full object-contain" loading="lazy" />
          ) : (
            <HelmetAvatar color={team.color} accent={team.accent} number={driver.number} code={driver.code} className="absolute -bottom-4 right-0 h-52 w-52 transition duration-500 group-hover:scale-110 group-hover:-rotate-3" />
          )}
        </div>
        <div className="border-t border-white/5 p-5 pr-16">
          <p className="text-sm text-zinc-400">{driver.firstName}</p>
          <h3 className="text-xl font-black uppercase leading-tight">{driver.lastName}</h3>
          <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: team.color }} aria-hidden />
            {team.name}
            <span className="text-zinc-600">·</span>
            <Flag code={driver.countryCode} country={driver.nationality} /> {driver.nationality}
          </p>
        </div>
      </button>
      <div className="absolute bottom-5 right-4"><FavoriteButton kind="driver" id={driver.id} label={`${driver.firstName} ${driver.lastName}`} /></div>
    </motion.article>
  );
}
