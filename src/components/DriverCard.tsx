import { motion } from 'framer-motion';
import { helmetImages } from '../data/carImages';
import { teamById } from '../data/teams';
import type { Driver, DriverStanding } from '../types';
import { DriverHelmet } from './DriverHelmet';
import { DriverPhoto } from './DriverPhoto';
import { FavoriteButton } from './FavoriteButton';
import { Flag } from './Flag';

/**
 * Card do piloto: retrato oficial sobre as cores da equipe, número, posição e pontos
 * no campeonato (dados ao vivo). O capacete real aparece quando existe imagem dele.
 */
export function DriverCard({ driver, onOpen, standing, standingsLoading = false }: { driver: Driver; onOpen: () => void; standing?: DriverStanding; standingsLoading?: boolean }) {
  const team = teamById(driver.teamId)!;
  const helmet = helmetImages[driver.id];
  return (
    <motion.article layout className="group panel relative h-full overflow-hidden transition hover:border-white/20" style={{ ['--team' as string]: team.color }}>
      <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`Abrir perfil de ${driver.firstName} ${driver.lastName}${standing ? `, ${standing.position}º no campeonato com ${standing.points} pontos` : ''}`}>
        <div className="relative aspect-[4/4.2] overflow-hidden" style={{ background: `linear-gradient(160deg, ${team.color}55 0%, ${team.color}18 45%, #0d0d12 100%)` }}>
          <span className="pointer-events-none absolute -left-1 top-1 font-display text-[5rem] font-black leading-none text-white/[0.12] sm:text-[7rem]" aria-hidden>{driver.number}</span>
          <DriverPhoto driver={driver} team={team} width={480} className="absolute inset-x-0 top-[6%] h-[175%] w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
          {helmet && <DriverHelmet driver={driver} team={team} className="absolute bottom-2 right-2 h-20 w-20 drop-shadow-xl" />}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-carbon-900 to-transparent" aria-hidden />
          {/* posição no campeonato */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {standing ? (
              <span className="rounded-md bg-black/70 px-2 py-1 font-display text-sm font-black text-white backdrop-blur">P{standing.position}</span>
            ) : standingsLoading ? <span className="h-7 w-10 animate-pulse rounded-md bg-black/40" aria-hidden /> : null}
          </div>
        </div>
        <div className="relative -mt-6 px-3 pb-4 sm:px-4 sm:pr-14">
          <p className="text-sm text-zinc-400">{driver.firstName}</p>
          <h3 className="truncate text-xl leading-none sm:text-2xl">{driver.lastName}</h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: team.color }} aria-hidden />
            {team.name}
            <span className="text-zinc-600">·</span>
            <Flag code={driver.countryCode} country={driver.nationality} />
            <span className="font-mono text-zinc-500">#{driver.number}</span>
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
            {[['Pontos', standing?.points], ['Vitórias', standing?.wins], ['Pódios', standing?.podiums]].map(([k, v]) => (
              <div key={k as string}>
                <dt className="kicker text-[9px] text-zinc-500">{k}</dt>
                <dd className="font-display text-base font-black text-white tabular sm:text-lg">{v ?? (standingsLoading ? '·' : '—')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </button>
      <div className="absolute right-2 top-2 sm:bottom-[4.6rem] sm:right-3 sm:top-auto"><FavoriteButton kind="driver" id={driver.id} label={`${driver.firstName} ${driver.lastName}`} /></div>
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: team.color }} aria-hidden />
    </motion.article>
  );
}
