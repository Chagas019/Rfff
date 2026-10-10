import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';
import type { FavoriteKind } from '../types';

interface Props { kind: FavoriteKind; id: string; label: string; variant?: 'icon' | 'full'; className?: string }

export function FavoriteButton({ kind, id, label, variant = 'icon', className = '' }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const notify = useToast();
  const active = isFavorite(kind, id);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const added = toggleFavorite(kind, id);
    notify(added ? `${label} adicionado aos favoritos` : `${label} removido dos favoritos`, added ? 'success' : 'info');
  };
  const text = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${text}: ${label}`}
      title={text}
      className={variant === 'icon' ? `btn-icon ${active ? 'border-race/70 bg-race/15 text-race-400' : ''} ${className}` : `btn-ghost ${active ? 'border-race/70 bg-race/15' : ''} ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? 'fill-race text-race' : ''}`} aria-hidden />
      {variant === 'full' && <span>{active ? 'Favoritado' : 'Favoritar'}</span>}
    </motion.button>
  );
}
