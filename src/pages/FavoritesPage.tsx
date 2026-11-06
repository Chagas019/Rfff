import { Heart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CircuitCard } from '../components/CircuitCard';
import { DriverCard } from '../components/DriverCard';
import { PageHeader } from '../components/PageHeader';
import { RaceCard } from '../components/RaceCard';
import { EmptyState } from '../components/States';
import { TeamCard } from '../components/TeamCard';
import { races } from '../data/calendar2026';
import { circuits } from '../data/circuits';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';
import { useFavorites } from '../hooks/useFavorites';
import { useNow } from '../hooks/useNow';
import { getRaceStatus } from '../utils/race';

export function FavoritesPage() {
  const { favorites, count, clearFavorites } = useFavorites();
  const navigate = useNavigate();
  const now = useNow(60000);
  const favRaces = races.filter((r) => favorites.race.includes(r.id));
  const favCircuits = circuits.filter((c) => favorites.circuit.includes(c.id));
  const favDrivers = drivers.filter((d) => favorites.driver.includes(d.id));
  const favTeams = teams.filter((t) => favorites.team.includes(t.id));

  const section = (title: string, n: number, children: React.ReactNode) =>
    n > 0 && (
      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-3 text-xl font-bold">{title}<span className="chip">{n}</span></h2>
        {children}
      </section>
    );

  return (
    <>
      <PageHeader kicker="Sua garagem" title={<>Meus <span className="text-gold">favoritos</span></>}>
        <p>Corridas, circuitos, pilotos e equipes que você marcou com <Heart className="inline h-4 w-4 fill-gold text-gold" aria-label="coração" />. Ficam salvos neste navegador.</p>
      </PageHeader>
      <div className="container-grid py-10">
        {count === 0 ? (
          <EmptyState
            title="Nenhum favorito ainda"
            message="Toque no coração em qualquer corrida, circuito, piloto ou equipe para montar sua lista."
            action={<button type="button" className="btn-primary" onClick={() => navigate('/pilotos')}>Explorar pilotos</button>}
          />
        ) : (
          <>
            <div className="mb-8 flex justify-end">
              <button type="button" className="btn-ghost" onClick={() => window.confirm('Remover todos os favoritos?') && clearFavorites()}>
                <Trash2 className="h-4 w-4" aria-hidden /> Limpar tudo
              </button>
            </div>
            {section('Corridas', favRaces.length, <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{favRaces.map((r) => <RaceCard key={r.id} race={r} status={getRaceStatus(r, races, now)} />)}</div>)}
            {section('Circuitos', favCircuits.length, <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{favCircuits.map((c) => <CircuitCard key={c.id} circuit={c} round={races.find((r) => r.circuitId === c.id)?.round ?? null} onOpen={() => navigate(`/circuitos/${c.id}`)} />)}</div>)}
            {section('Pilotos', favDrivers.length, <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{favDrivers.map((d) => <DriverCard key={d.id} driver={d} onOpen={() => navigate(`/pilotos/${d.id}`)} />)}</div>)}
            {section('Equipes', favTeams.length, <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{favTeams.map((t) => <TeamCard key={t.id} team={t} onOpen={() => navigate(`/equipes/${t.id}`)} />)}</div>)}
          </>
        )}
      </div>
    </>
  );
}
