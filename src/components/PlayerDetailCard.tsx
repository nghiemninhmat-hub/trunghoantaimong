import { Profile, Transaction, InventoryItem, ShopItem, CURRENCY_LABELS, UserTitle, TITLE_COLORS } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Users, Package, History, Mail, Lock, Eye, EyeOff,
  Heart, Sparkle, Brain, Coins, Gift, Plus, Minus, Dices, Loader2,
  CheckCircle2, AlertCircle, Trash2, UserCircle, Ban, Award,
  Zap, Save, X, Edit3,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

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
  shopItems: ShopItem[];
  onBack: () => void;
  onStatusUpdate?: (userId: string, field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => Promise<void>;
  onRefresh?: () => void;
  onLogAction?: (action: string, targetUserId?: string, targetDesc?: string, details?: Record<string, unknown>) => Promise<void>;
  onDisableUser?: (userId: string) => Promise<void>;
}

export default function PlayerDetailCard({ profile, transactions: initialTx, inventory: initialInv, shopItems, onBack, onStatusUpdate, onRefresh, onLogAction, onDisableUser }: Props) {
  const [revealPwd, setRevealPwd] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(initialTx);
  const [allInventory, setAllInventory] = useState(initialInv);
  const [txLoading, setTxLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Currency form state
  const [curType, setCurType] = useState('HUA_TIEN');
  const [curAmount, setCurAmount] = useState(0);
  const [curReason, setCurReason] = useState('');

  // Inventory grant state
  const [grantItemId, setGrantItemId] = useState('');

  // Wheel spins state
  const [spinAmount, setSpinAmount] = useState(1);
  const [playerTitles, setPlayerTitles] = useState<UserTitle[]>([]);

  // Skills state
  const [skills, setSkills] = useState<Record<string, unknown>[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editSkillDraft, setEditSkillDraft] = useState<Record<string, unknown>>({});

  // Chức nghiệp level state
  const [levelInput, setLevelInput] = useState(1);

  const refreshData = useCallback(async () => {
    if (!profile) return;
    setTxLoading(true);
    const [txRes, invRes, titleRes, skillRes] = await Promise.all([
      supabase.from('transactions').select('*, profiles(oc_name, email)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('inventories').select('*, shop_items(name, category), profiles(oc_name)').eq('user_id', profile.id).order('acquired_at', { ascending: false }),
      supabase.from('user_titles').select('*, titles(*)').eq('user_id', profile.id).order('granted_at', { ascending: false }),
      supabase.from('character_skills').select('*').eq('user_id', profile.id).order('slot', { ascending: true }),
    ]);
    if (txRes.data) setAllTransactions(txRes.data as Transaction[]);
    if (invRes.data) setAllInventory(invRes.data as (InventoryItem & { shop_items?: ShopItem | null; profiles?: { oc_name: string } | null })[]);
    if (titleRes.data) setPlayerTitles(titleRes.data as UserTitle[]);
    if (skillRes.data) setSkills(skillRes.data as Record<string, unknown>[]);
    setTxLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setAllTransactions(initialTx);
    setAllInventory(initialInv);
    refreshData();
  }, [profile, initialTx, initialInv, refreshData]);

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

  const showMsg = (msg: string, isError = false) => {
    setActionMsg(isError ? `Lỗi: ${msg}` : msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (curAmount === 0) { showMsg('Số lượng phải khác 0.', true); return; }
    if (!curReason.trim()) { showMsg('Vui lòng nhập lý do.', true); return; }
    setActionLoading(true);
    const { data, error } = await supabase.rpc('admin_adjust_currency', {
      p_user_id: profile.id,
      p_amount: curAmount,
      p_currency_type: curType,
      p_reason: curReason.trim(),
    });
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    if (data && data.success) {
      onLogAction?.('adjust_currency', profile.id,
        `${curAmount > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(curAmount)} ${CURRENCY_LABELS[curType]} cho ${profile.oc_name}`,
        { amount: curAmount, currency_type: curType, reason: curReason.trim() });
      showMsg(`Đã ${curAmount > 0 ? 'cộng' : 'trừ'} ${Math.abs(curAmount)} ${CURRENCY_LABELS[curType]} thành công.`);
      setCurAmount(0);
      setCurReason('');
      onRefresh?.();
      refreshData();
    }
  };

  const handleGrantItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantItemId) { showMsg('Vui lòng chọn vật phẩm.', true); return; }
    setActionLoading(true);
    const { data, error } = await supabase.rpc('admin_grant_inventory_item', {
      p_user_id: profile.id,
      p_item_id: grantItemId,
    });
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    const itemName = data?.item_name || 'Vật phẩm';
    onLogAction?.('grant_inventory_item', profile.id, `Cấp "${itemName}" cho ${profile.oc_name}`, { item_id: grantItemId });
    showMsg(`Đã tặng "${itemName}" thành công.`);
    setGrantItemId('');
    onRefresh?.();
    refreshData();
  };

  const handleRemoveItem = async (invId: string, itemName: string) => {
    if (!confirm(`Thu hồi "${itemName}" khỏi kho của ${profile.oc_name}? Vật phẩm sẽ bị xóa vĩnh viễn.`)) return;
    setActionLoading(true);
    const { error } = await supabase.from('inventories').delete().eq('id', invId);
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    onLogAction?.('revoke_inventory_item', profile.id, `Thu hồi "${itemName}" khỏi kho ${profile.oc_name}`, { inv_id: invId, item_name: itemName });
    showMsg(`Đã thu hồi "${itemName}".`);
    onRefresh?.();
    refreshData();
  };

  const handleSpinAdjust = async (mode: 'grant' | 'revoke') => {
    if (spinAmount < 1) { showMsg('Số lượt phải >= 1.', true); return; }
    const rpc = mode === 'grant' ? 'admin_grant_spins' : 'admin_revoke_spins';
    const label = mode === 'grant' ? 'cấp' : 'trừ';
    setActionLoading(true);
    const { error } = await supabase.rpc(rpc, { p_user_id: profile.id, p_amount: spinAmount });
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    onLogAction?.(mode === 'grant' ? 'grant_spins' : 'revoke_spins', profile.id, `${mode === 'grant' ? 'Cấp' : 'Trừ'} ${spinAmount} lượt quay cho ${profile.oc_name}`, { amount: spinAmount });
    showMsg(`Đã ${label} ${spinAmount} lượt quay thành công.`);
    setSpinAmount(1);
    onRefresh?.();
  };

  const handleStatus = async (field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => {
    if (!onStatusUpdate) return;
    setStatusMsg('');
    await onStatusUpdate(profile.id, field, value);
    setStatusMsg('Đã cập nhật trạng thái.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSaveSkill = async (skillId: string) => {
    setActionLoading(true);
    const { error } = await supabase.from('character_skills').update(editSkillDraft).eq('id', skillId);
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    setEditingSkillId(null);
    setEditSkillDraft({});
    showMsg('Đã lưu kỹ năng.');
    refreshData();
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Xóa kỹ năng này?')) return;
    setActionLoading(true);
    const { error } = await supabase.from('character_skills').delete().eq('id', skillId);
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    showMsg('Đã xóa kỹ năng.');
    refreshData();
  };

  const handleAddSkill = async () => {
    if (!profile) return;
    const nextSlot = skills.length + 1;
    if (nextSlot > 4) { showMsg('Đã đủ 4 kỹ năng.', true); return; }
    setActionLoading(true);
    const { error } = await supabase.from('character_skills').insert({
      user_id: profile.id, slot: nextSlot, name: 'Kỹ năng mới',
    });
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    showMsg('Đã thêm kỹ năng mới.');
    refreshData();
  };

  const handleSaveLevel = async () => {
    if (!profile) return;
    const newLevel = Math.max(1, Math.floor(levelInput));
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ chuc_nghiep_level: newLevel }).eq('id', profile.id);
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    showMsg(`Đã cập nhật chức nghiệp level thành Lv.${newLevel}.`);
    refreshData();
  };

  const handleResetStatus = async (field: 'status_physical' | 'status_spiritual' | 'status_mental') => {
    const fieldLabel = field === 'status_physical' ? 'Thể Chất' : field === 'status_spiritual' ? 'Tâm Linh' : 'Tinh Thần';
    if (!confirm(`Đặt lại ${fieldLabel} của ${profile.oc_name} về Bình Thường?`)) return;
    setActionLoading(true);
    const { error } = await supabase.rpc('admin_update_status', {
      p_user_id: profile.id,
      p_field: field,
      p_value: 'Bình Thường',
    });
    setActionLoading(false);
    if (error) { showMsg(error.message, true); return; }
    onLogAction?.('reset_status', profile.id, `Đặt lại ${fieldLabel} của ${profile.oc_name} về Bình Thường`, { field, previous_value: (profile as Record<string, unknown>)[field], new_value: 'Bình Thường' });
    showMsg(`Đã đặt lại ${fieldLabel} về Bình Thường.`);
    onRefresh?.();
  };

  const inputCls = "w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
  const labelCls = "block text-[10px] text-gray-500 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <button onClick={() => { onBack(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-300 transition-all">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </button>

      {/* Profile header — anonymous name, email, password */}
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
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold mt-1">
              <Zap className="w-2.5 h-2.5" /> Chức Nghiệp: Lv.{profile.chuc_nghiep_level ?? 1}
            </span>
            {playerTitles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                {playerTitles.map(ut => {
                  const t = ut.titles;
                  const colorCfg = t ? (TITLE_COLORS[t.color] || TITLE_COLORS.amber) : TITLE_COLORS.amber;
                  return (
                    <span key={ut.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${ut.is_displayed ? colorCfg.activeClass : colorCfg.badgeClass}`}>
                      <Award className="w-2.5 h-2.5" />
                      {t?.name || '(?)'}
                      {!ut.is_displayed && <span className="text-[8px] opacity-60">(ẩn)</span>}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="mt-2 space-y-1.5">
              <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
                <UserCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-300/60" />
                <span className="text-gray-500">Tên ẩn danh:</span>
                <span className="font-semibold text-amber-100/90">{profile.anonymous_name || '—'}</span>
              </p>
              <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-amber-300/60" />
                <span className="text-gray-500">Email:</span>
                <span className="font-semibold text-gray-200 truncate">{profile.email}</span>
              </p>
              <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-300/60" />
                <span className="text-gray-500">Mật khẩu:</span>
                <span className="font-mono font-semibold text-amber-100/90">{revealPwd ? (profile.password || '(chưa có)') : '••••••••'}</span>
                <button onClick={() => setRevealPwd(!revealPwd)} className="p-0.5 text-gray-600 hover:text-amber-300 transition-all">
                  {revealPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </p>
              <p className="text-[10px] text-gray-600 font-mono">ID: {profile.id} · {profile.gender}</p>
            </div>
          </div>
        </div>

        {/* Currency balances + wheel spins */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
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
          <div className="p-2 sm:p-3 rounded-lg bg-black/20 border border-rose-500/10 text-center">
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Lượt Quay</p>
            <p className="text-base sm:text-lg font-bold text-rose-300 mt-1 flex items-center justify-center gap-1">
              <Dices className="w-4 h-4" />{profile.wheel_spins ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Disable member button */}
      {onDisableUser && (
        <button
          onClick={() => onDisableUser(profile.id)}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/20 transition-all disabled:opacity-50 w-full justify-center"
        >
          <Ban className="w-4 h-4" />
          Vô Hiệu Hóa Tài Khoản
        </button>
      )}

      {/* Action message */}
      {actionMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${actionMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
          {actionMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {actionMsg}
        </div>
      )}

      {/* Admin actions grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cộng/Trừ tài sản */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-5 h-5 text-amber-300/70" />
            <h4 className="text-sm font-serif font-bold text-amber-100/80">Cộng / Trừ Tài Sản</h4>
          </div>
          <form onSubmit={handleCurrency} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Loại tiền</label>
                <select value={curType} onChange={e => setCurType(e.target.value)} className={inputCls}>
                  <option value="HUA_TIEN">Hoa Tiền</option>
                  <option value="CONG_DUC">Công Đức</option>
                  <option value="AM_DUC">Âm Đức</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Số lượng (âm = trừ)</label>
                <input type="number" value={curAmount} onChange={e => setCurAmount(parseInt(e.target.value) || 0)} className={inputCls} placeholder="vd: 500 hoặc -200" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Lý do</label>
              <input type="text" value={curReason} onChange={e => setCurReason(e.target.value)} className={inputCls} placeholder="Lý do cộng/trừ..." />
            </div>
            <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-sm font-bold border border-[#670201]/30 transition-all disabled:opacity-50 w-full justify-center">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              Thực hiện
            </button>
          </form>
        </div>

        {/* Cộng/Trừ lượt quay */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Dices className="w-5 h-5 text-rose-300/70" />
            <h4 className="text-sm font-serif font-bold text-amber-100/80">Cộng / Trừ Lượt Quay</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">Hiện có: <span className="font-bold text-rose-300">{profile.wheel_spins ?? 0}</span> lượt</p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Số lượt</label>
              <input type="number" min={1} value={spinAmount} onChange={e => setSpinAmount(parseInt(e.target.value) || 1)} className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSpinAdjust('grant')} disabled={actionLoading} className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-all disabled:opacity-50 justify-center">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Cấp lượt
              </button>
              <button onClick={() => handleSpinAdjust('revoke')} disabled={actionLoading} className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/20 transition-all disabled:opacity-50 justify-center">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                Trừ lượt
              </button>
            </div>
          </div>
        </div>

        {/* Tặng vật phẩm */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-amber-300/70" />
            <h4 className="text-sm font-serif font-bold text-amber-100/80">Tặng Vật Phẩm</h4>
          </div>
          <form onSubmit={handleGrantItem} className="space-y-3">
            <div>
              <label className={labelCls}>Chọn vật phẩm</label>
              <select value={grantItemId} onChange={e => setGrantItemId(e.target.value)} className={inputCls}>
                <option value="">— Chọn vật phẩm —</option>
                {shopItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-bold border border-amber-500/20 transition-all disabled:opacity-50 w-full justify-center">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Tặng vật phẩm
            </button>
          </form>
        </div>

        {/* Status update */}
        {onStatusUpdate && (
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-red-400/70" />
              <h4 className="text-sm font-serif font-bold text-amber-100/80">Trạng Thái Nhân Vật</h4>
            </div>
            {statusMsg && <p className="text-xs text-emerald-400 mb-2">{statusMsg}</p>}
            <div className="space-y-3">
              {([
                { field: 'status_physical' as const, label: 'Thể Chất', icon: Heart, color: 'text-red-400' },
                { field: 'status_spiritual' as const, label: 'Tâm Linh', icon: Sparkle, color: 'text-amber-400' },
                { field: 'status_mental' as const, label: 'Tinh Thần', icon: Brain, color: 'text-purple-400' },
              ]).map(({ field, label, icon: Icon, color }) => {
                const currentVal = (profile as Record<string, unknown>)[field] as string;
                const tagInfo = STATUS_TAGS.find(t => t.value === currentVal) || STATUS_TAGS[0];
                return (
                  <div key={field}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${tagInfo.badgeClass}`}>{currentVal}</span>
                      {currentVal !== 'Bình Thường' && (
                        <button
                          onClick={() => handleResetStatus(field)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/15 transition-all disabled:opacity-50"
                          title="Đặt về Bình Thường"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_TAGS.map(tag => (
                        <button key={tag.value} onClick={() => { if (tag.value !== currentVal) handleStatus(field, tag.value); }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${tag.value === currentVal ? `${tag.activeClass} cursor-default` : `${tag.idleClass} hover:scale-105`}`}>
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
      </div>

      {/* Chức nghiệp level */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-cyan-300/70" />
          <h4 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Chức Nghiệp Level</h4>
        </div>
        <p className="text-xs text-gray-500 mb-3">Hiện tại: <span className="font-bold text-cyan-300">Lv.{profile.chuc_nghiep_level ?? 1}</span></p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={levelInput}
            onChange={e => setLevelInput(Math.max(1, parseInt(e.target.value) || 1))}
            className={inputCls}
            placeholder="Level mới"
          />
          <button
            onClick={handleSaveLevel}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-bold border border-cyan-500/20 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu
          </button>
        </div>
      </div>

      {/* Kỹ năng nhân vật */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-300/70" />
            <h4 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Kỹ Năng Nhân Vật ({skills.length})</h4>
          </div>
          <button onClick={handleAddSkill} disabled={actionLoading || skills.length >= 4} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Thêm kỹ năng
          </button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có kỹ năng nào.</p>
        ) : (
          <div className="space-y-2">
            {skills.map(sk => (
              <div key={sk.id as string} className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-amber-100/90">{sk.name as string}</p>
                    <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                      {sk.usage_detail ? <p><span className="text-gray-600">Cách dùng:</span> {sk.usage_detail as string}</p> : null}
                      {sk.effect ? <p><span className="text-gray-600">Hiệu quả:</span> {sk.effect as string}</p> : null}
                      {sk.tradeoff ? <p><span className="text-gray-600">Đánh đổi:</span> {sk.tradeoff as string}</p> : null}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Number(sk.cong_duc_cost) > 0 && <span className="text-cyan-400">Tiêu hao CD: {sk.cong_duc_cost}</span>}
                        {Number(sk.am_duc_cost) > 0 && <span className="text-amber-400">Tiêu hao AD: {sk.am_duc_cost}</span>}
                        {sk.duration ? <span className="text-gray-400">Duy trì: {sk.duration as string}</span> : null}
                        {Number(sk.destruction_percent) > 0 && <span className="text-red-400">Tiêu diệt: {sk.destruction_percent}%</span>}
                      </div>
                      {sk.mental_effect ? <p className="mt-0.5"><span className="text-gray-600">Tinh thần:</span> {sk.mental_effect as string} ({sk.mental_duration as number}đv)</p> : null}
                      {sk.health_effect ? <p><span className="text-gray-600">Sức khỏe:</span> {sk.health_effect as string} ({sk.health_duration as number}đv)</p> : null}
                      {sk.spiritual_effect ? <p><span className="text-gray-600">Tâm linh:</span> {sk.spiritual_effect as string} ({sk.spiritual_duration as number}đv)</p> : null}
                      {sk.ghost_level_effect ? <p><span className="text-gray-600">Cấp quỷ:</span> {sk.ghost_level_effect as string}</p> : null}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => { setEditingSkillId(sk.id as string); setEditSkillDraft({ ...sk }); }} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteSkill(sk.id as string)} disabled={actionLoading} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {editingSkillId === sk.id && (
                  <div className="mt-2 p-2.5 rounded-lg bg-black/30 border border-amber-500/10 space-y-2">
                    <input type="text" value={editSkillDraft.name as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, name: e.target.value }))} placeholder="Tên kỹ năng" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <textarea value={editSkillDraft.usage_detail as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, usage_detail: e.target.value }))} placeholder="Cách dùng" rows={2} className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 resize-none focus:outline-none focus:border-amber-500/40" />
                    <textarea value={editSkillDraft.effect as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, effect: e.target.value }))} placeholder="Hiệu quả" rows={2} className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 resize-none focus:outline-none focus:border-amber-500/40" />
                    <textarea value={editSkillDraft.tradeoff as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, tradeoff: e.target.value }))} placeholder="Đánh đổi" rows={2} className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 resize-none focus:outline-none focus:border-amber-500/40" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={editSkillDraft.cong_duc_cost as number || 0} onChange={e => setEditSkillDraft(d => ({ ...d, cong_duc_cost: parseInt(e.target.value) || 0 }))} placeholder="Tiêu hao CD" className="px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                      <input type="number" value={editSkillDraft.am_duc_cost as number || 0} onChange={e => setEditSkillDraft(d => ({ ...d, am_duc_cost: parseInt(e.target.value) || 0 }))} placeholder="Tiêu hao AD" className="px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    </div>
                    <input type="text" value={editSkillDraft.duration as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, duration: e.target.value }))} placeholder="Thời gian duy trì" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <input type="text" value={editSkillDraft.mental_effect as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, mental_effect: e.target.value }))} placeholder="Ảnh hưởng tinh thần" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <input type="number" max={50} value={editSkillDraft.mental_duration as number || 0} onChange={e => setEditSkillDraft(d => ({ ...d, mental_duration: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) }))} placeholder="Thời gian tinh thần (max 50)" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <input type="text" value={editSkillDraft.health_effect as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, health_effect: e.target.value }))} placeholder="Ảnh hưởng sức khỏe" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <input type="number" max={50} value={editSkillDraft.health_duration as number || 0} onChange={e => setEditSkillDraft(d => ({ ...d, health_duration: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) }))} placeholder="Thời gian sức khỏe (max 50)" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <input type="text" value={editSkillDraft.spiritual_effect as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, spiritual_effect: e.target.value }))} placeholder="Ảnh hưởng tâm linh" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <input type="number" max={50} value={editSkillDraft.spiritual_duration as number || 0} onChange={e => setEditSkillDraft(d => ({ ...d, spiritual_duration: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) }))} placeholder="Thời gian tâm linh (max 50)" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <textarea value={editSkillDraft.ghost_level_effect as string || ''} onChange={e => setEditSkillDraft(d => ({ ...d, ghost_level_effect: e.target.value }))} placeholder="Ảnh hưởng lên từng cấp quỷ" rows={2} className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 resize-none focus:outline-none focus:border-amber-500/40" />
                    <input type="number" max={100} value={editSkillDraft.destruction_percent as number || 0} onChange={e => setEditSkillDraft(d => ({ ...d, destruction_percent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))} placeholder="% tiêu diệt" className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveSkill(sk.id as string)} disabled={actionLoading} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all disabled:opacity-50">
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Lưu
                      </button>
                      <button onClick={() => { setEditingSkillId(null); setEditSkillDraft({}); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold transition-all">
                        <X className="w-3.5 h-3.5" /> Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vật phẩm trong kho + thu hồi */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-amber-300/70" />
          <h4 className="text-base font-serif font-bold text-amber-100/80">Vật Phẩm Trong Kho ({allInventory.length})</h4>
        </div>
        {allInventory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có vật phẩm nào.</p>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 sm:pr-2">
            {allInventory.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{inv.shop_items?.name || 'Vật phẩm đã xóa'}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">{inv.shop_items?.category || '—'} · {new Date(inv.acquired_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <button onClick={() => handleRemoveItem(inv.id, inv.shop_items?.name || 'Vật phẩm')} disabled={actionLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex-shrink-0 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Thu hồi
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lịch sử giao dịch */}
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
