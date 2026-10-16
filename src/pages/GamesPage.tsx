import { motion } from 'framer-motion';
import { Brain, Lightbulb, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PitStopGame } from '../games/PitStopGame';
import { QuizGame } from '../games/QuizGame';
import { ReactionGame } from '../games/ReactionGame';

const GAMES = [
  { id: 'luzes', title: 'Luzes de largada', text: 'Teste seu reflexo', icon: Lightbulb, El: ReactionGame },
  { id: 'pit-stop', title: 'Pit stop', text: 'Troque os 4 pneus', icon: Wrench, El: PitStopGame },
  { id: 'quiz', title: 'Quiz 2026', text: '10 perguntas do grid', icon: Brain, El: QuizGame },
] as const;

export function GamesPage() {
  const { game } = useParams();
  const current = GAMES.find((g) => g.id === game) ?? GAMES[0];

  return (
    <>
      <PageHeader kicker="Área de diversão" title={<>Jogos do <span className="text-race">box</span></>}>
        <p>Mostre que você tem reflexo de piloto, mãos de mecânico e cabeça de engenheiro. Seus recordes ficam salvos no aparelho — e dá para desafiar os amigos.</p>
      </PageHeader>
      <div className="container-grid py-10">
        <nav className="mb-8 grid grid-cols-3 gap-2 sm:gap-4" aria-label="Escolha o jogo">
          {GAMES.map((g) => {
            const active = g.id === current.id;
            return (
              <Link
                key={g.id}
                to={`/jogos/${g.id}`}
                replace
                aria-current={active ? 'page' : undefined}
                className={`panel relative flex flex-col items-center gap-1 overflow-hidden p-3 text-center transition sm:flex-row sm:gap-4 sm:p-5 sm:text-left ${active ? 'border-race/60' : 'panel-hover'}`}
              >
                {active && <motion.span layoutId="game-tab" className="absolute inset-0 bg-gradient-to-br from-race/20 to-transparent" aria-hidden />}
                <g.icon className={`relative h-6 w-6 shrink-0 sm:h-8 sm:w-8 ${active ? 'text-race' : 'text-zinc-500'}`} aria-hidden />
                <span className="relative">
                  <span className="block font-display text-sm font-black uppercase text-white sm:text-xl">{g.title}</span>
                  <span className="hidden text-xs text-zinc-400 sm:block">{g.text}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <motion.div key={current.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <current.El />
        </motion.div>
      </div>
    </>
  );
}
