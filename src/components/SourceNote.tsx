import { Database } from 'lucide-react';
import type { ReactNode } from 'react';

export function SourceNote({ label, url, children }: { label: string; url: string; children?: ReactNode }) {
  return (
    <p className="mt-8 flex flex-wrap items-start gap-2 text-xs text-zinc-500">
      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        Fonte: <a href={url} target="_blank" rel="noreferrer" className="text-zinc-300 underline decoration-gold/50 underline-offset-2 hover:text-white">{label}</a>
        {children && <> · {children}</>}
      </span>
    </p>
  );
}
