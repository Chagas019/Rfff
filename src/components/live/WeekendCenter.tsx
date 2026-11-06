import { CheckCircle2, Circle, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OPENF1_MEETING } from '../../data/openf1';
import type { Race } from '../../types';
import { SESSION_LABELS } from '../../utils/race';
import { dayShort, clock } from '../../utils/time';
import { Flag } from '../Flag';
import { RaceControlFeed } from './RaceControlFeed';
import { RaceInsights } from './RaceInsights';
import { SessionResults } from './SessionResults';
import { useWeekendSessions, type WeekendSession } from './useWeekend';

const SHORT: Record<string, string> = { fp1: 'TL1', fp2: 'TL2', fp3: 'TL3', sprintQuali: 'Quali Sprint', sprint: 'Sprint', quali: 'Classificação', race: 'Corrida' };

function StateIcon({ s }: { s: WeekendSession }) {
  if (s.state === 'live') return <span className="relative flex h-2.5 w-2.5" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-race opacity-70" /><span className="relative h-2.5 w-2.5 rounded-full bg-race" /></span>;
  if (s.state === 'done') return <CheckCircle2 className="h-3.5 w-3.5 text-telemetry-green" aria-hidden />;
  return <Circle className="h-3.5 w-3.5 text-zinc-600" aria-hidden />;
}

/** Sessão padrão: a que está acontecendo ou a última concluída. */
export function defaultSession(sessions: WeekendSession[]): number {
  const live = sessions.findIndex((s) => s.state === 'live');
  if (live >= 0) return live;
  const done = sessions.map((s) => s.state).lastIndexOf('done');
  return done >= 0 ? done : 0;
}

/** Central do fim de semana: linha do tempo das sessões, resultados, direção de prova e corrida. */
export function WeekendCenter({ race, now, mode }: { race: Race; now: Date; mode: 'live' | 'recent' }) {
  const { sessions, error } = useWeekendSessions(race, now);
  const [sel, setSel] = useState<number | null>(null);
  const auto = defaultSession(sessions);
  // segue a sessão "atual" até a pessoa escolher outra
  const index = sel ?? auto;
  useEffect(() => { setSel(null); }, [race.id]);
  const current = sessions[index];

  return (
    <section aria-labelledby="weekend-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker flex items-center gap-2 text-gold">
            {mode === 'live' ? <><Radio className="h-3.5 w-3.5" aria-hidden />Fim de semana em andamento</> : 'Última etapa disputada'} · Rodada {race.round}
          </p>
          <h2 id="weekend-title" className="mt-1 text-3xl sm:text-4xl"><Flag code={race.countryCode} country={race.country} className="mr-3 align-middle" />{race.name}</h2>
        </div>
        <Link to={`/calendario/${race.id}`} className="btn-ghost py-2 text-xs">Ficha da etapa</Link>
      </div>

      {/* linha do tempo das sessões */}
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2" role="tablist" aria-label="Sessões do fim de semana">
          {sessions.map((s, i) => (
            <button
              key={s.type}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setSel(i)}
              className={`flex min-w-[120px] flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition ${i === index ? 'border-white/40 bg-white/[0.06]' : 'border-white/[0.07] bg-carbon-900 hover:border-white/20'}`}
            >
              <span className="flex items-center gap-2 font-condensed text-sm font-semibold uppercase tracking-wider text-white"><StateIcon s={s} />{SHORT[s.type]}</span>
              <span className="font-mono text-[11px] text-zinc-500">{dayShort(s.start)} · {clock(s.start)}</span>
              <span className={`kicker text-[10px] ${s.state === 'live' ? 'text-gold' : s.state === 'done' ? 'text-telemetry-green' : 'text-zinc-600'}`}>{s.state === 'live' ? 'Ao vivo' : s.state === 'done' ? 'Encerrada' : 'A seguir'}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-zinc-500">A OpenF1 não respondeu agora (durante sessões ao vivo ela fica restrita a assinantes). Horários do calendário oficial; resultados de classificação e corrida pela Jolpica-F1.</p>}

      {current && (
        current.state === 'upcoming' ? (
          <p className="surface p-6 text-sm text-zinc-400">{SESSION_LABELS[current.type]} começa {dayShort(current.start)} às {clock(current.start)} (seu fuso). Os tempos aparecem aqui assim que a OpenF1 publicar.</p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
            <SessionResults sessionKey={current.key} type={current.type} live={current.state === 'live'} meetingKey={OPENF1_MEETING[race.id]} round={race.round} />
            <RaceControlFeed sessionKey={current.key} live={current.state === 'live'} />
          </div>
        )
      )}

      {current?.type === 'race' && current.state === 'done' && race.round && <RaceInsights round={race.round} />}
    </section>
  );
}
