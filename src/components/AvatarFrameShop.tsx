import { useState, useEffect, useCallback } from 'react';
import { supabase, AvatarFrame, UserAvatarFrame, Profile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Check, Loader2, Lock, ShoppingBag, Sparkles, Coins, Skull, Crown } from 'lucide-react';

const CURRENCY_META: Record<string, { label: string; icon: typeof Coins; color: string }> = {
  hua_tien: { label: 'Hoa Tiền', icon: Coins, color: 'text-amber-300' },
  cong_duc: { label: 'Công Đức', icon: Sparkles, color: 'text-emerald-300' },
  am_duc: { label: 'Âm Đức', icon: Skull, color: 'text-purple-300' },
};

interface Props {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
  onProfileUpdate: () => void;
}

export default function AvatarFrameShop({ open = false, onClose, inline = false, onProfileUpdate }: Props) {
  const { user, profile } = useAuth();
  const [frames, setFrames] = useState<AvatarFrame[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFrame, setActionFrame] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrame | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [framesRes, ownedRes, profileRes] = await Promise.all([
      supabase.from('avatar_frames').select('*').order('display_order', { ascending: true }),
      supabase.from('user_avatar_frames').select('frame_id').eq('user_id', user.id),
      supabase.from('profiles').select('active_frame_id').eq('id', user.id).maybeSingle(),
    ]);
    if (framesRes.data) setFrames(framesRes.data as AvatarFrame[]);
    if (ownedRes.data) setOwnedIds(new Set((ownedRes.data as UserAvatarFrame[]).map(o => o.frame_id)));
    if (profileRes.data) setActiveFrameId((profileRes.data as Profile).active_frame_id);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (inline || open) fetchData();
  }, [inline, open, fetchData]);

  const handleBuy = async (frame: AvatarFrame) => {
    if (!user) return;
    setActionFrame(frame.id);
    setMsg('');
    const { data, error } = await supabase.rpc('purchase_avatar_frame', { p_frame_id: frame.id });
    if (error) {
      setMsg(`Lỗi: ${error.message}`);
    } else {
      const result = data as { success: boolean; message: string } | null;
      if (result?.success) {
        setOwnedIds(prev => new Set(prev).add(frame.id));
        setMsg(`Đã mua "${frame.name}" thành công!`);
        onProfileUpdate();
      } else {
        setMsg(result?.message || 'Mua thất bại.');
      }
    }
    setActionFrame(null);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleEquip = async (frame: AvatarFrame) => {
    if (!user) return;
    setActionFrame(frame.id);
    setMsg('');
    const { data, error } = await supabase.rpc('equip_avatar_frame', { p_frame_id: frame.id });
    if (error) {
      setMsg(`Lỗi: ${error.message}`);
    } else {
      const result = data as { success: boolean; message: string } | null;
      if (result?.success) {
        setActiveFrameId(frame.id);
        setMsg(`Đã áp dụng "${frame.name}"!`);
        onProfileUpdate();
      } else {
        setMsg(result?.message || 'Áp dụng thất bại.');
      }
    }
    setActionFrame(null);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleUnequip = async () => {
    if (!user) return;
    setActionFrame('unequip');
    setMsg('');
    const { data, error } = await supabase.rpc('unequip_avatar_frame');
    if (error) {
      setMsg(`Lỗi: ${error.message}`);
    } else {
      const result = data as { success: boolean; message: string } | null;
      if (result?.success) {
        setActiveFrameId(null);
        setMsg('Đã gỡ khung viền.');
        onProfileUpdate();
      }
    }
    setActionFrame(null);
    setTimeout(() => setMsg(''), 4000);
  };

  if (!inline && !open) return null;

  const frameGrid = (
    <>
      {/* Current currencies */}
      {profile && (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Số dư:</span>
          <span className="flex items-center gap-1 text-xs text-amber-300"><Coins className="w-3.5 h-3.5" /> {profile.hua_tien}</span>
          <span className="flex items-center gap-1 text-xs text-emerald-300"><Sparkles className="w-3.5 h-3.5" /> {profile.cong_duc}</span>
          <span className="flex items-center gap-1 text-xs text-purple-300"><Skull className="w-3.5 h-3.5" /> {profile.am_duc}</span>
        </div>
      )}

      {/* Message */}
      {msg && (
        <div className={`mx-4 mt-3 p-2.5 rounded-lg text-xs ${msg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
          {msg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#670201]/50" />
        </div>
      )}

      {/* Frame grid */}
      {!loading && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {frames.map(frame => {
            const owned = ownedIds.has(frame.id);
            const isActive = activeFrameId === frame.id;
            const currency = CURRENCY_META[frame.currency_type];
            const CurrencyIcon = currency.icon;
            const canAfford = profile ? (frame.currency_type === 'hua_tien' ? profile.hua_tien : frame.currency_type === 'cong_duc' ? profile.cong_duc : profile.am_duc) >= frame.price : false;

            return (
              <div
                key={frame.id}
                className={`relative rounded-xl border overflow-hidden transition-all ${
                  isActive ? 'border-amber-400/50 ring-1 ring-amber-400/30' :
                  owned ? 'border-emerald-500/30' : 'border-[#670201]/25'
                } bg-gradient-to-b from-[#0d0606] to-[#0a0404]`}
              >
                {isActive && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] font-bold text-amber-200">
                    <Check className="w-2.5 h-2.5" /> Đang dùng
                  </div>
                )}
                {owned && !isActive && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-300">
                    <Check className="w-2.5 h-2.5" /> Đã sở hữu
                  </div>
                )}

                {/* Preview */}
                <div
                  className="relative h-36 flex items-center justify-center cursor-pointer bg-black/30"
                  onClick={() => setSelectedFrame(frame)}
                >
                  <div className="relative w-24 h-24">
                    <img src={frame.image_path} alt={frame.name} className="absolute inset-0 w-full h-full pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="preview" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#670201]/30 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-[#670201]/40" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div>
                    <h4 className="text-xs font-serif font-bold text-amber-100/90">{frame.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{frame.description}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <CurrencyIcon className={`w-3.5 h-3.5 ${currency.color}`} />
                    <span className={`text-xs font-bold ${currency.color}`}>{frame.price.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-500">{currency.label}</span>
                  </div>

                  <div className="flex gap-1.5">
                    {owned ? (
                      isActive ? (
                        <button
                          onClick={handleUnequip}
                          disabled={actionFrame === 'unequip'}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-400 transition-all"
                        >
                          {actionFrame === 'unequip' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          Gỡ khung
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(frame)}
                          disabled={actionFrame === frame.id}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-bold text-amber-200 transition-all"
                        >
                          {actionFrame === frame.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Dùng
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuy(frame)}
                        disabled={actionFrame === frame.id || !canAfford}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          canAfford
                            ? 'bg-[#670201] hover:bg-[#a00404] text-amber-100'
                            : 'bg-red-500/5 text-red-400/50 border border-red-500/15 cursor-not-allowed'
                        }`}
                      >
                        {actionFrame === frame.id ? <Loader2 className="w-3 h-3 animate-spin" /> : !canAfford ? <Lock className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {canAfford ? 'Mua' : 'Không đủ'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail popup */}
      {selectedFrame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedFrame(null)}>
          <div className="relative max-w-sm w-full rounded-2xl bg-gradient-to-b from-[#1a0a08] to-[#0d0606] border border-[#670201]/40 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFrame(null)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-40 h-40">
                <img src={selectedFrame.image_path} alt={selectedFrame.name} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="preview" className="w-28 h-28 rounded-full object-cover" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#670201]/30 flex items-center justify-center">
                      <ShoppingBag className="w-7 h-7 text-[#670201]/40" />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-base font-serif font-bold text-amber-100/90">{selectedFrame.name}</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{selectedFrame.description}</p>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {(() => {
                    const c = CURRENCY_META[selectedFrame.currency_type];
                    const Icon = c.icon;
                    return <><Icon className={`w-4 h-4 ${c.color}`} /><span className={`text-sm font-bold ${c.color}`}>{selectedFrame.price.toLocaleString()}</span><span className="text-xs text-gray-500">{c.label}</span></>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="rounded-xl bg-black/20 border border-[#670201]/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#670201]/20">
          <Crown className="w-4 h-4 text-amber-300/70" />
          <span className="text-xs font-bold text-amber-100/80">Khung Viền Ảnh Đại Diện</span>
        </div>
        {frameGrid}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#1a0a08] to-[#0d0606] border border-[#670201]/40 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-[#1a0a08] to-[#1a0a08]/95 border-b border-[#670201]/30 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#670201]/20 border border-[#670201]/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300/80" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-amber-100/90">Cửa Hàng Khung Viền</h3>
              <p className="text-xs text-gray-500">Mua và áp dụng khung viền ảnh đại diện</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        {frameGrid}
      </div>
    </div>
  );
}
