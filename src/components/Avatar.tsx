import { useState } from 'react';
import { UserCircle } from 'lucide-react';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  iconClassName?: string;
  shape?: 'circle' | 'rounded' | 'square';
  eager?: boolean;
}

export default function Avatar({
  src,
  alt,
  className = '',
  iconClassName = 'w-5 h-5',
  shape = 'circle',
  eager = false,
}: AvatarProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const radiusClass = shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-xl' : 'rounded-none';

  const showSkeleton = src && !loaded && !errored;

  return (
    <div className={`relative overflow-hidden ${radiusClass} ${className}`}>
      {src && !errored ? (
        <>
          {showSkeleton && (
            <div className={`absolute inset-0 ${radiusClass} bg-gradient-to-br from-[#2a0a0a] to-[#1a0606] animate-pulse`} />
          )}
          <img
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-[#1a0606] ${radiusClass}`}>
          <UserCircle className={`${iconClassName} text-amber-100/40`} />
        </div>
      )}
    </div>
  );
}
