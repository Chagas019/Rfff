import { flagEmoji } from '../utils/format';

export function Flag({ code, country, className = '' }: { code: string; country: string; className?: string }) {
  return (
    <span role="img" aria-label={`Bandeira: ${country}`} title={country} className={`inline-block leading-none ${className}`}>
      {flagEmoji(code)}
    </span>
  );
}
