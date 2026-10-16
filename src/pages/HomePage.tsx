import { motion } from 'framer-motion';
import { ArrowRight, Brain, CalendarDays, Clock, Cpu, Flag as FlagIcon, Gauge, Lightbulb, MapPin, Trophy, Users, Wrench, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CarPhoto } from '../components/CarPhoto';
import { FavoriteButton } from '../components/FavoriteButton';
import { Flag } from '../components/Flag';
import { Garage } from '../components/Garage';
import { Hero } from '../components/Hero';
import { LastRacePodium } from '../components/LastRacePodium';
import { RaceCard } from '../components/RaceCard';
import { RaceCountdown } from '../components/RaceCountdown';
import { Reveal } from '../components/Reveal';
import { SectionHeader } from '../components/SectionHeader';
import { ShareButton } from '../components/ShareButton';
import { StatusBadge } from '../components/StatusBadge';
import { Ticker } from '../components/Ticker';
import { TrackMap } from '../components/TrackMap';
import { races } from '../data/calendar2026';
import { circuits } from '../data/circuits';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';
import { useNow } from '../hooks/useNow';
import { teamPhotoQuery } from '../services/carPhotos';
import { formatDateTime, formatWeekend, userTimeZone } from '../utils/format';
import { getNextRace, getRaceStart, getRaceStatus } from '../utils/race';

const PILLARS = [
  { icon: FlagIcon, title: 'Corridas', text: '22 etapas em 5 continentes, de Melbourne a Abu Dhabi.', to: '/calendario' },
  { icon: Cpu, title: 'Tecnologia', text: 'Motores com ~50% de potência elétrica, combustível sustentável e aerodinâmica ativa.', to: '/equipes' },
  { icon: Users, title: 'Pilotos', text: '22 pilotos titulares, incluindo um estreante e um brasileiro.', to: '/pilotos' },
  { icon: Gauge, title: 'Circuitos', text: 'Clássicos, ruas noturnas e a estreia de Madri.', to: '/circuitos' },
  { icon: Trophy, title: 'Classificação', text: 'Pontos de pilotos e construtores direto da fonte de dados.', to: '/classificacao' },
];

