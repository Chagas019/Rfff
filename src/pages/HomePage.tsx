import { ArrowRight, Brain, Flag as FlagIcon, Lightbulb, Radio, Timer, Users, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CarPhoto } from '../components/CarPhoto';
import { Garage } from '../components/Garage';
import { CinematicHero } from '../components/hero/CinematicHero';
import { HubHeader } from '../components/HubHeader';
import { LastRacePodium } from '../components/LastRacePodium';
import { Lazy } from '../components/Lazy';
import { NewsHub } from '../components/NewsHub';
import { PhoneHero } from '../components/PhoneHero';
import { RaceCard } from '../components/RaceCard';
import { Reveal } from '../components/Reveal';
import { FeaturedDrivers } from '../components/hub/FeaturedDrivers';
import { NewsTicker } from '../components/hub/NewsTicker';
import { NextRaceCard } from '../components/hub/NextRaceCard';
import { ResultsHistory } from '../components/hub/ResultsHistory';
import { SeasonStats } from '../components/hub/SeasonStats';
import { SeasonStatus } from '../components/hub/SeasonStatus';
import { StandingsPreview } from '../components/hub/StandingsPreview';
import { WeekendPulse } from '../components/hub/WeekendPulse';
import { weekendFocus } from '../components/live/useWeekend';
import { races } from '../data/calendar2026';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';
import { useNow } from '../hooks/useNow';
import { teamPhotoQuery } from '../services/carPhotos';
import { formatWeekend } from '../utils/format';
import { getNextRace, getRaceStatus } from '../utils/race';
import { lastCompleted } from '../utils/season';

const GAMES = [
  { to: '/jogos/luzes', icon: Lightbulb, title: 'Luzes de largada', text: 'Reflexo' },
  { to: '/jogos/pit-stop', icon: Wrench, title: 'Pit stop', text: 'Velocidade' },
  { to: '/jogos/quiz', icon: Brain, title: 'Quiz 2026', text: 'Conhecimento' },
];

/**
 * Página inicial em formato de central: primeiro o que está acontecendo (GP atual ou último,
 * próxima sessão, campeonato), depois notícias, pódio, rankings, destaques e histórico.
 */
