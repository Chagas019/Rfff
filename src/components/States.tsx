import { AlertTriangle, RefreshCw, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Carregando dados…', rows = 6 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <p className="label flex items-center gap-2" aria-hidden>
        <span className="h-2 w-2 animate-pulse rounded-full bg-gold" /> {label}
      </p>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <div role="alert" className="panel flex flex-col items-center gap-4 p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-telemetry-yellow" aria-hidden />
      <div>
        <p className="font-display text-lg font-bold text-white">Dados indisponíveis no momento</p>
        <p className="mt-1 text-sm text-zinc-400">{message}</p>
      </div>
      {children}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost">
          <RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-3 p-10 text-center">
      <SearchX className="h-10 w-10 text-zinc-500" aria-hidden />
      <p className="font-display text-lg font-bold text-white">{title}</p>
      <p className="max-w-md text-sm text-zinc-400">{message}</p>
      {action}
    </div>
  );
}
