import { helmetImages } from '../data/carImages';
import type { Driver, Team } from '../types';
import { HelmetAvatar } from './HelmetAvatar';

/** Capacete real (PNG recortado) quando houver; senão, a arte gerada nas cores da equipe. */
export function DriverHelmet({ driver, team, className = '' }: { driver: Driver; team: Team; className?: string }) {
  const img = helmetImages[driver.id];
  if (img) {
    return <img src={img.src} alt={img.caption} title={img.credit} loading="lazy" className={`object-contain p-3 drop-shadow-[0_20px_25px_rgba(0,0,0,0.6)] ${className}`} />;
  }
  return <HelmetAvatar color={team.color} accent={team.accent} number={driver.number} code={driver.code} className={className} />;
}