export function HomePage() {
  const now = useNow(30_000);
  const next = getNextRace(races, now);
  const { race: focus, mode } = weekendFocus(now);
  const last = lastCompleted(races, now);
  const upcoming = races.filter((r) => !r.cancelled && ['next', 'upcoming'].includes(getRaceStatus(r, races, now)) && r.id !== focus?.id).slice(0, 3);
  const total = races.filter((r) => !r.cancelled).length;

  const fallbackTicker = [
    `Temporada 2026 · ${total} Grandes Prêmios`,
    next ? `Próxima: ${next.name} · ${formatWeekend(next.weekendStart, next.weekendEnd)}` : 'Temporada encerrada',
    `${teams.length} equipes · ${drivers.length} pilotos`,
  ];

  return (
    <>
      {/* 0. Hero cinematográfico: carrossel dos pilotos */}
      <CinematicHero />

      {/* 1. Agora: GP atual/último, próxima sessão e campeonato */}
      <section className="container-grid pb-10 pt-10 sm:pt-14" aria-labelledby="hero-title">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker flex items-center gap-2 text-gold">
              {mode === 'live' ? <><span className="h-2 w-2 animate-pulse rounded-full bg-race" aria-hidden />Fim de semana de corrida</> : 'Temporada 2026 · Nova era técnica'}
            </p>
            <h2 id="hero-title" className="mt-2 text-4xl leading-[0.9] sm:text-5xl">Agora na <span className="text-gold">Fórmula 1</span></h2>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Atalhos">
            <Link to="/calendario" className="btn-ghost py-2.5"><FlagIcon className="h-4 w-4" aria-hidden />Explorar temporada</Link>
            <Link to={next ? `/calendario/${next.id}` : '/calendario'} className="btn-ghost py-2.5"><Timer className="h-4 w-4" aria-hidden />Ver próxima corrida</Link>
            <Link to="/pilotos" className="btn-ghost py-2.5"><Users className="h-4 w-4" aria-hidden />Conhecer os pilotos</Link>
            <Link to="/live" className="btn-primary py-2.5"><Radio className="h-4 w-4" aria-hidden />F1 Live</Link>
          </nav>
        </div>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
          {focus ? <WeekendPulse race={focus} mode={mode} now={now} /> : <div className="panel p-6 text-zinc-400">A temporada ainda não começou.</div>}
          <NextRaceCard />
          <div className="lg:col-span-2 xl:col-span-1"><SeasonStatus /></div>
        </div>
      </section>

      <NewsTicker fallback={fallbackTicker} />

      <div className="container-grid space-y-16 py-14 sm:space-y-20">
        {/* 2. Notícias em evidência */}
        <section aria-labelledby="news-title">
          <HubHeader kicker="Destaques da semana" title={<span id="news-title">Notícias em evidência</span>} action={<Link to="/live" className="btn-ghost py-2 text-xs">Todas no F1 Live <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
          <NewsHub variant="home" />
        </section>

        {/* 3. Pódio da última corrida */}
        {last && <LastRacePodium race={last} />}

        {/* 4. Rankings */}
        <Lazy><StandingsPreview /></Lazy>

        {/* 5. Pilotos em destaque */}
        <Lazy minHeight={480}><FeaturedDrivers /></Lazy>

        {/* 6. Curiosidades */}
        <Lazy><SeasonStats /></Lazy>

        {/* 7. Próximas corridas */}
        <section aria-labelledby="agenda-title">
          <HubHeader kicker="Agenda" title={<span id="agenda-title">Próximas corridas</span>} action={<Link to="/calendario" className="btn-ghost py-2 text-xs">Calendário completo <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
          {upcoming.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {upcoming.map((r, i) => <Reveal key={r.id} delay={i * 0.06}><RaceCard race={r} status={getRaceStatus(r, races, now)} /></Reveal>)}
            </div>
          ) : <p className="text-zinc-400">Não há mais etapas nesta temporada.</p>}
        </section>

        {/* 8. Histórico */}
        <Lazy><ResultsHistory /></Lazy>

        {/* 9. Jogos */}
        <section aria-labelledby="games-title" className="panel p-6 sm:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="kicker text-gold">Área de diversão</p>
              <h2 id="games-title" className="mt-2 text-3xl">Jogos do box</h2>
              <p className="mt-2 text-sm text-zinc-400">Reflexo nas luzes de largada, o pit stop mais rápido e o quiz do grid 2026. Recordes salvos no seu aparelho.</p>
              <Link to="/jogos" className="btn-primary mt-5">Jogar agora <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {GAMES.map((g) => (
                <Link key={g.to} to={g.to} className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center transition hover:-translate-y-0.5 hover:border-white/20">
                  <g.icon className="h-7 w-7 text-race transition group-hover:scale-110" aria-hidden />
                  <span className="font-display text-sm font-semibold text-white sm:text-base">{g.title}</span>
                  <span className="kicker text-[10px] text-zinc-500">{g.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* 10. Vitrine: os três celulares (Hamilton, Silverstone, Ferrari) */}
      <Lazy minHeight={700}><PhoneHero /></Lazy>

      <div className="container-grid space-y-16 py-14 sm:space-y-20">
        {/* 11. Garagem e regulamento */}
        <section aria-labelledby="garage-title">
          <HubHeader kicker="Showroom" title={<span id="garage-title">Garagem 2026</span>} action={<Link to="/equipes" className="btn-ghost py-2 text-xs">Todas as equipes <ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
            Os carros da nova era, lado a lado. Arraste, use as setas ou deixe a garagem girar sozinha.
          </HubHeader>
          <Lazy minHeight={480}><Garage /></Lazy>
        </section>

        <section className="panel overflow-hidden p-6 sm:p-8" aria-labelledby="rules-title">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="kicker text-gold">Regulamento 2026</p>
              <h2 id="rules-title" className="mt-2 text-2xl sm:text-3xl">Carros menores, mais leves e mais elétricos</h2>
              <p className="mt-3 text-zinc-400">A nova geração usa combustível 100% sustentável, divide a potência quase igualmente entre motor a combustão e elétrico e substitui o DRS por asas móveis.</p>
              <a href="https://www.fia.com/regulation/category/110" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-white">Regulamentos na FIA <ArrowRight className="h-4 w-4" aria-hidden /></a>
            </div>
            <Lazy minHeight={240}>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <CarPhoto photoKey="ferrari" query={teamPhotoQuery('ferrari')} alt="Foto do Ferrari SF-26 de 2026" searchTerm="Ferrari SF-26" className="aspect-[16/9]" />
              </div>
            </Lazy>
          </div>
        </section>
      </div>
    </>
  );
}
