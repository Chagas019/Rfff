import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { CarConfigurator } from '../components/garage3d/CarConfigurator';
import { teams } from '../data/teams';

/** Garagem 3D: configurador com os modelos licenciados dos carros 2026. */
export function GaragePage() {
  const [q] = useSearchParams();
  const team = teams.find((t) => t.id === q.get('equipe'))?.id ?? 'ferrari';
  return (
    <>
      <PageHeader kicker="Configurador" title={<>Garagem <span className="text-gold">3D</span></>}>
        <p>Os carros de 2026 em estúdio: gire com o mouse ou o dedo, aproxime e veja de cima, de lado ou de frente.</p>
      </PageHeader>
      <div className="container-grid py-10"><CarConfigurator initialTeam={team} /></div>
    </>
  );
}
