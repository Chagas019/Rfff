import { useState } from 'react';
import { PHOTO_CREDIT, driverPhotoUrl } from '../data/driverPhotos';
import type { Driver, Team } from '../types';
import { DriverHelmet } from './DriverHelmet';

/**
 * Retrato oficial do piloto (Formula 1). Se a imagem não carregar, mostra o capacete
 * real (quando existe) ou a arte nas cores da equipe — nunca fica um buraco na tela.
 */
export function DriverPhoto({ driver, team, width = 480, className = '', imgClassName = '', priority = false }: {
  driver: Driver; team: Team; width?: number; className?: string; imgClassName?: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = driverPhotoUrl(driver.id, team.id, width);
  if (!src || failed) return <DriverHelmet driver={driver} team={team} className={className} />;
  return (
    <img
      src={src}
      alt={`${driver.firstName} ${driver.lastName}`}
      title={PHOTO_CREDIT}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`${/\bobject-/.test(className) ? '' : 'object-cover object-top'} ${className} ${imgClassName}`}
    />
  );
}
