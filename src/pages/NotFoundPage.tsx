import { Link } from 'react-router-dom';
import { CarIllustration } from '../components/CarIllustration';

export function NotFoundPage() {
  return (
    <section className="container-grid flex min-h-[80vh] flex-col items-center justify-center pt-24 text-center">
      <p className="font-display text-8xl font-black italic text-race">404</p>
      <h1 className="mt-2 text-2xl font-bold uppercase">Saiu da pista!</h1>
      <p className="mt-2 text-zinc-400">A página que você procura não existe ou mudou de endereço.</p>
      <CarIllustration className="my-8 w-full max-w-md -rotate-6 opacity-70" title="Carro ilustrado rodando fora da pista" />
      <Link to="/" className="btn-primary">Voltar aos boxes</Link>
    </section>
  );
}
