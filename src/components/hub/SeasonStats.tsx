import { Award, Flag as FlagIcon, Gauge, Medal, Trophy, Users } from 'lucide-react';
import { races } from '../../data/calendar2026';
import { drivers } from '../../data/drivers';
import { useDriverStandings, usePodiumHistory } from '../../hooks/useStandings';
import { HubHeader } from '../HubHeader';

interface Stat { icon: typeof Trophy; label: string; value: string; detail: string }

/** Curiosidades calculadas com os dados oficiais da temporada (nada é estimado). */
export function SeasonStats() {
  const ph = usePodiumHistory();
  const st = useDriverStandings();
  const stats: Stat[] = [];

  if (ph.state.status === 'success' && ph.state.data.length) {
    const hist = ph.state.data;
    const winners = new Map<string, { name: string; n: number }>();
    const teams = new Set<string>();
    hist.forEach((h) => {
      const w = h.drivers[0];
      if (!w) return;
      winners.set(w.driverId, { name: w.name, n: (winners.get(w.driverId)?.n ?? 0) + 1 });
      teams.add(w.constructor);
    });
    stats.push({ icon: Users, label: 'Vencedores diferentes', value: String(winners.size), detail: `em ${hist.length} corridas` });
    stats.push({ icon: FlagIcon, label: 'Equipes vencedoras', value: String(teams.size), detail: [...teams].join(', ') });
    // sequência atual de vitórias
    const last = hist[hist.length - 1].drivers[0];
    let streak = 0;
    for (let i = hist.length - 1; i >= 0 && hist[i].drivers[0]?.driverId === last?.driverId; i--) streak++;
    if (last) stats.push({ icon: Gauge, label: 'Último vencedor', value: last.name, detail: streak > 1 ? `${streak} vitórias seguidas` : `${winners.get(last.driverId)?.n ?? 1}ª vitória no ano` });
  }
  if (st.state.status === 'success' && st.state.data.items.length) {
    const items = st.state.data.items;
    const mostWins = [...items].sort((a, b) => b.wins - a.wins)[0];
    const mostPod = [...items].filter((d) => d.podiums !== undefined).sort((a, b) => (b.podiums ?? 0) - (a.podiums ?? 0))[0];
    stats.unshift({ icon: Trophy, label: 'Mais vitórias', value: `${mostWins.givenName} ${mostWins.familyName}`, detail: `${mostWins.wins} vitórias` });
    if (mostPod) stats.splice(1, 0, { icon: Medal, label: 'Mais pódios', value: `${mostPod.givenName} ${mostPod.familyName}`, detail: `${mostPod.podiums} pódios` });
    const scored = items.filter((d) => d.points > 0).length;
    stats.push({ icon: Award, label: 'Pilotos que pontuaram', value: String(scored), detail: `de ${items.length} que já correram em 2026` });
  }
  const sprints = races.filter((r) => r.sprint && !r.cancelled).length;
  const br = drivers.filter((d) => d.countryCode === 'BR');
  stats.push({ icon: FlagIcon, label: 'Brasileiros no grid', value: String(br.length), detail: br.map((d) => `${d.firstName} ${d.lastName}`).join(' e ') });
  stats.push({ icon: Gauge, label: 'Fins de semana Sprint', value: String(sprints), detail: `de ${races.filter((r) => !r.cancelled).length} etapas` });

  const loading = ph.state.status === 'loading' || st.state.status === 'loading';
  return (
    <section aria-labelledby="stats-title">
      <HubHeader kicker="Números da temporada" title={<span id="stats-title">Curiosidades e estatísticas</span>}>Calculadas com os resultados oficiais até agora.</HubHeader>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="surface p-4">
            <p className="kicker flex items-center gap-1.5 text-zinc-500"><s.icon className="h-3.5 w-3.5 text-race" aria-hidden />{s.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold leading-tight text-white">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{s.detail}</p>
          </li>
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => <li key={`sk${i}`} className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />)}
      </ul>
    </section>
  );
}
