import { AnimatePresence, motion } from 'framer-motion';
import { Check, ExternalLink, Flame, Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShareButton } from '../components/ShareButton';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { buildQuiz, scoreAnswer, type QuizQuestion } from './quiz';

const TOTAL = 10;
const TIME_MS = 15_000;

/** Quiz da temporada 2026 — perguntas sorteadas a partir dos dados do site. */
export function QuizGame() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [left, setLeft] = useState(TIME_MS);
  const [best, setBest] = useLocalStorage<number>('gridf1:game:quiz', 0);
  const qStart = useRef(0);
  const bestBefore = useRef(0);
  const finished = questions.length > 0 && i >= questions.length;
  const q = questions[i];

  const start = () => {
    bestBefore.current = best;
    setQuestions(buildQuiz(TOTAL));
    setI(0); setPicked(null); setScore(0); setHits(0); setStreak(0);
    qStart.current = performance.now();
    setLeft(TIME_MS);
  };

  // cronômetro da pergunta
  useEffect(() => {
    if (!q || picked !== null) return;
    qStart.current = performance.now();
    const id = setInterval(() => {
      const l = Math.max(0, TIME_MS - (performance.now() - qStart.current));
      setLeft(l);
      if (l === 0) answer('');
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, questions, picked]);

  useEffect(() => { if (finished) setBest((b) => Math.max(b, score)); }, [finished, score, setBest]);

  function answer(opt: string) {
    if (!q || picked !== null) return;
    const correct = opt === q.answer;
    const msLeft = Math.max(0, TIME_MS - (performance.now() - qStart.current));
    setPicked(opt);
    setScore((s) => s + scoreAnswer(correct, msLeft, TIME_MS, streak));
    if (correct) { setHits((h) => h + 1); setStreak((s) => s + 1); } else setStreak(0);
  }

  const next = () => { setPicked(null); setLeft(TIME_MS); setI((n) => n + 1); };

  if (!questions.length || finished) {
    const pct = hits / TOTAL;
    return (
      <div className="panel relative mx-auto max-w-2xl overflow-hidden p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(237,180,11,0.25),transparent_65%)]" aria-hidden />
        {finished ? (
          <>
            <p className="label text-gold">Bandeira quadriculada</p>
            <p className="mt-3 font-display text-6xl font-semibold text-white">{score}<span className="ml-2 text-xl text-zinc-400">pts</span></p>
            <p className="mt-2 text-zinc-300">{hits} de {TOTAL} acertos · {pct >= 0.9 ? 'Nível campeão mundial! 🏆' : pct >= 0.7 ? 'Pódio garantido!' : pct >= 0.4 ? 'Zona de pontos.' : 'Hora de estudar o grid…'}</p>
            {score > bestBefore.current && <p className="mt-1 text-sm text-telemetry-yellow">Novo recorde pessoal!</p>}
          </>
        ) : (
          <>
            <p className="label text-gold">Quiz da temporada 2026</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Quanto você sabe do grid?</h2>
            <p className="mx-auto mt-3 max-w-md text-zinc-400">{TOTAL} perguntas sobre pilotos, equipes, carros e circuitos. 15 segundos cada. Responder rápido e emendar acertos vale mais pontos.</p>
          </>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-400"><Trophy className="h-4 w-4 text-telemetry-yellow" aria-hidden />Recorde: <strong className="text-white">{best} pts</strong></p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={start}>{finished ? 'Jogar de novo' : 'Começar quiz'}</button>
          {finished && <ShareButton title="Quiz GRID F1" text={`Fiz ${score} pontos (${hits}/${TOTAL}) no quiz da F1 2026 do GRID F1. Duvido você bater!`} path="/jogos/quiz" />}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <span className="label">Pergunta {i + 1} de {TOTAL}</span>
        <span className="flex items-center gap-3">
          {streak >= 2 && <span className="chip border-orange-500/40 text-orange-400"><Flame className="h-3 w-3" aria-hidden />{streak} seguidas</span>}
          <span className="font-display text-xl font-semibold text-white">{score} <span className="text-xs text-zinc-500">pts</span></span>
        </span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-label="Tempo restante" aria-valuemin={0} aria-valuemax={15} aria-valuenow={Math.ceil(left / 1000)}>
        <div className={`h-full rounded-full transition-[width] duration-100 ease-linear ${left < 5000 ? 'bg-gold' : 'bg-telemetry-green'}`} style={{ width: `${(left / TIME_MS) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="panel p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">{q.prompt}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((opt, n) => {
              const state = picked === null ? 'idle' : opt === q.answer ? 'right' : opt === picked ? 'wrong' : 'dim';
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => answer(opt)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left font-semibold transition ${
 state === 'right' ? 'border-telemetry-green bg-telemetry-green/15 text-white'
 : state === 'wrong' ? 'border-gold bg-gold/15 text-white'
 : state === 'dim' ? 'border-white/5 text-zinc-500'
 : 'border-white/10 bg-white/[0.03] text-zinc-200 hover:border-gold/60 hover:bg-gold/10'}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 font-mono text-xs">
                    {state === 'right' ? <Check className="h-4 w-4 text-telemetry-green" aria-hidden /> : state === 'wrong' ? <X className="h-4 w-4 text-gold" aria-hidden /> : 'ABCD'[n]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
              <p className={picked === q.answer ? 'text-telemetry-green' : 'text-gold'}>
                {picked === q.answer ? 'Certa resposta!' : picked === '' ? `Tempo esgotado! Era: ${q.answer}` : `Não foi dessa vez. Era: ${q.answer}`}
              </p>
              <div className="flex gap-2">
                <Link to={q.learnMore} className="btn-ghost text-xs"><ExternalLink className="h-3.5 w-3.5" aria-hidden />Saiba mais</Link>
                <button type="button" className="btn-primary" onClick={next} autoFocus>{i + 1 === TOTAL ? 'Ver resultado' : 'Próxima'}</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
