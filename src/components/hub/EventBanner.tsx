import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, MapPin, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { circuits } from '../../data/circuits';
import { useEventTheme } from '../../hooks/useEventTheme';
import { useNow } from '../../hooks/useNow';
import { RACE_DURATION_MS, getCountdown, getRaceStart, pad2 } from '../../utils/race';
import { formatDateTime, userTimeZone } from '../../utils/format';
import { Flag } from '../Flag';

/**
 * Banner do evento: a etapa que define a identidade visual do site neste momento
 * (a que está acontecendo ou a próxima). Muda sozinho quando o calendário avança.
 */
export function EventBanner() {
  const { race, phase, theme, source, preview } = useEventTheme();
  const now = useNow(1000);
  const reduce = useReducedMotion();
  if (!race) return null;
  const circuit = circuits.find((c) => c.id === race.circuitId);
  const start = getRaceStart(race);
  const cd = start ? getCountdown(start, now) : null;

  return (
    <section aria-label="Etapa em destaque" className="relative overflow-hidden rounded-2xl border border-white/10 bg-carbon-900">
      <div className="event-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="event-stripe absolute inset-x-0 top-0 h-1" aria-hidden />
      {/* varredura de luz a cada troca de identidade */}
      {!reduce && <div key={race.id} className="event-sweep pointer-events-none absolute inset-0" aria-hidden />}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={race.id} className="relative grid items-center gap-5 p-5 sm:p-6 lg:grid-cols-[auto_1fr_auto]"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Flag code={race.countryCode} country={race.country} className="text-6xl sm:text-7xl" />
          <div className="min-w-0">
            <p className="kicker flex flex-wrap items-center gap-2 text-gold">
              {phase === 'live' ? <><Radio className="h-3.5 w-3.5" aria-hidden />Fim de semana em andamento</> : 'Próxima etapa'}
              {race.round ? <span className="text-white/50">· Rodada {race.round}</span> : null}
              {preview && <span className="rounded bg-white/10 px-1.5 text-[9px] text-white/70">visualização</span>}
            </p>
            <h2 className="mt-1 truncate text-3xl text-white sm:text-4xl">{race.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />{race.city}, {race.country}{circuit ? ` · ${circuit.name}` : ''}</span>
              {start && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gold" aria-hidden />Corrida: {formatDateTime(start.toISOString())}</span>}
            </p>
            <p className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
              <span className="flex gap-1" aria-hidden>{[theme.c1, theme.c2, theme.c3].map((c) => <span key={c} className="h-2.5 w-5 rounded-sm ring-1 ring-white/15" style={{ background: c }} />)}</span>
              Identidade do evento: {theme.motif}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            {cd && !cd.finished ? (
              <p className="font-display text-4xl font-semibold text-white tabular sm:text-5xl" role="timer" aria-label={`Faltam ${cd.days} dias, ${cd.hours} horas e ${cd.minutes} minutos para a largada`}>
                {cd.days > 0 && <>{cd.days}<span className="mr-2 text-base text-white/50">d</span></>}{pad2(cd.hours)}<span className="text-white/30">:</span>{pad2(cd.minutes)}<span className="text-white/30">:</span>{pad2(cd.seconds)}
              </p>
            ) : <p className="font-display text-2xl font-semibold text-gold">{start && now.getTime() > start.getTime() + RACE_DURATION_MS ? 'Etapa já disputada' : 'Corrida em andamento'}</p>}
            {cd && !cd.finished && <p className="text-[11px] text-white/50">para a largada · horário de {userTimeZone()}</p>}
            <Link to={phase === 'live' ? '/live' : `/calendario/${race.id}`} className="btn-primary mt-1 py-2 text-xs">{phase === 'live' ? 'Acompanhar ao vivo' : 'Ver a etapa'}</Link>
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="relative px-5 pb-3 text-[10px] text-white/35 sm:px-6">Calendário: {source === 'api' ? 'oficial (Jolpica-F1), atualizado agora' : source === 'cache' ? 'oficial (Jolpica-F1), guardado neste aparelho' : 'dados embutidos do site (API indisponível)'}.</p>
    </section>
  );
}
