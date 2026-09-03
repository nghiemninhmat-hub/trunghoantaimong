import { useState, useEffect, useCallback } from 'react';
import { supabase, BachHoaEntry } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LotusIcon } from '@/components/LotusIcon';
import { Heart, Quote, Crown, Loader2, Lock, Coins } from 'lucide-react';

const VOTE_COST = 10;

const RANK_STYLES = [
  { ring: 'ring-amber-300/60', badge: 'bg-gradient-to-r from-amber-300 to-amber-500 text-[#1a0a05]', glow: 'shadow-amber-400/30', label: 'Hoa Quán' },
  { ring: 'ring-slate-300/50', badge: 'bg-gradient-to-r from-slate-200 to-slate-400 text-[#1a0a05]', glow: 'shadow-slate-300/20', label: 'Hoa Nhị' },
  { ring: 'ring-orange-400/50', badge: 'bg-gradient-to-r from-orange-300 to-orange-500 text-[#1a0a05]', glow: 'shadow-orange-400/20', label: 'Hoa Tam' },
];

export default function BachHoaTrieuPhungPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<BachHoaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [voteMsg, setVoteMsg] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('bach_hoa_entries')
      .select('*')
      .order('vote_count', { ascending: false });
    if (error) {
      console.error('Lỗi tải Bách Hoa Triều Phụng:', error.message);
    } else if (data) {
      setEntries(data as BachHoaEntry[]);
    }
    setLoading(false);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!profile) { setBalance(null); return; }
    const { data } = await supabase
      .from('profiles')
      .select('hua_tien')
      .eq('id', profile.id)
      .maybeSingle();
    if (data) setBalance(data.hua_tien as number);
  }, [profile]);

  useEffect(() => {
    fetchEntries();
    fetchBalance();
  }, [fetchEntries, fetchBalance]);

  // Realtime: entries table
  useEffect(() => {
    const channel = supabase
      .channel('bach_hoa_entries_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bach_hoa_entries' }, () => {
        fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEntries]);

  // Realtime: profiles — update balance when our profile changes
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('bach_hoa_balance_rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` }, (payload) => {
        const updated = payload.new as { hua_tien: number };
        setBalance(updated.hua_tien);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleVote = async (entryId: string) => {
    if (!profile) {
      setVoteMsg('Vui lòng đăng nhập để bình chọn.');
      setTimeout(() => setVoteMsg(''), 3000);
      return;
    }
    if (balance !== null && balance < VOTE_COST) {
      setVoteMsg(`Không đủ hoa tiền. Cần ${VOTE_COST}, bạn đang có ${balance}.`);
      setTimeout(() => setVoteMsg(''), 3000);
      return;
    }
    setVoting(entryId);
    setVoteMsg('');
    const { data, error } = await supabase.rpc('bach_hoa_vote', { p_entry_id: entryId });
    if (error) {
      setVoteMsg(`Lỗi: ${error.message}`);
      setTimeout(() => setVoteMsg(''), 3000);
    } else {
      const result = data as { new_vote_count: number; new_balance: number } | null;
      const newCount = result?.new_vote_count;
      const newBal = result?.new_balance;
      if (newBal !== undefined && newBal !== null) setBalance(newBal);
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, vote_count: newCount ?? e.vote_count } : e).sort((a, b) => b.vote_count - a.vote_count));
      setVoteMsg('Đã bình chọn! Trừ 10 hoa tiền.');
      setTimeout(() => setVoteMsg(''), 2500);
    }
    setVoting(null);
  };

  const totalVotes = entries.reduce((sum, e) => sum + e.vote_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <LotusIcon className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Kỳ Hoa Trân Giám</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100/90">Bách Hoa Triều Phụng</h2>
        <p className="text-sm text-gray-500 mt-2 italic max-w-2xl mx-auto">
          Đại hội bình chọn danh xưng mỹ nhân xuất chúng nhất Trùng Hoan. Mỗi lượt bình chọn tốn {VOTE_COST} hoa tiền — có thể bình chọn nhiều lần.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <LotusIcon className="w-3.5 h-3.5" />
            <span>{entries.length} ứng viên</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-amber-300/70">
            <Heart className="w-3.5 h-3.5" />
            <span>{totalVotes} lượt bình chọn</span>
          </div>
          {profile && balance !== null && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs text-amber-300">
                <Coins className="w-3.5 h-3.5" />
                <span>{balance} hoa tiền</span>
              </div>
            </>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Vote message */}
      {voteMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${voteMsg.startsWith('Lỗi') || voteMsg.includes('đăng nhập') || voteMsg.includes('Không đủ') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
          {voteMsg.startsWith('Lỗi') || voteMsg.includes('đăng nhập') || voteMsg.includes('Không đủ') ? <Lock className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
          {voteMsg}
        </div>
      )}

      {/* Entries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry, idx) => {
          const rankStyle = idx < 3 ? RANK_STYLES[idx] : null;
          const maxVotes = entries[0]?.vote_count || 1;
          const votePercent = Math.round((entry.vote_count / maxVotes) * 100);
          const canAfford = balance === null || balance >= VOTE_COST;
          const hasTitle = entry.title && entry.title.trim().length > 0;

          return (
            <div
              key={entry.id}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0d0606] to-[#0a0404] shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#670201]/10 ${
                rankStyle ? `ring-1 ${rankStyle.ring} ${rankStyle.glow} shadow-lg` : 'border-[#670201]/20'
              }`}
            >
              {/* Rank badge — auto-assigned by vote ranking */}
              {rankStyle && (
                <div className="absolute top-3 right-3 z-10">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${rankStyle.badge}`}>
                    <Crown className="w-3 h-3" />
                    {rankStyle.label}
                  </div>
                </div>
              )}

              {/* Avatar */}
              <div className="relative h-56 overflow-hidden">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.identity_name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent) {
                        parent.classList.add('flex', 'items-center', 'justify-center');
                        parent.innerHTML = '<div class="text-gray-600 text-xs">Không có ảnh</div>';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#670201]/10">
                    <LotusIcon className="w-10 h-10 text-[#670201]/30" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0404] via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100/90 leading-tight">{entry.identity_name}</h3>
                  {hasTitle && (
                    <p className="text-xs text-amber-300/80 font-serif italic mt-0.5">{entry.title}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-amber-300/40 font-mono">#{idx + 1}</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-500">{entry.vote_count} phiếu</span>
                    {rankStyle && !hasTitle && (
                      <>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className={`text-[10px] font-bold ${idx === 0 ? 'text-amber-300' : idx === 1 ? 'text-slate-300' : 'text-orange-300'}`}>{rankStyle.label}</span>
                      </>
                    )}
                  </div>
                </div>

                {entry.quote && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                    <Quote className="w-3.5 h-3.5 text-amber-300/50 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-100/70 italic leading-relaxed font-serif">"{entry.quote}"</p>
                  </div>
                )}

                {/* Vote progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#670201] to-[#b73720] transition-all duration-500"
                      style={{ width: `${votePercent}%` }}
                    />
                  </div>
                </div>

                {/* Vote button */}
                <button
                  onClick={() => handleVote(entry.id)}
                  disabled={!profile || !canAfford || voting === entry.id}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    !profile
                      ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                      : !canAfford
                        ? 'bg-red-500/5 text-red-400/60 border border-red-500/15 cursor-not-allowed'
                        : voting === entry.id
                          ? 'bg-[#670201]/20 text-amber-200 border border-[#670201]/30 cursor-wait'
                          : 'bg-[#670201] hover:bg-[#a00404] text-amber-100 border border-[#670201]/30 hover:shadow-md hover:shadow-[#670201]/20'
                  }`}
                >
                  {!profile ? (
                    <><Lock className="w-4 h-4" /> Cần đăng nhập</>
                  ) : !canAfford ? (
                    <><Coins className="w-4 h-4" /> Không đủ hoa tiền</>
                  ) : voting === entry.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><Heart className="w-4 h-4" /> Bình chọn (10 hoa tiền)</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <LotusIcon className="w-10 h-10 text-[#670201]/30 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chưa có ứng viên nào.</p>
        </div>
      )}

      {!profile && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-600 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Đăng nhập để tham gia bình chọn
          </p>
        </div>
      )}
    </div>
  );
}
