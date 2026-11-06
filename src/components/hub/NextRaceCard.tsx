import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { races } from '../../data/calendar2026';
import { circuits } from '../../data/circuits';
import { useNow } from '../../hooks/useNow';
import { SESSION_LABELS, getCountdown, pad2 } from '../../utils/race';
import { nextSession } from '../../utils/season';
import { clock, dayShort } from '../../utils/time';
import { formatWeekend } from '../../utils/format';
import { Flag } from '../Flag';
import { RaceCountdown } from '../RaceCountdown';
import { TrackMap } from '../TrackMap';

/** Próxima sessão (contagem ao segundo) e a corrida do fim de semana. */
export function NextRaceCard() {
  const now = useNow(1000);
  const ns = nextSession(races, now);
  if (!ns) return <div className="panel p-6 text-zinc-400">A temporada 2026 terminou. O calendário de 2027 aparece aqui quando for publicado.</div>;
  const { race, session, state } = ns;
  const circuit = circuits.find((c) => c.id === race.circuitId);
  const cd = getCountdown(new Date(session.start), now);
  return (
    <article className="panel flex h-full flex-col p-5 sm:p-6" aria-labelledby="next-race-title">
      <p className="kicker flex items-center gap-2 text-zinc-400">
        {state === 'live' ? <span className="flex items-center gap-2 text-race-400"><span className="h-2 w-2 animate-pulse rounded-full bg-race" aria-hidden />Ao vivo agora</span> : 'Próxima sessão'}
        <span className="text-zinc-600">·</span> Rodada {race.round}
      </p>
      <h2 id="next-race-title" className="mt-2 text-2xl leading-none sm:text-3xl"><Flag code={race.countryCode} country={race.country} className="mr-2 align-middle" />{race.name}</h2>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400"><MapPin className="h-3.5 w-3.5 text-race" aria-hidden />{circuit?.name} · {formatWeekend(race.weekendStart, race.weekendEnd)}</p>

      <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/30 p-4">
        <p className="flex items-baseline justify-between gap-2">
          <span className="font-condensed text-sm font-semibold uppercase tracking-wider text-white">{SESSION_LABELS[session.type]}</span>
          <span className="font-mono text-xs text-zinc-400">{dayShort(session.start)} · {clock(session.start)}</span>
        </p>
        {state === 'live' ? (
          <Link to="/live" className="mt-3 flex items-center justify-between rounded-lg bg-race px-4 py-3 font-condensed text-sm font-semibold uppercase tracking-wider text-white hover:bg-race-400">Acompanhar no F1 LIVE <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        ) : (
          <p className="mt-2 font-display text-4xl font-black text-white tabular" role="timer" aria-label={`Faltam ${cd.days} dias, ${cd.hours} horas e ${cd.minutes} minutos para ${SESSION_LABELS[session.type]}`}>
            {cd.days > 0 && <>{cd.days}<span className="mr-2 text-base text-zinc-500">d</span></>}{pad2(cd.hours)}<span className="text-zinc-600">:</span>{pad2(cd.minutes)}<span className="text-zinc-600">:</span>{pad2(cd.seconds)}
          </p>
        )}
      </div>

      {session.type !== 'race' && (
        <div className="mt-4">
          <p className="kicker mb-2 flex items-center gap-1.5 text-zinc-500"><CalendarDays className="h-3.5 w-3.5" aria-hidden />Largada da corrida</p>
          <RaceCountdown race={race} compact />
        </div>
      )}

      {circuit && (
        <div className="mt-4 flex items-center gap-4 border-t border-white/[0.06] pt-4">
          <TrackMap points={circuit.layout} name={circuit.name} className="h-16 w-16 shrink-0" />
          <dl className="grid flex-1 grid-cols-3 gap-2 text-center">
            {[['km', circuit.lengthKm.toFixed(3)], ['curvas', circuit.turns], ['voltas', circuit.laps]].map(([k, v]) => (
              <div key={k as string}><dt className="kicker text-[10px] text-zinc-500">{k}</dt><dd className="font-display text-lg font-black text-white">{v}</dd></div>
            ))}
          </dl>
        </div>
      )}
      <p className="mt-auto pt-4 text-[11px] text-zinc-500">Horários oficiais no seu fuso.</p>
    </article>
  );
}
