import { motion } from 'framer-motion';
import { Building2, Cpu, Trophy, User } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CarPhoto } from '../components/CarPhoto';
import { teamPhotoQuery } from '../services/carPhotos';
import { FavoriteButton } from '../components/FavoriteButton';
import { Garage } from '../components/Garage';
import { StudioCar } from '../components/StudioCar';
import { studioImageFor } from '../data/carImages';
import { DriverHelmet } from '../components/DriverHelmet';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Reveal } from '../components/Reveal';
import { SourceNote } from '../components/SourceNote';
import { TeamCard } from '../components/TeamCard';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';

export function TeamsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selected = teams.find((t) => t.id === id);
  const lineup = selected ? drivers.filter((d) => d.teamId === selected.id) : [];

  return (
    <>
      <PageHeader kicker="Construtores 2026" title={<>Equipes &amp; <span className="text-gold">carros</span></>}>
        <p>Onze equipes, cinco fabricantes de motor e um regulamento novo em folha. Passe o mouse nos carros para dar zoom.</p>
      </PageHeader>
      <div className="container-grid py-10">
        <div className="mb-16"><Garage /></div>
        <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
          <strong className="text-white">Sobre as fotos:</strong> os carros aparecem em imagens de estúdio quando há uma cadastrada (com crédito) e, nos demais casos, em fotos reais com licença livre do Wikimedia Commons, com autor e licença. Quando ainda não há foto livre de um carro, o card avisa.
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.06}><TeamCard team={t} onOpen={() => navigate(`/equipes/${t.id}`)} /></Reveal>
          ))}
        </div>
        <SourceNote label="formula1.com — equipes 2026" url="https://www.formula1.com/en/teams">Títulos de construtores contabilizados até 2025.</SourceNote>
      </div>

      <Modal open={!!selected} onClose={() => navigate('/equipes')} title={selected?.name ?? 'Equipe'} accent={selected?.color} wide>
        {selected && (
          <div>
            <div className="relative overflow-hidden p-6 pb-0 sm:p-8 sm:pb-0" style={{ background: `radial-gradient(700px 260px at 70% 10%, ${selected.color}44, transparent 70%)` }}>
              <p className="label" style={{ color: selected.color }}>{selected.fullName}</p>
              <h2 className="pr-10 text-3xl font-semibold sm:text-5xl">{selected.name} <span className="text-xl text-zinc-400 sm:text-2xl">{selected.car}</span></h2>
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                {studioImageFor(selected.id) ? <StudioCar team={selected} className="aspect-[16/9]" /> : <CarPhoto photoKey={selected.id} query={teamPhotoQuery(selected.id)} alt={`Foto do carro ${selected.name} ${selected.car} de 2026`} searchTerm={`${selected.name} ${selected.car}`} color={selected.color} className="aspect-[16/9]" />}
              </motion.div>
            </div>
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <h3 className="label mb-2">História</h3>
                <p className="text-zinc-300">{selected.history}</p>
                <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
                  {[
                    [Building2, 'Sede', selected.base],
                    [User, 'Chefe de equipe', selected.teamPrincipal],
                    [Cpu, 'Unidade de potência', selected.powerUnit],
                    [Trophy, 'Títulos de construtores', selected.constructorsTitles],
                  ].map(([Icon, k, v]) => {
                    const I = Icon as typeof Trophy;
                    return (
                      <div key={k as string} className="rounded-lg bg-white/[0.03] p-3">
                        <dt className="label flex items-center gap-1.5 text-[10px]"><I className="h-3 w-3" aria-hidden />{k as string}</dt>
                        <dd className="mt-1 font-semibold text-white">{v as string}</dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-2 text-[11px] text-zinc-500">Primeira temporada com a identidade atual: {selected.firstEntry}.</p>
              </div>
              <div>
                <h3 className="label mb-2">Pilotos 2026</h3>
                <ul className="space-y-2">
                  {lineup.map((d) => (
                    <li key={d.id}>
                      <Link to={`/pilotos/${d.id}`} className="panel-hover flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 pr-4">
                        <DriverHelmet driver={d} team={selected} className="h-14 w-14" />
                        <span className="flex-1"><span className="block text-xs text-zinc-400">#{d.number}</span><span className="font-bold text-white">{d.firstName} {d.lastName}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <span className="h-8 flex-1 rounded" style={{ background: selected.color }} title={`Cor principal ${selected.color}`} />
                  <span className="h-8 w-16 rounded" style={{ background: selected.accent }} title={`Cor secundária ${selected.accent}`} />
                </div>
                <div className="mt-4"><FavoriteButton kind="team" id={selected.id} label={selected.name} variant="full" /></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
