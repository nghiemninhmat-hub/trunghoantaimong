import { useState, useEffect } from 'react';
import { supabase, AvatarFrame } from '@/lib/supabase';
import { UserCircle } from 'lucide-react';

interface Props {
  avatarUrl: string | null;
  ocName: string;
  frameId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'w-28 h-28 sm:w-36 sm:h-36', avatar: 'w-20 h-20 sm:w-24 sm:h-24' },
  md: { container: 'w-28 h-28 sm:w-40 sm:h-40 lg:w-44 lg:h-44', avatar: 'w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32' },
  lg: { container: 'w-40 h-40 sm:w-52 sm:h-52', avatar: 'w-28 h-28 sm:w-36 sm:h-36' },
};

export default function FramedAvatar({ avatarUrl, ocName, frameId, size = 'md', className = '' }: Props) {
  const [frame, setFrame] = useState<AvatarFrame | null>(null);
  const [imgError, setImgError] = useState(false);
  const sizes = SIZE_MAP[size];

  useEffect(() => {
    if (!frameId) {
      setFrame(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('avatar_frames')
      .select('*')
      .eq('id', frameId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setFrame(data as AvatarFrame);
      });
    return () => { cancelled = true; };
  }, [frameId]);

  return (
    <div className={`relative ${sizes.container} ${className}`}>
      {frame ? (
        <>
          {/* Frame image on top */}
          <img
            src={frame.image_path}
            alt={frame.name}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
          {/* Avatar centered inside frame */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className={`${sizes.avatar} rounded-full overflow-hidden bg-gradient-to-br from-[#670201] to-[#a00404]`}>
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={ocName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle className="w-3/4 h-3/4 text-amber-100/80" />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Default blood-moon style when no frame equipped */
        <>
          <div className="absolute -inset-2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(214,65,46,0.25),rgba(140,17,17,0.1)_50%,transparent_75%)] blur-md" />
          <div className="absolute -inset-1.5 rounded-full border border-[#670201]/30" />
          <div className={`relative ${sizes.container} rounded-full overflow-hidden border-[3px] border-[#670201]/50 shadow-xl shadow-black/50 bg-gradient-to-br from-[#670201] to-[#a00404]`}>
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-amber-200/10 pointer-events-none z-10" />
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={ocName}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle className="w-3/4 h-3/4 text-amber-100/80" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
