import { races } from '../data/calendar2026';
import { circuits } from '../data/circuits';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  /** Link para a página do site onde está a resposta. */
  learnMore: string;
}

type Rng = () => number;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = <T,>(arr: T[], rng: Rng) => arr[Math.floor(rng() * arr.length)];

/** Monta 4 alternativas: a correta + 3 erradas distintas. */
function options(answer: string, pool: string[], rng: Rng): string[] {
  const wrong = shuffle([...new Set(pool.filter((p) => p !== answer))], rng).slice(0, 3);
  return shuffle([answer, ...wrong], rng);
}

const fullName = (d: (typeof drivers)[number]) => `${d.firstName} ${d.lastName}`;
const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id;
const activeRaces = races.filter((r) => !r.cancelled);

/**
 * Geradores de perguntas. Todas as respostas vêm dos dados do próprio site
 * (as mesmas fontes documentadas no README) — nada é inventado.
 */
const GENERATORS: ((rng: Rng) => QuizQuestion)[] = [
  (rng) => {
    const d = pick(drivers, rng);
    return { id: `num-${d.id}`, prompt: `Qual piloto corre com o número ${d.number} em 2026?`, answer: fullName(d), options: options(fullName(d), drivers.map(fullName), rng), learnMore: `/pilotos/${d.id}` };
  },
  (rng) => {
    const d = pick(drivers, rng);
    const a = teamName(d.teamId);
    return { id: `team-${d.id}`, prompt: `Por qual equipe ${fullName(d)} corre em 2026?`, answer: a, options: options(a, teams.map((t) => t.name), rng), learnMore: `/pilotos/${d.id}` };
  },
  (rng) => {
    const t = pick(teams, rng);
    return { id: `tp-${t.id}`, prompt: `Quem é o chefe de equipe da ${t.name}?`, answer: t.teamPrincipal, options: options(t.teamPrincipal, teams.map((x) => x.teamPrincipal), rng), learnMore: `/equipes/${t.id}` };
  },
  (rng) => {
    const t = pick(teams, rng);
    return { id: `car-${t.id}`, prompt: `Qual é o nome do carro de 2026 da ${t.name}?`, answer: t.car, options: options(t.car, teams.map((x) => x.car), rng), learnMore: `/equipes/${t.id}` };
  },
  (rng) => {
    const t = pick(teams, rng);
    return { id: `base-${t.id}`, prompt: `Onde fica a sede da ${t.name}?`, answer: t.base, options: options(t.base, teams.map((x) => x.base), rng), learnMore: `/equipes/${t.id}` };
  },
  (rng) => {
    const c = pick(circuits, rng);
    return { id: `cc-${c.id}`, prompt: `Em que país fica o circuito ${c.name}?`, answer: c.country, options: options(c.country, circuits.map((x) => x.country), rng), learnMore: `/circuitos/${c.id}` };
  },
  (rng) => {
    const c = pick(circuits, rng);
    const a = `${c.laps} voltas`;
    return { id: `laps-${c.id}`, prompt: `Quantas voltas tem a corrida em ${c.name}?`, answer: a, options: options(a, circuits.map((x) => `${x.laps} voltas`), rng), learnMore: `/circuitos/${c.id}` };
  },
  (rng) => {
    const r = pick(activeRaces, rng);
    const a = `Rodada ${r.round}`;
    return { id: `round-${r.id}`, prompt: `Qual rodada do campeonato 2026 é o ${r.name}?`, answer: a, options: options(a, activeRaces.map((x) => `Rodada ${x.round}`), rng), learnMore: `/calendario/${r.id}` };
  },
  (rng) => {
    const d = pick(drivers, rng);
    return { id: `code-${d.id}`, prompt: `De quem é a sigla “${d.code}” nas transmissões?`, answer: fullName(d), options: options(fullName(d), drivers.map(fullName), rng), learnMore: `/pilotos/${d.id}` };
  },
];

/** Gera `count` perguntas sem repetir. */
export function buildQuiz(count = 10, rng: Rng = Math.random): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < 500) {
    const q = pick(GENERATORS, rng)(rng);
    if (seen.has(q.id) || q.options.length < 4) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

/** Pontos: 100 por acerto + bônus por rapidez (até 50) + bônus de sequência. */
export function scoreAnswer(correct: boolean, msLeft: number, msTotal: number, streak: number): number {
  if (!correct) return 0;
  return 100 + Math.round(50 * Math.max(0, Math.min(1, msLeft / msTotal))) + Math.min(streak, 5) * 10;
}

/** Classificação do tempo de reação nas luzes de largada. */
export function rateReaction(ms: number): { label: string; tone: 'great' | 'good' | 'ok' | 'slow' } {
  if (ms < 200) return { label: 'Reflexo de pole position!', tone: 'great' };
  if (ms < 250) return { label: 'Largada de piloto de F1', tone: 'good' };
  if (ms < 320) return { label: 'Boa largada', tone: 'ok' };
  return { label: 'Perdeu posições na largada', tone: 'slow' };
}
