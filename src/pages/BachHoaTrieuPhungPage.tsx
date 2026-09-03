import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, BachHoaEntry, BachHoaVote } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LotusIcon } from '@/components/LotusIcon';
import { Heart, Quote, Crown, Loader2, CheckCircle2, Lock, ChevronDown, ChevronUp, Users } from 'lucide-react';

const RANK_STYLES = [
  { ring: 'ring-amber-300/60', badge: 'bg-gradient-to-r from-amber-300 to-amber-500 text-[#1a0a05]', label: 'Hoa Quán', glow: 'shadow-amber-400/30' },
  { ring: 'ring-slate-300/50', badge: 'bg-gradient-to-r from-slate-200 to-slate-400 text-[#1a0a05]', label: 'Hoa Nhị', glow: 'shadow-slate-300/20' },
  { ring: 'ring-orange-400/50', badge: 'bg-gradient-to-r from-orange-300 to-orange-500 text-[#1a0a05]', label: 'Hoa Tam', glow: 'shadow-orange-400/20' },
];

function voterDisplayName(v: BachHoaVote): string {
  return v.profiles?.oc_name || v.profiles?.anonymous_name || `ID:${v.user_id.slice(0, 8)}`;
}

export default function BachHoaTrieuPhungPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<BachHoaEntry[]>([]);
  const [votesByEntry, setVotesByEntry] = useState<Record<string, BachHoaVote[]>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [voteMsg, setVoteMsg] = useState('');
  const [expandedVoters, setExpandedVoters] = useState<Set<string>>(new Set());
  const votesFetchedRef = useRef(false);

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

  const fetchAllVotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('bach_hoa_votes')
      .select('id, entry_id, user_id, created_at, profiles(oc_name, anonymous_name)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Lỗi tải lượt bình chọn:', error.message);
      return;
    }
    if (data) {
      const grouped: Record<string, BachHoaVote[]> = {};
      for (const v of data as BachHoaVote[]) {
        if (!grouped[v.entry_id]) grouped[v.entry_id] = [];
        grouped[v.entry_id].push(v);
      }
      setVotesByEntry(grouped);
      votesFetchedRef.current = true;
    }
  }, []);

  const fetchMyVotes = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('bach_hoa_votes')
      .select('entry_id')
      .eq('user_id', profile.id);
    if (data) setVotedIds(new Set(data.map(v => v.entry_id)));
  }, [profile]);

  useEffect(() => {
    fetchEntries();
    fetchAllVotes();
    fetchMyVotes();
  }, [fetchEntries, fetchAllVotes, fetchMyVotes]);

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

  // Realtime: votes table — incrementally update voter lists
  useEffect(() => {
    const channel = supabase
      .channel('bach_hoa_votes_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bach_hoa_votes' }, async (payload) => {
        const newVote = payload.new as { id: string; entry_id: string; user_id: string; created_at: string };
        // Fetch the voter's profile info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('oc_name, anonymous_name')
          .eq('id', newVote.user_id)
          .maybeSingle();
        const vote: BachHoaVote = {
          ...newVote,
          profiles: profileData as { oc_name: string | null; anonymous_name: string | null } | null,
        };
        setVotesByEntry(prev => {
          const list = prev[newVote.entry_id] || [];
          if (list.some(v => v.id === newVote.id)) return prev;
          return { ...prev, [newVote.entry_id]: [vote, ...list] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bach_hoa_votes' }, (payload) => {
        const oldId = payload.old?.id;
        if (!oldId) return;
        setVotesByEntry(prev => {
          const next: Record<string, BachHoaVote[]> = {};
          for (const [eid, list] of Object.entries(prev)) {
            next[eid] = list.filter(v => v.id !== oldId);
          }
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleVote = async (entryId: string) => {
    if (!profile) {
      setVoteMsg('Vui lòng đăng nhập để bình chọn.');
      setTimeout(() => setVoteMsg(''), 3000);
      return;
    }
    if (votedIds.has(entryId)) return;
    setVoting(entryId);
    setVoteMsg('');
    const { data, error } = await supabase.rpc('bach_hoa_vote', { p_entry_id: entryId });
    if (error) {
      setVoteMsg(`Lỗi: ${error.message}`);
      setTimeout(() => setVoteMsg(''), 3000);
    } else {
      setVotedIds(prev => new Set(prev).add(entryId));
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, vote_count: data ?? e.vote_count } : e).sort((a, b) => b.vote_count - a.vote_count));
      setVoteMsg('Đã bình chọn thành công!');
      setTimeout(() => setVoteMsg(''), 2000);
    }
    setVoting(null);
  };

  const toggleVoters = (entryId: string) => {
    setExpandedVoters(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
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
          Đại hội bình chọn danh xưng mỹ nhân xuất chúng nhất Trùng Hoan. Mỗi người chơi được bình chọn một lần cho mỗi ứng viên.
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
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Vote message */}
      {voteMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${voteMsg.startsWith('Lỗi') || voteMsg.includes('đăng nhập') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
          {voteMsg.startsWith('Lỗi') || voteMsg.includes('đăng nhập') ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {voteMsg}
        </div>
      )}

      {/* Entries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry, idx) => {
          const rankStyle = idx < 3 ? RANK_STYLES[idx] : null;
          const hasVoted = votedIds.has(entry.id);
          const maxVotes = entries[0]?.vote_count || 1;
          const votePercent = Math.round((entry.vote_count / maxVotes) * 100);
          const voters = votesByEntry[entry.id] || [];
          const isExpanded = expandedVoters.has(entry.id);
          const visibleVoters = isExpanded ? voters : voters.slice(0, 4);

          return (
            <div
              key={entry.id}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0d0606] to-[#0a0404] shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#670201]/10 ${
                rankStyle ? `ring-1 ${rankStyle.ring} ${rankStyle.glow} shadow-lg` : 'border-[#670201]/20'
              }`}
            >
              {/* Rank badge */}
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
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-amber-300/40 font-mono">#{idx + 1}</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-500">{entry.vote_count} phiếu</span>
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

                {/* Voter list */}
                {voters.length > 0 && (
                  <div className="rounded-lg bg-black/20 border border-white/5 p-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3 h-3 text-amber-300/50" />
                      <span className="text-[10px] text-amber-300/60 font-semibold uppercase tracking-wider">Người bình chọn</span>
                      <span className="text-[10px] text-gray-600 ml-auto">{voters.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleVoters.map((v, i) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#670201]/15 border border-[#670201]/20 text-[10px] text-amber-100/70 font-medium"
                          title={new Date(v.created_at).toLocaleString('vi-VN')}
                        >
                          {voterDisplayName(v)}
                          {i === 0 && voters.length > 1 && <span className="text-amber-400/50">·</span>}
                        </span>
                      ))}
                    </div>
                    {voters.length > 4 && (
                      <button
                        onClick={() => toggleVoters(entry.id)}
                        className="flex items-center gap-1 mt-2 text-[10px] text-amber-300/60 hover:text-amber-300/90 transition-colors"
                      >
                        {isExpanded ? <><ChevronUp className="w-3 h-3" /> Thu gọn</> : <><ChevronDown className="w-3 h-3" /> Xem tất cả ({voters.length})</>}
                      </button>
                    )}
                  </div>
                )}

                {/* Vote button */}
                <button
                  onClick={() => handleVote(entry.id)}
                  disabled={hasVoted || voting === entry.id}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    hasVoted
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 cursor-default'
                      : voting === entry.id
                        ? 'bg-[#670201]/20 text-amber-200 border border-[#670201]/30 cursor-wait'
                        : 'bg-[#670201] hover:bg-[#a00404] text-amber-100 border border-[#670201]/30 hover:shadow-md hover:shadow-[#670201]/20'
                  }`}
                >
                  {hasVoted ? (
                    <><CheckCircle2 className="w-4 h-4" /> Đã bình chọn</>
                  ) : voting === entry.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><Heart className="w-4 h-4" /> Bình chọn</>
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