export function HomePage() {
  const now = useNow(30000);
  const next = getNextRace(races, now);
  const nextCircuit = next ? circuits.find((c) => c.id === next.circuitId) : undefined;
  const nextStatus = next ? getRaceStatus(next, races, now) : null;
  const upcoming = races.filter((r) => !r.cancelled && ['next', 'upcoming', 'live'].includes(getRaceStatus(r, races, now))).slice(0, 3);
  const completed = races.filter((r) => getRaceStatus(r, races, now) === 'completed').length;
  const total = races.filter((r) => !r.cancelled).length;
  const lastRace = [...races].reverse().find((r) => r.round && getRaceStatus(r, races, now) === 'completed');

  const ticker = [
    `Temporada 2026 · ${total} Grandes Prêmios`,
    `${completed} de ${total} etapas concluídas`,
    next ? `Próxima: ${next.name} · ${formatWeekend(next.weekendStart, next.weekendEnd)}` : 'Temporada encerrada',
    `${teams.length} equipes · ${drivers.length} pilotos`,
    'Novas equipes: Audi e Cadillac',
    '6 fins de semana com Sprint',
    'GPs do Bahrein e da Arábia Saudita cancelados',
    'Estreia do circuito de Madri',
  ];

  return (
    <>
      <Hero nextRace={next} />
      <Ticker items={ticker} />

      {/* Próximo Grande Prêmio */}
      <section id="proxima" className="container-grid scroll-mt-24 py-20" aria-labelledby="next-title">
        <SectionHeader kicker="Próximo Grande Prêmio" title={<span id="next-title">Luzes vermelhas em breve</span>} />
        {next && nextCircuit ? (
          <Reveal>
            <article className="panel scanlines grid overflow-hidden lg:grid-cols-[1.2fr_1fr]">
              <div className="relative p-6 sm:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  {nextStatus && <StatusBadge status={nextStatus} />}
                  <span className="chip">Rodada {next.round} de {total}</span>
                  {next.sprint && <span className="chip border-telemetry-yellow/40 text-telemetry-yellow"><Zap className="h-3 w-3" aria-hidden />Sprint</span>}
                </div>
                <h3 className="mt-5 text-3xl font-black uppercase sm:text-5xl">
                  <Flag code={next.countryCode} country={next.country} className="mr-3 align-middle" />{next.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-zinc-400"><MapPin className="h-4 w-4 text-race" aria-hidden />{next.city}, {next.country} · {nextCircuit.name}</p>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <dt className="label flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" aria-hidden />Fim de semana</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-white">{formatWeekend(next.weekendStart, next.weekendEnd)} 2026</dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <dt className="label flex items-center gap-2"><Clock className="h-3.5 w-3.5" aria-hidden />Largada</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-white">{formatDateTime(getRaceStart(next)!)}</dd>
                  </div>
                </dl>
                <div className="mt-6"><RaceCountdown race={next} /></div>
                <p className="mt-3 text-xs text-zinc-500">
                  Horários no seu fuso ({userTimeZone()}). {!next.timesConfirmed && 'Horário estimado — confirme no site oficial da F1.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={`/calendario/${next.id}`} className="btn-primary">Ver detalhes <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                  <FavoriteButton kind="race" id={next.id} label={next.name} variant="full" />
                  <ShareButton title={next.name} text={`${next.name} — ${formatWeekend(next.weekendStart, next.weekendEnd)} 2026`} path={`/calendario/${next.id}`} />
                </div>
              </div>
              <div className="relative min-h-[320px] border-t border-white/5 bg-gradient-to-br from-carbon-800 to-black lg:border-l lg:border-t-0">
                <div className="grid-bg absolute inset-0" aria-hidden />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,6,0,0.18),transparent_60%)]" aria-hidden />
                <TrackMap points={nextCircuit.layout} name={nextCircuit.name} className="absolute inset-0 m-auto h-[85%] w-[85%]" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[11px] uppercase text-zinc-400">
                  <span>{nextCircuit.lengthKm.toFixed(3)} km</span><span>{nextCircuit.turns} curvas</span><span>{nextCircuit.laps} voltas</span>
                </div>
              </div>
            </article>
          </Reveal>
        ) : (
          <p className="panel p-8 text-zinc-400">A temporada 2026 foi encerrada. Volte em breve para o calendário de 2027.</p>
        )}
      </section>

      {/* Último resultado (atualiza sozinho) */}
      {lastRace && <LastRacePodium race={lastRace} />}

      {/* Jogos */}
      <section className="container-grid pb-20" aria-labelledby="games-title">
        <Reveal>
          <div className="panel relative overflow-hidden p-6 sm:p-10">
            <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(225,6,0,0.2),transparent_65%)]" aria-hidden />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.3fr]">
              <div>
                <p className="label text-race-400">Área de diversão</p>
                <h2 id="games-title" className="mt-2 text-3xl font-black uppercase sm:text-4xl">Jogos do box</h2>
                <p className="mt-3 text-zinc-400">Teste seu reflexo nas luzes de largada, faça o pit stop mais rápido e prove que conhece o grid de 2026. Depois, desafie os amigos.</p>
                <Link to="/jogos" className="btn-primary mt-6">Jogar agora <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { to: '/jogos/luzes', icon: Lightbulb, title: 'Luzes de largada', text: 'Reflexo' },
                  { to: '/jogos/pit-stop', icon: Wrench, title: 'Pit stop', text: 'Velocidade' },
                  { to: '/jogos/quiz', icon: Brain, title: 'Quiz 2026', text: 'Conhecimento' },
                ].map((g) => (
                  <Link key={g.to} to={g.to} className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:-translate-y-1 hover:border-race/60 hover:bg-race/10 sm:p-6">
                    <g.icon className="h-8 w-8 text-race transition group-hover:scale-110" aria-hidden />
                    <span className="font-display text-sm font-black uppercase text-white sm:text-lg">{g.title}</span>
                    <span className="label text-[10px]">{g.text}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Garagem */}
      <section className="container-grid pb-20" aria-labelledby="garage-title">
        <SectionHeader kicker="Showroom" title={<span id="garage-title">Garagem 2026</span>} action={<Link to="/equipes" className="btn-ghost self-start">Todas as equipes <ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
          Os carros da nova era, lado a lado. Arraste, use as setas ou deixe a garagem girar sozinha.
        </SectionHeader>
        <Reveal><Garage /></Reveal>
      </section>

      {/* Pilares */}
      <section className="relative overflow-hidden border-y border-white/5 bg-black/40 py-20">
        <div className="container-grid">
          <SectionHeader
            kicker="Ecossistema F1"
            title="Não é só esporte — é ciência em alta velocidade"
            action={<Link to="/calendario" className="btn-primary self-start">Ver calendário da temporada</Link>}
          >
            Dez equipes viraram onze. Um regulamento completamente novo. Dezenas de engenheiros por trás de cada décimo de segundo.
          </SectionHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <Link to={p.to} className="panel panel-hover group flex h-full min-h-[200px] flex-col justify-between p-5">
                  <p.icon className="h-7 w-7 text-race transition group-hover:scale-110" aria-hidden />
                  <div>
                    <h3 className="text-lg font-bold uppercase">{p.title}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{p.text}</p>
                  </div>
                  <ArrowRight className="mt-3 h-4 w-4 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-race" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal className="relative mt-10">
            <div className="panel relative overflow-hidden p-6 sm:p-10">
              <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  <p className="label text-race-400">Regulamento 2026</p>
                  <h3 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Carros menores, mais leves e mais elétricos</h3>
                  <p className="mt-3 text-zinc-400">A nova geração usa combustível 100% sustentável, divide a potência quase igualmente entre motor a combustão e elétrico e substitui o DRS por asas móveis.</p>
                  <a href="https://www.fia.com/regulation/category/110" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-race-400 hover:text-white">
                    Regulamentos na FIA <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} className="group relative overflow-hidden rounded-2xl border border-white/10">
                  <CarPhoto photoKey="ferrari" query={teamPhotoQuery('ferrari')} alt="Foto do Ferrari SF-26 de 2026" searchTerm="Ferrari SF-26" className="aspect-[16/9]" imgClassName="transition duration-700 group-hover:scale-105" />
                </motion.div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Próximas etapas */}
      <section className="container-grid py-20">
        <SectionHeader kicker="Agenda" title="Próximas etapas" action={<Link to="/calendario" className="btn-ghost self-start">Calendário completo <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
        {upcoming.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {upcoming.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.08}><RaceCard race={r} status={getRaceStatus(r, races, now)} /></Reveal>
            ))}
          </div>
        ) : (
          <p className="text-zinc-400">Não há mais etapas nesta temporada.</p>
        )}
      </section>
    </>
  );
}
