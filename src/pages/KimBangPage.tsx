import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, KimBangEntry } from '@/lib/supabase';
import { Crown, Coins, Ghost, Medal, ScrollText, Sparkles, Trophy, X } from 'lucide-react';

const defaultAvatars: Record<number, string> = {
  1: 'https://images.pexels.com/photos/28173991/pexels-photo-28173991.jpeg?auto=compress&cs=tinysrgb&h=700&w=500',
  2: 'https://images.pexels.com/photos/34440536/pexels-photo-34440536.jpeg?auto=compress&cs=tinysrgb&h=700&w=500',
  3: 'https://images.pexels.com/photos/16010575/pexels-photo-16010575.jpeg?auto=compress&cs=tinysrgb&h=700&w=500',
  4: 'https://images.pexels.com/photos/749091/pexels-photo-749091.jpeg?auto=compress&cs=tinysrgb&h=700&w=500',
};

const rankLabels: Record<number, string> = {
  1: 'Đệ Nhất', 2: 'Đệ Nhị', 3: 'Đệ Tam', 4: 'Đệ Tứ', 5: 'Đệ Ngũ', 6: 'Đệ Lục',
};

const rankColors: Record<number, string> = {
  1: 'from-[#f6ca62] via-[#eeb337] to-[#9b5d18]',
  2: 'from-[#e8e7df] via-[#b9b6aa] to-[#6e6a62]',
  3: 'from-[#d9894e] via-[#aa4d2e] to-[#642117]',
  4: 'from-[#d7a96d] to-[#71301e]',
  5: 'from-[#d7a96d] to-[#71301e]',
  6: 'from-[#d7a96d] to-[#71301e]',
};

function getAvatar(entry: KimBangEntry): string {
  return entry.avatar_url?.trim() || defaultAvatars[entry.rank] || '';
}

