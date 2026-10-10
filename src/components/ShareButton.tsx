import { Share2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { shareLink } from '../utils/share';

interface Props { title: string; text: string; path: string; variant?: 'icon' | 'full' }

export function ShareButton({ title, text, path, variant = 'full' }: Props) {
  const notify = useToast();
  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = new URL(path, window.location.origin).toString();
    const outcome = await shareLink({ title, text, url });
    if (outcome === 'copied') notify('Link copiado para a área de transferência');
    else if (outcome === 'failed') notify('Não foi possível compartilhar. Copie o link: ' + url, 'error');
  };
  return (
    <button type="button" onClick={onClick} className={variant === 'icon' ? 'btn-icon' : 'btn-ghost'} aria-label={`Compartilhar ${title}`} title="Compartilhar">
      <Share2 className="h-4 w-4" aria-hidden />
      {variant === 'full' && <span>Compartilhar</span>}
    </button>
  );
}
