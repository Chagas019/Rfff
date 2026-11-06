import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { CarConfigurator } from '../components/garage3d/CarConfigurator';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';

/** Garagem 3D: configurador com os modelos licenciados dos carros 2026. */
export function GaragePage() {
  const [q] = useSearchParams();
  const pilot = drivers.find((d) => d.id === q.get('piloto'));
  const team = teams.find((t) => t.id === q.get('equipe'))?.id ?? pilot?.teamId ?? 'ferrari';
  return (
    <>
      <PageHeader kicker="Configurador" title={<>Garagem <span className="text-gold">3D</span></>}>
        <p>Os carros de 2026 em estúdio: gire 360°, aproxime, veja de frente, de trás, de lado ou de cima, em tela cheia, e desmonte as peças na vista explodida.</p>
      </PageHeader>
      <div className="container-grid py-8"><CarConfigurator initialTeam={team} initialDriver={pilot?.id} /></div>
    </>
  );
}