function Avatar({ entry, large = false }: { entry: KimBangEntry; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const avatar = getAvatar(entry);
  return avatar && !failed ? (
    <img src={avatar} alt={entry.identity_name || `Vị trí ${entry.rank}`} onError={() => setFailed(true)} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#1d0c0a]">
      <Ghost className={large ? 'h-16 w-16 text-[#6b4934]' : 'h-10 w-10 text-[#6b4934]'} />
    </div>
  );
}

function DetailPanel({ entry, onClose }: { entry: KimBangEntry; onClose: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#eeb337]/30 bg-[linear-gradient(120deg,rgba(53,18,12,.98),rgba(20,8,7,.98))] shadow-[0_24px_80px_rgba(0,0,0,.32)] animate-fade-in" aria-live="polite">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#eeb337]/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-72 bg-[#b73720]/10 blur-3xl" />
      <div className="relative grid gap-6 p-5 sm:grid-cols-[180px_1fr] sm:p-7 lg:grid-cols-[220px_1fr_auto] lg:items-center">
        <div className="relative mx-auto h-52 w-40 overflow-hidden rounded-2xl border border-[#eeb337]/40 bg-[#160806] shadow-[0_14px_32px_rgba(0,0,0,.35)] sm:mx-0 sm:h-60 sm:w-44">
          <Avatar entry={entry} large />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#f6ca62]">{rankLabels[entry.rank]}</p>
          </div>
        </div>
        <div className="min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Medal className="h-4 w-4 text-[#eeb337]" />
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#eeb337]/80">Hồ sơ vinh danh</p>
          </div>
          <h2 className="mt-2 font-hero text-3xl text-[#fff1cf] sm:text-4xl">{entry.identity_name || 'Vị trí trống'}</h2>
          {entry.honor_title && <p className="mt-2 text-sm font-semibold text-[#f6ca62]">{entry.honor_title}</p>}
          {entry.epithet && <p className="mt-4 font-script text-base italic leading-7 text-[#d7a96d]">“{entry.epithet}”</p>}
          <div className="mt-5 grid grid-cols-2 gap-2 text-left sm:max-w-lg">
            <div className="rounded-xl border border-[#eeb337]/15 bg-black/25 p-3"><p className="text-[10px] uppercase tracking-wider text-[#c9b493]/60">Tài phú</p><p className="mt-1 text-sm font-semibold text-[#f6ca62]">{entry.wealth || 'Chưa cập nhật'}</p></div>
            <div className="rounded-xl border border-[#eeb337]/15 bg-black/25 p-3"><p className="text-[10px] uppercase tracking-wider text-[#c9b493]/60">Dị sự hoàn thành</p><p className="mt-1 text-sm font-semibold text-[#f6ca62]">{entry.quests_completed || 0}</p></div>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng thông tin vinh danh" className="absolute right-4 top-4 rounded-full border border-[#eeb337]/20 p-2 text-[#c9b493] transition hover:border-[#eeb337]/50 hover:text-[#fff1cf] sm:right-5 sm:top-5"><X className="h-4 w-4" /></button>
      </div>
    </section>
  );
}

function EmptyCard({ rank, onSelect }: { rank: number; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className="group relative flex min-h-[290px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-[#eeb337]/20 bg-[#130807]/60 p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-[#eeb337]/50 focus:outline-none focus:ring-2 focus:ring-[#eeb337]/60"><span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${rankColors[rank]} text-[#1a0a05] shadow-lg`}><span className="font-serif font-bold">{String(rank).padStart(2, '0')}</span></span><Ghost className="h-9 w-9 text-[#6b4934]" /><p className="mt-3 text-sm text-[#8a6a4a]">Vị trí đang chờ người được đề danh</p><span className="mt-2 text-xs text-[#eeb337]/60">Xem vị trí</span></button>;
}

export default function KimBangPage() {
  const [entries, setEntries] = useState<KimBangEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('kim_bang').select('id, rank, identity_name, wealth, quests_completed, honor_title, avatar_url, epithet, updated_at').order('rank', { ascending: true });
    if (error) console.error('Lỗi tải Kim Bảng:', error.message);
    else setEntries((data || []) as KimBangEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const slots = useMemo(() => Array.from({ length: 6 }, (_, index) => entries.find((entry) => entry.rank === index + 1) || null), [entries]);
  const selected = entries.find((entry) => entry.id === selectedId) || null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="relative overflow-hidden rounded-[28px] border border-[#eeb337]/25 bg-[radial-gradient(circle_at_50%_0%,rgba(238,179,55,.14),transparent_36%),linear-gradient(135deg,#2a0e0a,#100605_70%)] px-5 py-8 text-center sm:px-10 sm:py-12">
        <div className="absolute left-1/2 top-0 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f6ca62] to-transparent" />
        <div className="relative"><div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[.28em] text-[#f6ca62]"><Crown className="h-4 w-4" /> Kim Bảng Trùng Hoan</div><h1 className="font-hero text-4xl text-[#fff1cf] sm:text-6xl">Lục Vị Đề Danh</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#c9b493]"><span className="font-script text-base italic text-[#d7a96d]">Kim bảng lưu danh, thiên hạ chứng kiến.</span><br /><span className="font-script text-base italic text-[#d7a96d]">Một bước đề danh, vạn người biết tiếng.</span></p></div>
      </header>

      {loading ? <div className="flex justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#eeb337]/25 border-t-[#eeb337]" /></div> : <>
        {selected && <DetailPanel entry={selected} onClose={() => setSelectedId(null)} />}
        <section aria-label="Sáu vị trí Kim Bảng" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {slots.map((entry, index) => entry ? <button key={entry.id} type="button" onClick={() => setSelectedId(entry.id)} aria-pressed={selectedId === entry.id} className={`group relative overflow-hidden rounded-[22px] border bg-[#130807] text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#eeb337]/70 ${selectedId === entry.id ? 'border-[#f6ca62] shadow-[0_0_0_2px_rgba(238,179,55,.18),0_18px_45px_rgba(0,0,0,.35)]' : 'border-[#eeb337]/20 hover:border-[#eeb337]/55'}`}><div className="aspect-[3/4] overflow-hidden"><Avatar entry={entry} /></div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d0504] via-[#0d0504]/90 to-transparent px-3 pb-3 pt-16"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#eeb337]">{rankLabels[entry.rank]}</p><h3 className="mt-1 truncate font-serif text-lg font-bold text-[#fff1cf]">{entry.identity_name}</h3><p className="mt-1 truncate text-xs text-[#d7a96d]">{entry.honor_title || 'Người lưu danh'}</p></div><span className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${rankColors[entry.rank]} text-xs font-bold text-[#1a0a05] shadow-lg`}>{String(entry.rank).padStart(2, '0')}</span></button> : <EmptyCard key={`empty-${index}`} rank={index + 1} onSelect={() => setSelectedId(null)} />)}
        </section>

        {!selected && <div className="rounded-2xl border border-dashed border-[#eeb337]/20 bg-[#130807]/50 px-5 py-5 text-center"><Sparkles className="mx-auto h-5 w-5 text-[#eeb337]/70" /><p className="mt-2 text-sm text-[#c9b493]">Hải bắc nam sơn — vì ngươi vinh danh</p></div>}

        <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#eeb337]/15 bg-[#130807]/70 p-5"><div className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-[#eeb337]" /><h2 className="font-serif text-lg font-bold text-[#fff1cf]">Quy tắc đề danh</h2></div><ul className="mt-4 space-y-2 text-sm leading-6 text-[#c9b493]"><li>Kim Bảng chỉ ghi nhận 06 vị trí cao nhất.</li><li>Thứ hạng dựa trên thành tích Dị Sự và tài phú.</li><li>Thông tin được Quản Trị Viên cập nhật theo từng kỳ.</li></ul></div><div className="rounded-2xl border border-[#eeb337]/15 bg-[#130807]/70 p-5"><div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-[#eeb337]" /><h2 className="font-serif text-lg font-bold text-[#fff1cf]">Lời lưu danh</h2></div><ul className="mt-4 space-y-1 font-script text-base italic leading-8 text-[#d7a96d]"><li><strong>Giang hồ vạn lý, duy kiếm đồng hành.</strong></li><li><strong>Phong sương mãn lộ, bất phụ thiếu niên.</strong></li></ul><div className="mt-4 flex items-center gap-2 text-xs text-[#8a6a4a]"><Coins className="h-3.5 w-3.5" /> Không xét xuất thân, chỉ xét những gì đã làm được.</div></div></section>
      </>}
    </div>
  );
}
