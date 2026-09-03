import { Profile, Transaction, InventoryItem, ShopItem, CURRENCY_LABELS } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Users, Package, History, Mail, Lock, Eye, EyeOff, Heart, Sparkle, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';

const STATUS_TAGS = [
  { value: 'Bình Thường', label: 'Thẻ lá', badgeClass: 'bg-emerald-500/20 text-emerald-300', activeClass: 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200', idleClass: 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400/70' },
  { value: 'Ảnh hưởng nhẹ', label: 'Thẻ vàng', badgeClass: 'bg-yellow-500/20 text-yellow-300', activeClass: 'bg-yellow-500/30 border-yellow-500/50 text-yellow-200', idleClass: 'bg-yellow-500/5 border-yellow-500/15 text-yellow-400/70' },
  { value: 'Nghiêm trọng', label: 'Thẻ đỏ nhạt', badgeClass: 'bg-red-400/20 text-red-300', activeClass: 'bg-red-400/30 border-red-400/50 text-red-200', idleClass: 'bg-red-400/5 border-red-400/15 text-red-400/70' },
  { value: 'Cực kỳ nghiêm trọng', label: 'Thẻ đỏ đậm', badgeClass: 'bg-red-600/20 text-red-400', activeClass: 'bg-red-600/30 border-red-600/50 text-red-300', idleClass: 'bg-red-600/5 border-red-600/15 text-red-500/70' },
  { value: 'Suy kiệt', label: 'Thẻ tím nhạt', badgeClass: 'bg-purple-400/20 text-purple-300', activeClass: 'bg-purple-400/30 border-purple-400/50 text-purple-200', idleClass: 'bg-purple-400/5 border-purple-400/15 text-purple-400/70' },
  { value: 'Ngưỡng sinh tử', label: 'Thẻ tím đậm', badgeClass: 'bg-purple-700/20 text-purple-400', activeClass: 'bg-purple-700/30 border-purple-700/50 text-purple-300', idleClass: 'bg-purple-700/5 border-purple-700/15 text-purple-500/70' },
];

interface Props {
  profile?: Profile;
  transactions: Transaction[];
  inventory: (InventoryItem & { shop_items?: ShopItem | null; profiles?: { oc_name: string } | null })[];
  onBack: () => void;
  onStatusUpdate?: (userId: string, field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => Promise<void>;
}

export default function PlayerDetailCard({ profile, transactions: initialTx, inventory, onBack, onStatusUpdate }: Props) {
  const [revealPwd, setRevealPwd] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(initialTx);
  const [txLoading, setTxLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!profile) return;
    setAllTransactions(initialTx);
    setTxLoading(true);
    supabase
      .from('transactions')
      .select('*, profiles(oc_name, email)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAllTransactions(data as Transaction[]);
        setTxLoading(false);
      });
  }, [profile, initialTx]);

  if (!profile) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <p className="text-sm text-gray-500 text-center py-8">Không tìm thấy thông tin người chơi.</p>
      </div>
    );
  }

  const handleStatus = async (field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => {
    if (!onStatusUpdate) return;
    setStatusMsg('');
    await onStatusUpdate(profile.id, field, value);
    setStatusMsg('Đã cập nhật trạng thái.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => { onBack(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-300 transition-all">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </button>

      {/* Profile header */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-amber-500/20">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.oc_name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 mx-auto sm:mx-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#670201]/30 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300/60" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-100/90 truncate">{profile.oc_name}</h3>
            {profile.danh_vong && profile.danh_vong !== 'Vô Danh' && (
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold mt-1">{profile.danh_vong}</span>
            )}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1.5"><Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{profile.email}</span></p>
              <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Lock className="w-3 h-3 flex-shrink-0" />
                <span className="font-mono">{revealPwd ? (profile.password || '(chưa có)') : '••••••••'}</span>
                <button onClick={() => setRevealPwd(!revealPwd)} className="p-0.5 text-gray-600 hover:text-amber-300 transition-all">
                  {revealPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </p>
              <p className="text-[10px] text-gray-600 font-mono">ID: {profile.id}</p>
              <p className="text-xs text-gray-500">Ẩn danh: {profile.anonymous_name} · {profile.gender}</p>
            </div>
          </div>
        </div>

        {/* Currency balances */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
          <div className="p-2 sm:p-3 rounded-lg bg-black/20 border border-amber-500/10 text-center">
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Hoa Tiền</p>
            <p className="text-base sm:text-lg font-bold text-amber-300 mt-1">🪙 {profile.hua_tien}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-black/20 border border-cyan-500/10 text-center">
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Công Đức</p>
            <p className="text-base sm:text-lg font-bold text-cyan-300 mt-1">✨ {profile.cong_duc}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-black/20 border border-amber-500/10 text-center">
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Âm Đức</p>
            <p className="text-base sm:text-lg font-bold text-amber-300 mt-1">🌑 {profile.am_duc}</p>
          </div>
        </div>
      </div>

      {/* Status Update */}
      {onStatusUpdate && (
        <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-400/70" />
            <h4 className="text-base font-serif font-bold text-amber-100/80">Cập Nhật Trạng Thái</h4>
          </div>
          {statusMsg && (
            <p className="text-xs text-emerald-400 mb-3">{statusMsg}</p>
          )}
          <div className="space-y-4">
            {([
              { field: 'status_physical' as const, label: 'Thể Chất', icon: Heart, color: 'text-red-400' },
              { field: 'status_spiritual' as const, label: 'Tâm Linh', icon: Sparkle, color: 'text-amber-400' },
              { field: 'status_mental' as const, label: 'Tinh Thần', icon: Brain, color: 'text-purple-400' },
            ]).map(({ field, label, icon: Icon, color }) => {
              const currentVal = (profile as Record<string, unknown>)[field] as string;
              const tagInfo = STATUS_TAGS.find(t => t.value === currentVal) || STATUS_TAGS[0];
              return (
                <div key={field}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${tagInfo.badgeClass}`}>
                      {currentVal}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_TAGS.map(tag => (
                      <button
                        key={tag.value}
                        onClick={() => { if (tag.value !== currentVal) handleStatus(field, tag.value); }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                          tag.value === currentVal
                            ? `${tag.activeClass} cursor-default`
                            : `${tag.idleClass} hover:scale-105`
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-amber-300/70" />
          <h4 className="text-base font-serif font-bold text-amber-100/80">Vật Phẩm Trong Kho ({inventory.length})</h4>
        </div>
        {inventory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có vật phẩm nào.</p>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 sm:pr-2">
            {inventory.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{inv.shop_items?.name || 'Vật phẩm đã xóa'}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">{inv.shop_items?.category || '—'} · {new Date(inv.acquired_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions — full history */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-amber-300/70" />
          <h4 className="text-base font-serif font-bold text-amber-100/80">Lịch Sử Giao Dịch ({allTransactions.length})</h4>
        </div>
        {txLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-8 h-8 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
          </div>
        ) : allTransactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có giao dịch nào.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
            {allTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] sm:text-sm text-gray-300 break-words">{tx.reason}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    {tx.related_user_name && <span className="text-amber-300/70">{tx.amount < 0 ? '→' : '←'} {tx.related_user_name} · </span>}
                    {new Date(tx.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                  <p className="text-[11px] sm:text-xs text-gray-500">{CURRENCY_LABELS[tx.currency_type]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
