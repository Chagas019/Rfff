import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { races } from '../../data/calendar2026';
import { usePodiumHistory } from '../../hooks/useStandings';
import { API_SOURCE } from '../../services/f1Api';
import { teamFor } from '../../utils/season';
import { Flag } from '../Flag';
import { HubHeader } from '../HubHeader';

/** Histórico: pódio de cada etapa já disputada, da mais recente para a primeira. */
export function ResultsHistory() {
  const { state, retry } = usePodiumHistory();
  const [all, setAll] = useState(false);
  return (
    <section aria-labelledby="history-title">
      <HubHeader kicker="Temporada 2026" title={<span id="history-title">Histórico de resultados</span>} action={<Link to="/calendario" className="btn-ghost py-2 text-xs">Calendário <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
      {state.status === 'error' ? (
        <p className="surface p-5 text-sm text-zinc-400">{state.error} <button type="button" onClick={retry} className="underline">Tentar de novo</button></p>
      ) : state.status !== 'success' ? (
        <div className="h-64 animate-pulse rounded-xl bg-white/[0.04]" role="status" aria-label="Carregando histórico" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Pódio de cada etapa</caption>
              <thead className="kicker bg-white/[0.03] text-zinc-500"><tr><th className="w-14 px-4 py-2.5">Rod.</th><th>Grande Prêmio</th><th>Vencedor</th><th>2º</th><th className="pr-4">3º</th></tr></thead>
              <tbody>
                {[...state.data].reverse().slice(0, all ? undefined : 8).map((h) => {
                  const local = races.find((r) => r.round === h.round);
                  return (
                    <tr key={h.round} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-mono text-zinc-500">{String(h.round).padStart(2, '0')}</td>
                      <td>
                        {local ? <Link to={`/calendario/${local.id}`} className="flex items-center gap-2 font-semibold text-white hover:text-gold"><Flag code={local.countryCode} country={local.country} />{local.name}</Link> : <span className="text-white">{h.raceName}</span>}
                      </td>
                      {[0, 1, 2].map((p) => {
                        const d = h.drivers[p];
                        const team = d ? teamFor(d.constructorId, d.constructor) : undefined;
                        return (
                          <td key={p} className={p === 2 ? 'pr-4' : ''}>
                            {d ? <span className="flex items-center gap-2"><span className="h-4 w-1 rounded" style={{ background: team?.color ?? '#71717a' }} aria-hidden /><span className={p === 0 ? 'font-semibold text-white' : 'text-zinc-300'}>{d.name.split(' ').slice(-1)[0]}</span></span> : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {state.data.length > 8 && <button type="button" className="btn-ghost mt-3 w-full py-2 text-xs" onClick={() => setAll((a) => !a)}>{all ? 'Mostrar menos' : `Ver as ${state.data.length} etapas`}</button>}
          <p className="mt-2 text-[11px] text-zinc-500">Fonte: {API_SOURCE.label}.</p>
        </>
      )}
    </section>
  );
}
