import { motion } from 'framer-motion';
import { Camera, ExternalLink, ImageOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCarPhoto } from '../hooks/useCarPhoto';
import { commonsSearchUrl, type CarPhoto as Photo, type PhotoQuery } from '../services/carPhotos';

interface Props {
  photoKey: string;
  query: PhotoQuery;
  alt: string;
  searchTerm: string;
  color?: string;
  className?: string;
  imgClassName?: string;
  /** Mostra o crédito sobre a imagem (padrão) ou some com ele (quando exibido em outro lugar). */
  credit?: 'overlay' | 'none';
  onLoaded?: (photo: Photo) => void;
}

export function PhotoCredit({ photo, className = '' }: { photo: Photo; className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-[10px] leading-tight text-zinc-300 ${className}`}>
      <Camera className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">
        <a href={photo.pageUrl} target="_blank" rel="noreferrer" className="hover:text-white hover:underline" onClick={(e) => e.stopPropagation()}>
          {photo.author}
        </a>
        {' · '}
        {photo.licenseUrl ? (
          <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="hover:text-white hover:underline" onClick={(e) => e.stopPropagation()}>{photo.license}</a>
        ) : photo.license}
        {' · Wikimedia Commons'}
      </span>
    </p>
  );
}

/** Foto real do carro (Wikimedia Commons), com carregamento, erro e crédito. */
export function CarPhoto({ photoKey, query, alt, searchTerm, color = '#e10600', className = '', imgClassName = '', credit = 'overlay', onLoaded }: Props) {
  const { state, retry } = useCarPhoto(photoKey, query);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const photo = state.status === 'success' ? state.data : null;
  useEffect(() => {
    if (photo && imgLoaded) onLoaded?.(photo);
  }, [photo, imgLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const failed = state.status === 'error' || imgError || (state.status === 'success' && !photo);

  return (
    <div className={`relative overflow-hidden bg-carbon-900 ${className}`}>
      {(!imgLoaded && !failed) && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-carbon-800 via-carbon-700 to-carbon-800" role="status" aria-label="Carregando foto" />
      )}
      {photo && !imgError && (
        <motion.img
          src={photo.src}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={imgLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: `radial-gradient(circle at 50% 40%, ${color}33, transparent 70%)` }}>
          <ImageOff className="h-6 w-6 text-zinc-500" aria-hidden />
          <p className="text-xs text-zinc-400">
            {state.status === 'error' || imgError ? 'Não foi possível carregar a foto.' : 'Ainda não há foto livre deste carro no Wikimedia Commons.'}
          </p>
          <div className="flex gap-2">
            {(state.status === 'error' || imgError) && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setImgError(false); setImgLoaded(false); retry(); }} className="chip hover:text-white">
                <RefreshCw className="h-3 w-3" aria-hidden /> Tentar de novo
              </button>
            )}
            <a href={commonsSearchUrl(searchTerm)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip hover:text-white">
              <ExternalLink className="h-3 w-3" aria-hidden /> Ver no Commons
            </a>
          </div>
        </div>
      )}
      {photo && imgLoaded && credit === 'overlay' && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-6">
          <PhotoCredit photo={photo} />
        </div>
      )}
    </div>
  );
}
