import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { BackToTop } from './components/BackToTop';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PageTransition } from './components/PageTransition';
import { SearchBar } from './components/SearchBar';
import { CalendarPage } from './pages/CalendarPage';
import { CircuitsPage } from './pages/CircuitsPage';
import { DriversPage } from './pages/DriversPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RaceDetailPage } from './pages/RaceDetailPage';
import { StandingsPage } from './pages/StandingsPage';
import { TeamsPage } from './pages/TeamsPage';

const TITLES: Record<string, string> = {
  calendario: 'Calendário 2026', circuitos: 'Circuitos', pilotos: 'Pilotos', equipes: 'Equipes',
  classificacao: 'Classificação', favoritos: 'Favoritos',
};

/** Seção da URL usada como chave de transição (abrir um modal não troca de página). */
const sectionOf = (path: string) => {
  const [first, second] = path.split('/').filter(Boolean);
  return first === 'calendario' && second ? path : `/${first ?? ''}`;
};

export default function App() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const section = sectionOf(location.pathname);
  const initialSection = useRef(section);
  const [navigated, setNavigated] = useState(false);
  useEffect(() => {
    if (section !== initialSection.current) setNavigated(true);
  }, [section]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const first = location.pathname.split('/').filter(Boolean)[0];
    document.title = first && TITLES[first] ? `${TITLES[first]} · GRID F1` : 'GRID F1 — A Experiência da Velocidade';
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Navbar onSearch={() => setSearchOpen(true)} />
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      {navigated && <PageTransition key={section} routeKey={section} />}
      <AnimatePresence mode="wait">
        <motion.main
          id="conteudo"
          key={section}
          tabIndex={-1}
          className="relative min-h-screen outline-none"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, x: -40, transition: { duration: 0.3, ease: [0.7, 0, 0.84, 0] } }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/calendario/:id" element={<RaceDetailPage />} />
            <Route path="/circuitos" element={<CircuitsPage />} />
            <Route path="/circuitos/:id" element={<CircuitsPage />} />
            <Route path="/pilotos" element={<DriversPage />} />
            <Route path="/pilotos/:id" element={<DriversPage />} />
            <Route path="/equipes" element={<TeamsPage />} />
            <Route path="/equipes/:id" element={<TeamsPage />} />
            <Route path="/classificacao" element={<StandingsPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <BackToTop />
    </MotionConfig>
  );
}
