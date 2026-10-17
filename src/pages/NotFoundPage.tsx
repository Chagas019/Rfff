import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';

export function NotFoundPage() {
  return (
    <section className="container-grid flex min-h-[80vh] flex-col items-center justify-center pt-24 text-center">
      <p className="font-display text-8xl font-semibold text-gold">404</p>
      <h1 className="mt-2 text-2xl font-bold">Saiu da pista!</h1>
      <p className="mt-2 text-zinc-400">A página que você procura não existe ou mudou de endereço.</p>
      <Flag className="my-8 h-20 w-20 -rotate-12 text-telemetry-yellow" aria-hidden />
      <Link to="/" className="btn-primary">Voltar aos boxes</Link>
    </section>
  );
}
