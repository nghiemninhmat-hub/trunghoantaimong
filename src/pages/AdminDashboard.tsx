import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile, ShopItem, SitePage, Transaction, InventoryItem, CURRENCY_LABELS, WantedNotice, KimBangEntry, AuditLog, PasswordHistoryEntry, WheelSpinLog, Will, WillStatus } from '@/lib/supabase';
import {
  Shield, Users, Coins, Store, BookOpen, Ghost, Check, X, Plus, Trash2,
  AlertCircle, CheckCircle2, History, Edit3, Eye, EyeOff, Dices, Package,
  Heart, Sparkle, Brain, Lock, Unlock, FileWarning, Crown, Save, ScrollText,
  Undo2, RotateCcw, Search, UserSearch, ArrowLeft, ChevronDown, ChevronUp, FileSignature
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import PlayerDetailCard from '@/components/PlayerDetailCard';

const STATUS_TAGS = [
  { value: 'Bình Thường', label: 'Thẻ lá', badgeClass: 'bg-emerald-500/20 text-emerald-300', activeClass: 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200', idleClass: 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400/70' },
  { value: 'Ảnh hưởng nhẹ', label: 'Thẻ vàng', badgeClass: 'bg-yellow-500/20 text-yellow-300', activeClass: 'bg-yellow-500/30 border-yellow-500/50 text-yellow-200', idleClass: 'bg-yellow-500/5 border-yellow-500/15 text-yellow-400/70' },
  { value: 'Nghiêm trọng', label: 'Thẻ đỏ nhạt', badgeClass: 'bg-red-400/20 text-red-300', activeClass: 'bg-red-400/30 border-red-400/50 text-red-200', idleClass: 'bg-red-400/5 border-red-400/15 text-red-400/70' },
  { value: 'Cực kỳ nghiêm trọng', label: 'Thẻ đỏ đậm', badgeClass: 'bg-red-600/20 text-red-400', activeClass: 'bg-red-600/30 border-red-600/50 text-red-300', idleClass: 'bg-red-600/5 border-red-600/15 text-red-500/70' },
  { value: 'Suy kiệt', label: 'Thẻ tím nhạt', badgeClass: 'bg-purple-400/20 text-purple-300', activeClass: 'bg-purple-400/30 border-purple-400/50 text-purple-200', idleClass: 'bg-purple-400/5 border-purple-400/15 text-purple-400/70' },
  { value: 'Ngưỡng sinh tử', label: 'Thẻ tím đậm', badgeClass: 'bg-purple-700/20 text-purple-400', activeClass: 'bg-purple-700/30 border-purple-700/50 text-purple-300', idleClass: 'bg-purple-700/5 border-purple-700/15 text-purple-500/70' },
];

type Tab = 'accounts' | 'currency' | 'identities' | 'shop' | 'pages' | 'wheel' | 'inventories' | 'status' | 'settings' | 'wanted' | 'kimbang' | 'audit' | 'lookup' | 'wills';

export default function AdminDashboard() {
  const { profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

  // Data states
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [approvedProfiles, setApprovedProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Currency management
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currencyType, setCurrencyType] = useState('HUA_TIEN');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  // Shop management
  const [newItem, setNewItem] = useState({
    name: '', category: '', price: 0, currency_type: 'CONG_DUC',
    price_secondary: 0, currency_type_secondary: '',
    shop_area: 'Thường', purchase_limit: '', description: '', stock: 99,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<ShopItem>>({});

  // Inventory management
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [allInventory, setAllInventory] = useState<(InventoryItem & { profiles?: { oc_name: string } | null })[]>([]);

  // Page management
  const [newPage, setNewPage] = useState({ page_number: 1, title: '', category: '', content: '' });

  // Identity reveal
  const [revealIds, setRevealIds] = useState<Set<string>>(new Set());

  // Wheel spins management
  const [spinUserId, setSpinUserId] = useState('');
  const [spinAmount, setSpinAmount] = useState(1);
  const [spinMsg, setSpinMsg] = useState('');
  const [spinMode, setSpinMode] = useState<'grant' | 'revoke'>('grant');
  const [spinLog, setSpinLog] = useState<WheelSpinLog[]>([]);
  const [expandedSpinUsers, setExpandedSpinUsers] = useState<Set<string>>(new Set());

  // Registration lock
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [regMsg, setRegMsg] = useState('');

  // Wanted notices
  const [pendingNotices, setPendingNotices] = useState<WantedNotice[]>([]);
  const [activeNotices, setActiveNotices] = useState<WantedNotice[]>([]);

  // Kim Bang
  const [kimBangEntries, setKimBangEntries] = useState<KimBangEntry[]>([]);
  const [kimBangMsg, setKimBangMsg] = useState('');

  // Danh vọng editing
  const [editingDanhVongId, setEditingDanhVongId] = useState<string | null>(null);
  const [danhVongValue, setDanhVongValue] = useState('');

  // Password editing
  const [editingPwdId, setEditingPwdId] = useState<string | null>(null);
  const [pwdValue, setPwdValue] = useState('');
  const [revealPwdIds, setRevealPwdIds] = useState<Set<string>>(new Set());
  const [pwdHistoryIds, setPwdHistoryIds] = useState<Set<string>>(new Set());
  const [pwdHistoryMap, setPwdHistoryMap] = useState<Record<string, PasswordHistoryEntry[]>>({});

  // Transaction editing
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Partial<Transaction>>({});

  // Asset revocation
  const [revokeUserId, setRevokeUserId] = useState('');
  const [revokeCurrencyType, setRevokeCurrencyType] = useState('HUA_TIEN');
  const [revokeAmount, setRevokeAmount] = useState(0);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeMsg, setRevokeMsg] = useState('');

  // Undo
  const [undoMsg, setUndoMsg] = useState('');

  // Player lookup
  const [lookupSearch, setLookupSearch] = useState('');
  const [lookupSelectedId, setLookupSelectedId] = useState<string | null>(null);

  // Wills management
  const [wills, setWills] = useState<Will[]>([]);
  const [willFilter, setWillFilter] = useState<'all' | WillStatus>('all');
  const [expandedWillIds, setExpandedWillIds] = useState<Set<string>>(new Set());
  const [willNoteDraft, setWillNoteDraft] = useState<Record<string, string>>({});
  const [willMsg, setWillMsg] = useState('');

  // Generic confirm dialog
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    details?: { label: string; value: string }[];
    action: () => Promise<void> | void;
  } | null>(null);

  const requireConfirm = (
    title: string,
    message: string,
    action: () => Promise<void> | void,
    details?: { label: string; value: string }[],
    confirmLabel?: string,
  ) => {
    setConfirmState({ title, message, action, details, confirmLabel });
  };

  // Helper: log an admin action to the audit trail
  const logAction = async (action: string, targetUserId?: string, targetDesc?: string, details?: Record<string, unknown>) => {
    await supabase.rpc('log_admin_action', {
      p_action: action,
      p_target_user_id: targetUserId ?? null,
      p_target_description: targetDesc ?? null,
      p_details: details ?? null,
    });
  };

  const toggleRegistration = async () => {
    setRegMsg('');
    const newValue = !registrationOpen;
    const { error } = await supabase
      .from('site_settings')
      .update({ registration_open: newValue, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) {
      setRegMsg(`Lỗi: ${error.message}`);
      return;
    }
    setRegistrationOpen(newValue);
    setRegMsg(newValue ? 'Đã mở cổng đăng ký.' : 'Đã khóa cổng đăng ký.');
    logAction('toggle_registration', undefined, newValue ? 'Mở cổng đăng ký' : 'Khóa cổng đăng ký');
  };

  const handleSpins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spinUserId || spinAmount < 1) return;
    setSpinMsg('');
    const targetUser = allProfiles.find(p => p.id === spinUserId);
    const targetName = targetUser?.oc_name || spinUserId.slice(0, 8);

    if (spinMode === 'revoke') {
      requireConfirm(
        'Trừ Lượt Quay',
        `Bạn sắp trừ ${spinAmount} lượt quay khỏi tài khoản "${targetName}". Người chơi sẽ không nhận được thông báo nào về thao tác này.`,
        async () => {
          const { error } = await supabase.rpc('admin_revoke_spins', {
            p_user_id: spinUserId,
            p_amount: spinAmount,
          });
          if (error) {
            setSpinMsg(`Lỗi: ${error.message}`);
            return;
          }
          setSpinMsg(`Đã trừ ${spinAmount} lượt quay thành công.`);
          logAction('revoke_spins', spinUserId, `Trừ ${spinAmount} lượt quay của ${targetName}`, { amount: spinAmount });
          setSpinUserId('');
          setSpinAmount(1);
          fetchAllData();
        },
        [
          { label: 'Người chơi', value: targetName },
          { label: 'Số lượt trừ', value: String(spinAmount) },
        ],
        'Trừ lượt quay',
      );
    } else {
      const { error } = await supabase.rpc('admin_grant_spins', {
        p_user_id: spinUserId,
        p_amount: spinAmount,
      });
      if (error) {
        setSpinMsg(`Lỗi: ${error.message}`);
        return;
      }
      setSpinMsg(`Đã cấp ${spinAmount} lượt quay thành công.`);
      logAction('grant_spins', spinUserId, `Cấp ${spinAmount} lượt quay cho ${targetName}`, { amount: spinAmount });
      setSpinUserId('');
      setSpinAmount(1);
      fetchAllData();
    }
  };

  const toggleRevealPwd = (id: string) => {
    setRevealPwdIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const togglePwdHistory = async (userId: string) => {
    setPwdHistoryIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        if (!pwdHistoryMap[userId]) {
          supabase
            .from('password_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setPwdHistoryMap(m => ({ ...m, [userId]: data as PasswordHistoryEntry[] }));
            });
        }
      }
      return next;
    });
  };

  const handleSavePassword = async (userId: string) => {
    if (!pwdValue || pwdValue.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    const targetUser = allProfiles.find(p => p.id === userId);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ user_id: userId, new_password: pwdValue }),
    });
    if (!response.ok) {
      let errMsg = `Lỗi ${response.status}`;
      try {
        const errBody = await response.json();
        errMsg = errBody.error || errMsg;
      } catch { /* non-JSON error body */ }
      alert(`Lỗi: ${errMsg}`);
      return;
    }
    const result = await response.json();
    if (result.error) {
      alert(`Lỗi: ${result.error}`);
      return;
    }
    logAction('update_password', userId, `Đổi mật khẩu cho ${targetUser?.oc_name || userId.slice(0, 8)}`);
    setEditingPwdId(null);
    setPwdValue('');
    fetchAllData();
  };

  const handleStatusUpdate = async (userId: string, field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => {
    const targetUser = allProfiles.find(p => p.id === userId);
    const oldValue = targetUser ? (targetUser as Record<string, unknown>)[field] as string : '';
    const { data, error: rpcError } = await supabase.rpc('admin_update_status', {
      p_user_id: userId,
      p_field: field,
      p_value: value,
    });
    if (rpcError) { alert(`Lỗi: ${rpcError.message}`); return; }
    if (!data || !data.success) { alert(`Lỗi: ${data?.error || 'Không thể cập nhật'}`); return; }
    const fieldLabel = field === 'status_physical' ? 'Thể Chất' : field === 'status_spiritual' ? 'Tâm Linh' : 'Tinh Thần';
    logAction('update_status', userId, `Sửa ${fieldLabel} của ${targetUser?.oc_name || userId.slice(0, 8)} → "${value}"`, { field, value, previous_values: { value: oldValue } });
    fetchAllData();
  };

  const fetchAllData = useCallback(async () => {
    const [pending, approved, all, items, pages, txs, inv, settings, pendingWanted, activeWanted, kimBang, audit, spins] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('shop_items').select('*').order('price', { ascending: true }),
      supabase.from('site_pages').select('*').order('page_number', { ascending: true }),
      supabase.from('transactions').select('*, profiles(oc_name, email)').order('created_at', { ascending: false }).limit(100),
      supabase.from('inventories').select('*, shop_items(name, category), profiles(oc_name)').order('acquired_at', { ascending: false }),
      supabase.from('site_settings').select('registration_open').eq('id', 1).maybeSingle(),
      supabase.from('wanted_notices').select('id, submitter_id, target_name, gender, age, occupation, organization, identifying_features, reason, task_requirement, completion_condition, avatar_url, reward_amount, reward_method, deadline, status, code, published_at, created_at').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('wanted_notices').select('id, submitter_id, target_name, gender, age, occupation, organization, identifying_features, reason, task_requirement, completion_condition, avatar_url, reward_amount, reward_method, deadline, status, code, published_at, created_at').eq('status', 'active').order('published_at', { ascending: false, nullsFirst: false }),
      supabase.from('kim_bang').select('id, rank, identity_name, wealth, quests_completed, honor_title, avatar_url, epithet, updated_at').order('rank', { ascending: true }),
      supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('wheel_spin_log').select('id, user_id, oc_name, reward_key, reward_label, reward_group, is_special, created_at').order('created_at', { ascending: false }).limit(500),
      supabase.from('wills').select('*').order('created_at', { ascending: false }),
    ]);
    if (willData?.data) setWills(willData.data as Will[]);
    if (kimBang?.data) setKimBangEntries(kimBang.data as KimBangEntry[]);
    if (pending.data) setPendingProfiles(pending.data as Profile[]);
    if (approved.data) setApprovedProfiles(approved.data as Profile[]);
    if (all.data) setAllProfiles(all.data as Profile[]);
    if (items.data) setShopItems(items.data as ShopItem[]);
    if (pages.data) setSitePages(pages.data as SitePage[]);
    if (txs.data) setTransactions(txs.data as Transaction[]);
    if (inv.data) setAllInventory(inv.data as (InventoryItem & { profiles?: { oc_name: string } | null })[]);
    if (settings?.data) setRegistrationOpen(settings.data.registration_open);
    if (pendingWanted?.data) setPendingNotices(pendingWanted.data as WantedNotice[]);
    if (activeWanted?.data) setActiveNotices(activeWanted.data as WantedNotice[]);
    if (audit?.data) setAuditLogs(audit.data as AuditLog[]);
    if (spins?.data) setSpinLog(spins.data as WheelSpinLog[]);
  }, []);

  const handleReviewWill = async (willId: string, newStatus: WillStatus) => {
    const will = wills.find(w => w.id === willId);
    if (!will) return;
    const code = newStatus === 'approved' ? `DC-${Math.floor(100000 + Math.random() * 900000)}` : null;
    const note = willNoteDraft[willId] || null;
    const { error } = await supabase.from('wills').update({
      status: newStatus,
      reviewer_id: profile?.id || null,
      reviewer_name: profile?.oc_name || null,
      reviewed_at: new Date().toISOString(),
      will_code: code,
      admin_note: note,
    }).eq('id', willId);
    if (error) { setWillMsg(`Lỗi: ${error.message}`); return; }
    const statusLabel = newStatus === 'approved' ? 'phê duyệt' : newStatus === 'rejected' ? 'từ chối' : 'yêu cầu chỉnh sửa';
    logAction('review_will', will.user_id, `${statusLabel} Di Chúc của ${will.author_oc_name || will.user_id.slice(0, 8)}`, { will_id: willId, status: newStatus, code });
    setWillNoteDraft(prev => { const n = { ...prev }; delete n[willId]; return n; });
    setWillMsg(`Đã ${statusLabel} Di Chúc.`);
    setTimeout(() => setWillMsg(''), 3000);
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const approveUser = async (userId: string) => {
    const { error } = await supabase.rpc('admin_approve_user', {
      p_user_id: userId,
      p_admin_id: profile?.id,
    });
    if (error) {
      alert(`Lỗi phê duyệt: ${error.message}`);
      return;
    }
    const targetUser = pendingProfiles.find(p => p.id === userId);
    logAction('approve_user', userId, `Phê duyệt ${targetUser?.oc_name || userId.slice(0, 8)}`);
    fetchAllData();
  };

  const rejectUser = (userId: string) => {
    const targetUser = pendingProfiles.find(p => p.id === userId);
    const name = targetUser?.oc_name || userId.slice(0, 8);
    requireConfirm(
      'Từ Chối Tài Khoản',
      `Bạn sắp từ chối và xóa vĩnh viễn tài khoản "${name}". Hành động này không thể hoàn tác.`,
      async () => {
        await supabase.from('profiles').delete().eq('id', userId);
        logAction('reject_user', userId, `Từ chối và xóa ${name}`);
        fetchAllData();
      },
      [{ label: 'Người chơi', value: name }],
      'Xóa tài khoản',
    );
  };

  const handleCurrencyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !reason || amount === 0) return;

    const { data, error: rpcError } = await supabase.rpc('admin_adjust_currency', {
      p_user_id: selectedUserId,
      p_amount: amount,
      p_currency_type: currencyType,
      p_reason: reason,
    });

    if (rpcError) {
      alert(`Lỗi: ${rpcError.message}`);
      return;
    }

    if (data && data.success) {
      const targetUser = allProfiles.find(p => p.id === selectedUserId);
      logAction('adjust_currency', selectedUserId,
        `${amount > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(amount)} ${CURRENCY_LABELS[currencyType]} cho ${targetUser?.oc_name || selectedUserId.slice(0, 8)}`,
        { amount, currency_type: currencyType, reason });
      setAmount(0);
      setReason('');
      setSelectedUserId('');
      fetchAllData();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: newItem.name,
      category: newItem.category,
      price: newItem.price,
      currency_type: newItem.currency_type,
      shop_area: newItem.shop_area,
      description: newItem.description,
      stock: newItem.stock,
    };
    if (newItem.price_secondary > 0 && newItem.currency_type_secondary) {
      payload.price_secondary = newItem.price_secondary;
      payload.currency_type_secondary = newItem.currency_type_secondary;
    }
    if (newItem.purchase_limit) payload.purchase_limit = newItem.purchase_limit;
    const { error } = await supabase.from('shop_items').insert([payload]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('add_shop_item', undefined, `Thêm vật phẩm "${newItem.name}" (${newItem.shop_area})`, { name: newItem.name, price: newItem.price });
    setNewItem({
      name: '', category: '', price: 0, currency_type: 'CONG_DUC',
      price_secondary: 0, currency_type_secondary: '',
      shop_area: 'Thường', purchase_limit: '', description: '', stock: 99,
    });
    fetchAllData();
  };

  const handleEditItem = (item: ShopItem) => {
    setEditingItemId(item.id);
    setEditItem({ ...item });
  };

  const handleSaveEditItem = async (itemId: string) => {
    const oldItem = shopItems.find(i => i.id === itemId);
    const { error } = await supabase.from('shop_items').update(editItem).eq('id', itemId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('edit_shop_item', undefined, `Sửa vật phẩm "${editItem.name}"`, { item_id: itemId, changes: editItem, previous_values: oldItem });
    setEditingItemId(null);
    setEditItem({});
    fetchAllData();
  };

  const handleDeleteItem = (itemId: string) => {
    const item = shopItems.find(i => i.id === itemId);
    const name = item?.name || itemId.slice(0, 8);
    requireConfirm(
      'Xóa Vật Phẩm',
      `Bạn sắp xóa vật phẩm "${name}" khỏi thương thành. Người chơi sẽ không thể mua vật phẩm này nữa.`,
      async () => {
        const { error } = await supabase.from('shop_items').delete().eq('id', itemId);
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        logAction('delete_shop_item', undefined, `Xóa vật phẩm "${name}"`, { item_id: itemId });
        fetchAllData();
      },
      [{ label: 'Vật phẩm', value: name }],
      'Xóa vật phẩm',
    );
  };

  const handleRemoveInventoryItem = (invId: string, itemName: string) => {
    const inv = allInventory.find(i => i.id === invId);
    const playerName = inv?.profiles?.oc_name || '';
    requireConfirm(
      'Thu Hồi Vật Phẩm',
      `Bạn sắp thu hồi "${itemName}" khỏi kho của ${playerName}. Vật phẩm sẽ bị xóa vĩnh viễn khỏi kho người chơi.`,
      async () => {
        const { error } = await supabase.from('inventories').delete().eq('id', invId);
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        logAction('revoke_inventory_item', inv?.user_id, `Thu hồi "${itemName}" khỏi kho ${playerName}`.trim(), { inv_id: invId, item_name: itemName });
        fetchAllData();
      },
      [
        { label: 'Vật phẩm', value: itemName },
        { label: 'Người chơi', value: playerName },
      ],
      'Thu hồi',
    );
  };

  const handleGrantInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get('inv_user_id') as string;
    const itemId = formData.get('inv_item_id') as string;
    if (!userId || !itemId) return;
    const { data, error } = await supabase.rpc('admin_grant_inventory_item', {
      p_user_id: userId,
      p_item_id: itemId,
    });
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === userId);
    const itemName = data?.item_name || itemId.slice(0, 8);
    logAction('grant_inventory_item', userId, `Cấp "${itemName}" cho ${targetUser?.oc_name || ''}`.trim(), { item_id: itemId });
    form.reset();
    fetchAllData();
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('site_pages').insert([newPage]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('add_page', undefined, `Thêm trang bách khoa "${newPage.title}"`, { page_number: newPage.page_number });
    setNewPage({ page_number: 1, title: '', category: '', content: '' });
    fetchAllData();
  };

  const handleDeletePage = (pageId: string) => {
    const page = sitePages.find(p => p.id === pageId);
    const title = page?.title || pageId.slice(0, 8);
    requireConfirm(
      'Xóa Trang Bách Khoa',
      `Bạn sắp xóa trang "${title}". Hành động này không thể hoàn tác.`,
      async () => {
        const { error } = await supabase.from('site_pages').delete().eq('id', pageId);
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        logAction('delete_page', undefined, `Xóa trang "${title}"`, { page_id: pageId });
        fetchAllData();
      },
      [{ label: 'Trang', value: title }],
      'Xóa trang',
    );
  };

  const handleApproveWanted = async (id: string) => {
    const code = `#${Math.floor(100000 + Math.random() * 900000)}`;
    const { error } = await supabase.from('wanted_notices').update({
      status: 'active',
      code,
      published_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const notice = pendingNotices.find(n => n.id === id);
    logAction('approve_wanted', undefined, `Duyệt lệnh truy nã "${notice?.target_name || id.slice(0, 8)}" (${code})`, { notice_id: id, code });
    fetchAllData();
  };

  const handleRejectWanted = async (id: string) => {
    const { error } = await supabase.from('wanted_notices').update({ status: 'rejected' }).eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const notice = pendingNotices.find(n => n.id === id);
    logAction('reject_wanted', undefined, `Từ chối lệnh truy nã "${notice?.target_name || id.slice(0, 8)}"`, { notice_id: id });
    fetchAllData();
  };

  const handleCompleteWanted = async (id: string) => {
    const { error } = await supabase.from('wanted_notices').update({ status: 'completed' }).eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const notice = activeNotices.find(n => n.id === id);
    logAction('complete_wanted', undefined, `Đóng lệnh truy nã "${notice?.target_name || id.slice(0, 8)}"`, { notice_id: id });
    fetchAllData();
  };

  const handleDeleteWanted = (id: string) => {
    requireConfirm(
      'Xóa Lệnh Truy Nã',
      'Bạn sắp xóa vĩnh viễn lệnh truy nã này. Hành động này không thể hoàn tác.',
      async () => {
        const { error } = await supabase.from('wanted_notices').delete().eq('id', id);
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        logAction('delete_wanted', undefined, `Xóa lệnh truy nã ${id.slice(0, 8)}`, { notice_id: id });
        fetchAllData();
      },
      undefined,
      'Xóa lệnh truy nã',
    );
  };

  const handleUpdateKimBang = async (id: string, field: keyof KimBangEntry, value: string | number) => {
    setKimBangMsg('');
    const cleanValue = typeof value === 'string' ? value.trim() : value;
    const oldEntry = kimBangEntries.find(e => e.id === id);
    const oldValue = oldEntry ? (oldEntry as Record<string, unknown>)[field] as string : '';
    const { error } = await supabase.from('kim_bang').update({ [field]: cleanValue, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { setKimBangMsg(`Lỗi: ${error.message}`); return; }
    logAction('update_kim_bang', undefined, `Cập nhật Kim Bảng hạng ${id} — ${field}`, { kim_bang_id: id, field, value: cleanValue, previous_values: { value: oldValue } });
    fetchAllData();
  };

  const handleSaveDanhVong = async (userId: string) => {
    const targetUser = allProfiles.find(p => p.id === userId);
    const oldDanhVong = targetUser?.danh_vong || 'Vô Danh';
    const { error } = await supabase.from('profiles').update({ danh_vong: danhVongValue.trim() || 'Vô Danh' }).eq('id', userId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('set_danh_vong', userId, `Sửa danh vọng ${targetUser?.oc_name || userId.slice(0, 8)} → "${danhVongValue.trim() || 'Vô Danh'}"`, { danh_vong: danhVongValue.trim() || 'Vô Danh', previous_values: { danh_vong: oldDanhVong } });
    setEditingDanhVongId(null);
    setDanhVongValue('');
    fetchAllData();
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTx({ reason: tx.reason, amount: tx.amount, currency_type: tx.currency_type, related_user_name: tx.related_user_name });
  };

  const handleSaveEditTransaction = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    const oldValues = tx ? { amount: tx.amount, currency_type: tx.currency_type, reason: tx.reason, related_user_name: tx.related_user_name } : {};
    const { data, error } = await supabase.rpc('admin_edit_transaction', {
      p_tx_id: txId,
      p_amount: editTx.amount ?? undefined,
      p_currency_type: editTx.currency_type ?? undefined,
      p_reason: editTx.reason ?? undefined,
      p_related_user_name: editTx.related_user_name ?? undefined,
    });
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('edit_transaction', tx?.user_id, `Sửa giao dịch ${txId.slice(0, 8)} (${tx?.profiles?.oc_name || ''})`.trim(), { tx_id: txId, changes: editTx, new_balance: data?.new_balance, previous_values: oldValues });
    setEditingTxId(null);
    setEditTx({});
    fetchAllData();
  };

  const handleDeleteTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    const playerName = tx?.profiles?.oc_name || '';
    requireConfirm(
      'Xóa Giao Dịch',
      'Bạn sắp xóa giao dịch này. Số dư người chơi sẽ được hoàn lại. Hành động này không thể hoàn tác.',
      async () => {
        const { data, error } = await supabase.rpc('admin_delete_transaction', { p_tx_id: txId });
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        logAction('delete_transaction', tx?.user_id, `Xóa giao dịch ${txId.slice(0, 8)} (${playerName}) — hoàn ${tx?.amount || 0} ${tx?.currency_type ? CURRENCY_LABELS[tx.currency_type] : ''}`.trim(), { tx_id: txId, reversed: data });
        fetchAllData();
      },
      [
        { label: 'Người chơi', value: playerName },
        { label: 'Số tiền', value: `${tx?.amount || 0} ${tx?.currency_type ? CURRENCY_LABELS[tx.currency_type] : ''}` },
        { label: 'Lý do', value: tx?.reason || '—' },
      ],
      'Xóa giao dịch',
    );
  };

  const handleRevokeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeUserId || !revokeReason) return;
    if (revokeAmount === 0 && (!revokeCurrencyType || revokeAmount <= 0)) {
      alert('Vui lòng nhập số lượng cần thu hồi.');
      return;
    }
    setRevokeMsg('');
    const { data, error } = await supabase.rpc('admin_revoke_asset', {
      p_user_id: revokeUserId,
      p_currency_type: revokeCurrencyType || null,
      p_amount: revokeAmount,
      p_reason: revokeReason,
    });
    if (error) { setRevokeMsg(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === revokeUserId);
    logAction('revoke_asset', revokeUserId, `Thu hồi tài sản của ${targetUser?.oc_name || revokeUserId.slice(0, 8)}: ${revokeAmount} ${CURRENCY_LABELS[revokeCurrencyType]} — ${revokeReason}`, { amount: revokeAmount, currency_type: revokeCurrencyType, reason: revokeReason, result: data });
    setRevokeMsg(`Đã thu hồi ${revokeAmount} ${CURRENCY_LABELS[revokeCurrencyType]} và gửi thông báo đến người chơi.`);
    setRevokeAmount(0);
    setRevokeReason('');
    setRevokeUserId('');
    fetchAllData();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get('tx_user_id') as string;
    const txAmount = parseInt(formData.get('tx_amount') as string, 10);
    const txType = formData.get('tx_currency_type') as string;
    const txReason = formData.get('tx_reason') as string;
    const txRelated = formData.get('tx_related') as string || null;
    if (!userId || !txReason || isNaN(txAmount)) return;
    const { error } = await supabase.from('transactions').insert([{
      user_id: userId,
      amount: txAmount,
      currency_type: txType,
      reason: txReason,
      related_user_name: txRelated,
    }]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === userId);
    logAction('add_transaction', userId, `Thêm giao dịch ${txAmount > 0 ? '+' : ''}${txAmount} ${CURRENCY_LABELS[txType]} cho ${targetUser?.oc_name || ''}`.trim(), { amount: txAmount, currency_type: txType, reason: txReason });
    form.reset();
    fetchAllData();
  };

  const UNDOABLE_ACTIONS: Set<string> = new Set([
    'adjust_currency', 'revoke_asset', 'add_transaction', 'edit_transaction',
    'grant_inventory_item', 'edit_shop_item', 'add_shop_item',
    'set_danh_vong', 'update_status', 'update_kim_bang',
  ]);

  const handleUndoAction = (auditId: string) => {
    requireConfirm(
      'Khôi Phục Thao Tác',
      'Bạn sắp khôi phục thao tác này. Thao tác sẽ được đảo ngược và dữ liệu sẽ đồng bộ.',
      async () => {
        setUndoMsg('');
        const { data, error } = await supabase.rpc('admin_undo_action', { p_audit_id: auditId });
        if (error) { setUndoMsg(`Lỗi: ${error.message}`); return; }
        setUndoMsg(`Đã khôi phục: ${data?.description || 'thành công'}`);
        fetchAllData();
      },
      undefined,
      'Khôi phục',
    );
  };

  const toggleReveal = (id: string) => {
    setRevealIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto pt-16 text-center">
        <div className="p-8 rounded-2xl bg-black/40 border border-red-500/20">
          <Shield className="w-12 h-12 text-red-400/60 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-amber-100/80">Không Có Quyền Truy Cập</h2>
          <p className="text-sm text-gray-500 mt-2">Tài khoản của bạn không có quyền quản trị.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'lookup', label: 'Tra Cứu', icon: UserSearch },
    { id: 'accounts', label: 'Phê Duyệt', icon: Users },
    { id: 'currency', label: 'Tài Sản', icon: Coins },
    { id: 'identities', label: 'Danh Tính', icon: Ghost },
    { id: 'shop', label: 'Thương Thành', icon: Store },
    { id: 'inventories', label: 'Kho Vật Phẩm', icon: Package },
    { id: 'pages', label: 'Bách Khoa', icon: BookOpen },
    { id: 'wheel', label: 'Vòng Quay', icon: Dices },
    { id: 'status', label: 'Trạng Thái', icon: Heart },
    { id: 'wanted', label: 'Truy Nã', icon: FileWarning },
    { id: 'wills', label: 'Di Chúc', icon: FileSignature },
    { id: 'kimbang', label: 'Kim Bảng', icon: Crown },
    { id: 'audit', label: 'Nhật Ký', icon: ScrollText },
    { id: 'settings', label: 'Cài Đặt', icon: Shield },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
  const labelCls = "block text-xs text-gray-400 mb-1.5 uppercase tracking-wider";
  const cardCls = "p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10";

  // Helper: find admin name by id
  const adminName = (id: string | null) => allProfiles.find(p => p.id === id)?.oc_name || (id ? id.slice(0, 8) : '—');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#670201] to-[#a00404] flex items-center justify-center shadow-lg shadow-[#670201]/30 flex-shrink-0">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-amber-100/90 truncate">Bảng Điều Khiển Quản Trị</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Ban Quản Lý Trùng Hoan Tái · {profile?.oc_name}</p>
        </div>
      </div>

      {/* Tab Bar — horizontal scroll on mobile, wrap on desktop */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 pb-2 -mx-2 px-2 sm:flex-wrap sm:mx-0 sm:px-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#670201]/30 text-amber-100'
                  : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'accounts' && pendingProfiles.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">{pendingProfiles.length}</span>
              )}
              {tab.id === 'wanted' && pendingNotices.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">{pendingNotices.length}</span>
              )}
              {tab.id === 'wills' && wills.filter(w => w.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">{wills.filter(w => w.status === 'pending').length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Chờ Phê Duyệt</h3>
            {pendingProfiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không có tài khoản nào chờ phê duyệt.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProfiles.map(p => (
                  <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-amber-100/90 truncate">{p.oc_name}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{p.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{p.gender} · {p.anonymous_name}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-gray-600 flex-shrink-0" />
                          <span className="text-xs text-gray-500 font-mono">
                            {revealPwdIds.has(p.id) ? (p.password || '(chưa có)') : '••••••••'}
                          </span>
                          <button onClick={() => toggleRevealPwd(p.id)} className="p-0.5 text-gray-600 hover:text-amber-300 transition-all">
                            {revealPwdIds.has(p.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        {p.bio && <p className="text-xs text-gray-500 mt-2 italic line-clamp-3">"{p.bio}"</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approveUser(p.id)} className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => rejectUser(p.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Tài Khoản Đã Phê Duyệt ({approvedProfiles.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{p.oc_name}</p>
                    {p.danh_vong && p.danh_vong !== 'Vô Danh' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold whitespace-nowrap">{p.danh_vong}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{p.email}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-amber-300">🪙 {p.hua_tien}</span>
                    <span className="text-cyan-300">✨ {p.cong_duc}</span>
                    <span className="text-amber-300">🌑 {p.am_duc}</span>
                  </div>
                  {p.approved_by && (
                    <p className="text-[10px] text-gray-600 mt-1">
                      Duyệt bởi: <span className="text-amber-300/70">{adminName(p.approved_by)}</span>
                      {p.approved_at && <span> · {new Date(p.approved_at).toLocaleDateString('vi-VN')}</span>}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {editingDanhVongId === p.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={danhVongValue}
                          onChange={e => setDanhVongValue(e.target.value)}
                          placeholder="vd: BAN QUẢN LÝ (để trống = Vô Danh)"
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                        />
                        <button onClick={() => handleSaveDanhVong(p.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingDanhVongId(null); setDanhVongValue(''); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingDanhVongId(p.id); setDanhVongValue(p.danh_vong || 'Vô Danh'); }}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-300 transition-all"
                      >
                        <Edit3 className="w-3 h-3" /> Sửa danh vọng
                      </button>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {editingPwdId === p.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pwdValue}
                          onChange={e => setPwdValue(e.target.value)}
                          placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                        />
                        <button onClick={() => handleSavePassword(p.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingPwdId(null); setPwdValue(''); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Lock className="w-3 h-3 text-gray-600 flex-shrink-0" />
                          <span className="text-[10px] text-gray-500 font-mono truncate">
                            {revealPwdIds.has(p.id) ? (p.password || '(chưa có)') : '••••••••'}
                          </span>
                          <button onClick={() => toggleRevealPwd(p.id)} className="p-0.5 text-gray-600 hover:text-amber-300 transition-all flex-shrink-0">
                            {revealPwdIds.has(p.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <button
                          onClick={() => { setEditingPwdId(p.id); setPwdValue(p.password || ''); }}
                          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-300 transition-all flex-shrink-0"
                        >
                          <Edit3 className="w-3 h-3" /> Đổi mật khẩu
                        </button>
                      </div>
                    )}
                  </div>
                  {pwdHistoryIds.has(p.id) && pwdHistoryMap[p.id] && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-600 mb-1.5 flex items-center gap-1">
                        <History className="w-3 h-3" /> Lịch sử mật khẩu
                      </p>
                      {pwdHistoryMap[p.id].length === 0 ? (
                        <p className="text-[10px] text-gray-600 italic">Chưa có lịch sử đổi mật khẩu.</p>
                      ) : (
                        <div className="space-y-1">
                          {pwdHistoryMap[p.id].map(h => (
                            <div key={h.id} className="text-[10px] text-gray-500 font-mono">
                              <span className="text-gray-600">{new Date(h.created_at).toLocaleString('vi-VN')}</span>
                              <span className="text-gray-600"> · Cũ: </span>
                              <span className="text-gray-400">{h.old_password || '(không)'}</span>
                              <span className="text-gray-600"> → Mới: </span>
                              <span className="text-amber-300/70">{h.new_password}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => togglePwdHistory(p.id)}
                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-amber-300 transition-all mt-1.5"
                  >
                    <History className="w-3 h-3" /> {pwdHistoryIds.has(p.id) ? 'Ẩn lịch sử' : 'Xem lịch sử mật khẩu'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Tab */}
      {activeTab === 'currency' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Điều Chỉnh Tài Sản</h3>
            <form onSubmit={handleCurrencyChange} className="space-y-4">
              <div>
                <label className={labelCls}>Người chơi</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Loại tiền tệ</label>
                  <select value={currencyType} onChange={e => setCurrencyType(e.target.value)} className={inputCls}>
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Số lượng (+/-)</label>
                  <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Lý do (bắt buộc)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} required placeholder="Lý do thay đổi..." className={inputCls} />
              </div>
              <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                Áp Dụng Thay Đổi
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <Undo2 className="w-5 h-5 text-red-400/70" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Thu Hồi Tài Sản</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Thu hồi Hoa Tiền, Công Đức hoặc Âm Đức của người chơi kèm lý do. Người chơi sẽ nhận được thông báo về việc thu hồi.
            </p>
            <form onSubmit={handleRevokeAsset} className="space-y-4">
              <div>
                <label className={labelCls}>Người chơi</label>
                <select value={revokeUserId} onChange={e => setRevokeUserId(e.target.value)} required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · HT: {p.hua_tien} · CD: {p.cong_duc} · AD: {p.am_duc}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Loại tiền tệ</label>
                  <select value={revokeCurrencyType} onChange={e => setRevokeCurrencyType(e.target.value)} className={inputCls}>
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Số lượng thu hồi</label>
                  <input type="number" min={0} value={revokeAmount} onChange={e => setRevokeAmount(parseInt(e.target.value) || 0)} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Lý do (bắt buộc)</label>
                <input type="text" value={revokeReason} onChange={e => setRevokeReason(e.target.value)} required placeholder="Lý do thu hồi..." className={inputCls} />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-sm font-bold rounded-lg transition-all">
                <Undo2 className="w-4 h-4" /> Thu Hồi Tài Sản
              </button>
              {revokeMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${revokeMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                  {revokeMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {revokeMsg}
                </div>
              )}
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Bổ Sung Giao Dịch Mới</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className={labelCls}>Người chơi</label>
                <select name="tx_user_id" required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Số lượng (+/-)</label>
                  <input type="number" name="tx_amount" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Loại tiền</label>
                  <select name="tx_currency_type" className={inputCls}>
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Người liên quan</label>
                  <input type="text" name="tx_related" placeholder="Tên (nếu có)" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Lý do</label>
                <input type="text" name="tx_reason" required placeholder="Lý do giao dịch..." className={inputCls} />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Giao Dịch
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Lịch Sử Giao Dịch Hệ Thống</h3>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào.</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                    {editingTxId === tx.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={editTx.amount ?? 0}
                            onChange={e => setEditTx({ ...editTx, amount: parseInt(e.target.value) || 0 })}
                            placeholder="Số lượng"
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                          />
                          <select
                            value={editTx.currency_type ?? 'HUA_TIEN'}
                            onChange={e => setEditTx({ ...editTx, currency_type: e.target.value })}
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                          >
                            <option value="HUA_TIEN">Hoa Tiền</option>
                            <option value="CONG_DUC">Công Đức</option>
                            <option value="AM_DUC">Âm Đức</option>
                          </select>
                          <input
                            type="text"
                            value={editTx.related_user_name ?? ''}
                            onChange={e => setEditTx({ ...editTx, related_user_name: e.target.value })}
                            placeholder="Người liên quan"
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                          />
                        </div>
                        <input
                          type="text"
                          value={editTx.reason ?? ''}
                          onChange={e => setEditTx({ ...editTx, reason: e.target.value })}
                          placeholder="Lý do"
                          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEditTransaction(tx.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Save className="w-3.5 h-3.5" /> Lưu
                          </button>
                          <button onClick={() => { setEditingTxId(null); setEditTx({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-300 break-words">{tx.reason}</p>
                          <p className="text-xs text-gray-500">
                            <span className="text-amber-300/80 font-semibold">{tx.profiles?.oc_name || 'N/A'}</span>
                            <span className="text-gray-600 font-mono"> (ID: {tx.user_id.slice(0, 8)})</span>
                            {tx.related_user_name && (
                              <span className="text-amber-300/70"> · {tx.amount < 0 ? '→' : '←'} {tx.related_user_name}</span>
                            )}
                            <span className="text-gray-600 font-mono hidden sm:inline"> · Tx: {tx.id.slice(0, 8)}</span>
                            <span> · {new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                            <p className="text-xs text-gray-500">{CURRENCY_LABELS[tx.currency_type]}</p>
                          </div>
                          <button onClick={() => handleEditTransaction(tx)} className="p-1.5 text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Identities Tab */}
      {activeTab === 'identities' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Ghost className="w-4 h-4 inline mr-1" />
              Quản trị viên có thể xem danh tính thật của các tài khoản ẩn danh. Nhấn vào biểu tượng mắt để hiện/ẩn.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allProfiles.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-amber-100/90 truncate">{p.oc_name}</p>
                    {p.danh_vong && p.danh_vong !== 'Vô Danh' && <span className="text-[10px] text-amber-300 font-bold">{p.danh_vong}</span>}
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 mt-1">Ẩn danh: {p.anonymous_name}</p>
                  </div>
                  <button onClick={() => toggleReveal(p.id)} className="p-2 text-gray-500 hover:text-amber-300 rounded-lg hover:bg-white/5 transition-all flex-shrink-0">
                    {revealIds.has(p.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {revealIds.has(p.id) && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-400">Email thật: <span className="text-amber-200">{p.email}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Giới tính: {p.gender}</p>
                    <p className="text-xs text-gray-400 mt-1">Đã đổi danh tính: {p.anonymous_name_changes}/3 lần</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Thêm Vật Phẩm Mới</h3>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Tên vật phẩm" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required className={inputCls} />
              <input type="text" placeholder="Danh mục" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} required className={inputCls} />
              <select value={newItem.shop_area} onChange={e => setNewItem({ ...newItem, shop_area: e.target.value })} className={inputCls}>
                <option value="Thường">Thương Thành Thường</option>
                <option value="Hiếm">Thương Thành Hiếm</option>
                <option value="Sự kiện">Thương Thành Sự Kiện</option>
              </select>
              <input type="text" placeholder="Giới hạn mua (vd: 2 lá/tuần)" value={newItem.purchase_limit} onChange={e => setNewItem({ ...newItem, purchase_limit: e.target.value })} className={inputCls} />
              <input type="number" placeholder="Giá chính" value={newItem.price || ''} onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })} required className={inputCls} />
              <select value={newItem.currency_type} onChange={e => setNewItem({ ...newItem, currency_type: e.target.value })} className={inputCls}>
                <option value="HUA_TIEN">Hoa Tiền</option>
                <option value="CONG_DUC">Công Đức</option>
                <option value="AM_DUC">Âm Đức</option>
              </select>
              <input type="number" placeholder="Giá phụ (0 = không có)" value={newItem.price_secondary || ''} onChange={e => setNewItem({ ...newItem, price_secondary: parseInt(e.target.value) || 0 })} className={inputCls} />
              <select value={newItem.currency_type_secondary} onChange={e => setNewItem({ ...newItem, currency_type_secondary: e.target.value })} className={inputCls}>
                <option value="">Không giá phụ</option>
                <option value="HUA_TIEN">Hoa Tiền</option>
                <option value="CONG_DUC">Công Đức</option>
                <option value="AM_DUC">Âm Đức</option>
              </select>
              <input type="number" placeholder="Tồn kho" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })} className={inputCls} />
              <input type="text" placeholder="Mô tả" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className={inputCls} />
              <button type="submit" className="md:col-span-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Vật Phẩm
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Vật Phẩm ({shopItems.length})</h3>
            <div className="space-y-2">
              {shopItems.map(item => (
                <div key={item.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  {editingItemId === item.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" value={editItem.name ?? ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} placeholder="Tên" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editItem.category ?? ''} onChange={e => setEditItem({ ...editItem, category: e.target.value })} placeholder="Danh mục" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="number" value={editItem.price ?? 0} onChange={e => setEditItem({ ...editItem, price: parseInt(e.target.value) || 0 })} placeholder="Giá" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <select value={editItem.currency_type ?? 'HUA_TIEN'} onChange={e => setEditItem({ ...editItem, currency_type: e.target.value })} className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40">
                          <option value="HUA_TIEN">Hoa Tiền</option>
                          <option value="CONG_DUC">Công Đức</option>
                          <option value="AM_DUC">Âm Đức</option>
                        </select>
                        <select value={editItem.shop_area ?? 'Thường'} onChange={e => setEditItem({ ...editItem, shop_area: e.target.value })} className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40">
                          <option value="Thường">Thương Thành Thường</option>
                          <option value="Hiếm">Thương Thành Hiếm</option>
                          <option value="Sự kiện">Thương Thành Sự Kiện</option>
                        </select>
                        <input type="number" value={editItem.stock ?? 0} onChange={e => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })} placeholder="Tồn kho" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editItem.purchase_limit ?? ''} onChange={e => setEditItem({ ...editItem, purchase_limit: e.target.value })} placeholder="Giới hạn mua" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editItem.description ?? ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} placeholder="Mô tả" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEditItem(item.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <Save className="w-3.5 h-3.5" /> Lưu
                        </button>
                        <button onClick={() => { setEditingItemId(null); setEditItem({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-100/90 truncate">{item.name} <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 ml-1">{item.shop_area}</span></p>
                        <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID: {item.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 truncate">{item.category} · {item.price} {CURRENCY_LABELS[item.currency_type]}{item.price_secondary && item.currency_type_secondary ? ` / ${item.price_secondary} ${CURRENCY_LABELS[item.currency_type_secondary]}` : ''} · Kho: {item.stock}</p>
                        {item.purchase_limit && <p className="text-[10px] text-gray-600 truncate">Giới hạn: {item.purchase_limit}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleEditItem(item)} className="p-2 text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventories Tab */}
      {activeTab === 'inventories' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Bổ Sung Vật Phẩm Vào Kho Người Chơi</h3>
            <form onSubmit={handleGrantInventoryItem} className="flex flex-col sm:flex-row gap-3">
              <select name="inv_user_id" required className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="">Chọn người chơi...</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email}</option>
                ))}
              </select>
              <select name="inv_item_id" required className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="">Chọn vật phẩm...</option>
                {shopItems.map(it => (
                  <option key={it.id} value={it.id}>{it.name} · ID: {it.id.slice(0, 8)} · {it.category}</option>
                ))}
              </select>
              <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Bổ Sung
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Kho Vật Phẩm Toàn Hệ Thống ({allInventory.length})</h3>
              <select value={inventoryFilter} onChange={e => setInventoryFilter(e.target.value)} className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="all">Tất cả người chơi</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            {allInventory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có vật phẩm nào trong kho.</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
                {allInventory
                  .filter(inv => inventoryFilter === 'all' || inv.user_id === inventoryFilter)
                  .map(inv => (
                    <div key={inv.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-100/90 truncate">{inv.shop_items?.name || 'Vật phẩm đã xóa'}</p>
                        <p className="text-[10px] text-gray-600 font-mono hidden sm:block">Inv: {inv.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="text-amber-300/80 font-semibold">{inv.profiles?.oc_name || 'N/A'}</span>
                          <span className="text-gray-600 font-mono"> (ID: {inv.user_id.slice(0, 8)})</span>
                          <span> · {inv.shop_items?.category || '—'} · {new Date(inv.acquired_at).toLocaleDateString('vi-VN')}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveInventoryItem(inv.id, inv.shop_items?.name || 'vật phẩm này')}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                        title="Thu hồi vật phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wheel Tab */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Quản Lý Lượt Quay Bách Pháp Mệnh</h3>
            <form onSubmit={handleSpins} className="space-y-4">
              <div>
                <label className={labelCls}>Chế độ</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSpinMode('grant'); setSpinMsg(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                      spinMode === 'grant'
                        ? 'bg-[#670201]/30 border-[#670201]/50 text-amber-200'
                        : 'bg-black/20 border-white/5 text-gray-500 hover:text-amber-200/70'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Cấp lượt
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSpinMode('revoke'); setSpinMsg(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                      spinMode === 'revoke'
                        ? 'bg-red-600/20 border-red-600/50 text-red-300'
                        : 'bg-black/20 border-white/5 text-gray-500 hover:text-red-300/70'
                    }`}
                  >
                    <Undo2 className="w-4 h-4" /> Trừ lượt
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Người chơi</label>
                <select value={spinUserId} onChange={e => setSpinUserId(e.target.value)} required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email} — Đang có {p.wheel_spins ?? 0} lượt</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Số lượt (1-1000)</label>
                <input type="number" min={1} max={1000} value={spinAmount} onChange={e => setSpinAmount(parseInt(e.target.value) || 1)} required className={inputCls} />
              </div>
              {spinMode === 'revoke' && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <p className="text-xs text-red-300/70">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Trừ lượt quay sẽ không thông báo cho người chơi và không hiển thị trong lịch sử giao dịch. Chỉ lưu trong nhật ký quản trị.
                  </p>
                </div>
              )}
              <button
                type="submit"
                className={`flex items-center gap-2 px-5 py-2.5 text-amber-100 text-sm font-bold rounded-lg transition-all ${
                  spinMode === 'grant' ? 'bg-[#670201] hover:bg-[#a00404]' : 'bg-red-600/80 hover:bg-red-700'
                }`}
              >
                {spinMode === 'grant' ? <Plus className="w-4 h-4" /> : <Undo2 className="w-4 h-4" />}
                {spinMode === 'grant' ? 'Cấp Lượt Quay' : 'Trừ Lượt Quay'}
              </button>
              {spinMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${spinMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                  {spinMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {spinMsg}
                </div>
              )}
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lượt Quay Của Người Chơi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{p.oc_name}</p>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Dices className="h-3.5 w-3.5 text-amber-300/70" />
                    <span className="text-gray-400">Lượt quay:</span>
                    <span className="font-bold text-amber-200">{p.wheel_spins ?? 0}</span>
                  </div>
                  {p.wheel_special_claimed && (
                    <p className="mt-1 text-[10px] text-rose-300/70">Đã nhận Quà Đặc Biệt</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lịch Sử Quay Theo Tài Khoản</h3>
            {spinLog.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có lượt quay nào.</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const grouped: Record<string, { userId: string; ocName: string; spins: typeof spinLog; total: number; special: number }> = {};
                  for (const entry of spinLog) {
                    const key = entry.user_id;
                    if (!grouped[key]) {
                      grouped[key] = { userId: key, ocName: entry.oc_name || allProfiles.find(p => p.id === key)?.oc_name || 'Vô Danh', spins: [], total: 0, special: 0 };
                    }
                    grouped[key].spins.push(entry);
                    grouped[key].total++;
                    if (entry.is_special) grouped[key].special++;
                  }
                  return Object.values(grouped)
                    .sort((a, b) => b.total - a.total)
                    .map(player => {
                      const isExpanded = expandedSpinUsers.has(player.userId);
                      return (
                        <div key={player.userId} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                          <button
                            onClick={() => setExpandedSpinUsers(prev => {
                              const next = new Set(prev);
                              if (next.has(player.userId)) next.delete(player.userId);
                              else next.add(player.userId);
                              return next;
                            })}
                            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#670201]/30">
                              <Dices className="h-5 w-5 text-amber-300/70" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-amber-100/90">{player.ocName}</p>
                              <p className="text-xs text-gray-500">{player.total} lượt quay{player.special > 0 && ` · ${player.special} quà đặc biệt`}</p>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-500" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />}
                          </button>
                          {isExpanded && (
                            <div className="border-t border-white/5 p-3">
                              <div className="space-y-1.5">
                                {player.spins.map((spin, idx) => (
                                  <div key={spin.id} className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-2">
                                    <span className="flex-shrink-0 text-xs font-bold text-gray-600 tabular-nums">#{player.total - idx}</span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-200 truncate">{spin.reward_label}</span>
                                        {spin.is_special && (
                                          <span className="flex-shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">Đặc Biệt</span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-gray-600">{new Date(spin.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <span className="flex-shrink-0 text-xs text-gray-500">{spin.reward_group}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Heart className="w-4 h-4 inline mr-1" />
              Quản trị viên cập nhật trạng thái Thể Chất, Tâm Linh, Tinh Thần của từng người chơi dưới dạng thẻ tag. Người chơi sẽ nhận thông báo mỗi khi trạng thái được thay đổi.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedProfiles.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.oc_name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#670201]/30 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-amber-300/60" /></div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-amber-100/90 text-sm truncate">{p.oc_name}</p>
                    <p className="text-[10px] text-gray-600 font-mono">ID: {p.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {([
                    { field: 'status_physical' as const, label: 'Thể Chất', icon: Heart, color: 'text-red-400' },
                    { field: 'status_spiritual' as const, label: 'Tâm Linh', icon: Sparkle, color: 'text-amber-400' },
                    { field: 'status_mental' as const, label: 'Tinh Thần', icon: Brain, color: 'text-purple-400' },
                  ]).map(({ field, label, icon: Icon, color }) => {
                    const currentVal = p[field];
                    const tagInfo = STATUS_TAGS.find(t => t.value === currentVal) || STATUS_TAGS.find(t => t.value === 'Bình Thường')!;
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
                              onClick={() => { if (tag.value !== currentVal) handleStatusUpdate(p.id, field, tag.value); }}
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
            ))}
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Thêm Trang Bách Khoa</h3>
            <form onSubmit={handleAddPage} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Số trang" value={newPage.page_number || ''} onChange={e => setNewPage({ ...newPage, page_number: parseInt(e.target.value) || 1 })} required className={inputCls} />
                <input type="text" placeholder="Thể loại" value={newPage.category} onChange={e => setNewPage({ ...newPage, category: e.target.value })} required className="col-span-2 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              </div>
              <input type="text" placeholder="Tiêu đề" value={newPage.title} onChange={e => setNewPage({ ...newPage, title: e.target.value })} required className={inputCls} />
              <textarea placeholder="Nội dung..." value={newPage.content} onChange={e => setNewPage({ ...newPage, content: e.target.value })} required rows={5} className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none" />
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Trang
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Trang ({sitePages.length})</h3>
            <div className="space-y-2">
              {sitePages.map(page => (
                <div key={page.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">Trang {page.page_number}: {page.title}</p>
                    <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID: {page.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 truncate">{page.category}</p>
                  </div>
                  <button onClick={() => handleDeletePage(page.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wanted Tab */}
      {activeTab === 'wanted' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lệnh Truy Nã Chờ Duyệt ({pendingNotices.length})</h3>
            {pendingNotices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không có lệnh truy nã nào chờ duyệt.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingNotices.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border border-[#670201]/30 bg-[#670201]/20">
                        {n.avatar_url ? (
                          <img src={n.avatar_url} alt={n.target_name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><FileWarning className="h-5 w-5 text-amber-300/50" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-amber-100/90 text-sm truncate">{n.target_name}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID lệnh: {n.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.occupation || '—'} · {n.gender || '—'}{n.age ? ` · ${n.age}` : ''}</p>
                        <p className="text-xs mt-1">
                          <span className="text-gray-500">Người gửi: </span>
                          <span className="text-amber-300/80 font-semibold">{allProfiles.find(p => p.id === n.submitter_id)?.oc_name || 'Ẩn danh'}</span>
                          {n.submitter_id && <span className="text-gray-600 font-mono"> (ID: {n.submitter_id.slice(0, 8)})</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.reason}</p>
                        {n.reward_amount && <p className="text-xs text-amber-200/70 mt-1">Thưởng: {n.reward_amount}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleApproveWanted(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all">
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button onClick={() => handleRejectWanted(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lệnh Truy Nã Đang Hiển Thị ({activeNotices.length})</h3>
            {activeNotices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có lệnh truy nã nào đang hiển thị.</p>
            ) : (
              <div className="space-y-2">
                {activeNotices.map(n => (
                  <div key={n.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-100/90 truncate">
                        {n.target_name} <span className="font-mono text-xs text-amber-300/70 ml-1">{n.code}</span>
                      </p>
                      <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID lệnh: {n.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        Gửi bởi: <span className="text-amber-300/80 font-semibold">{allProfiles.find(p => p.id === n.submitter_id)?.oc_name || 'Ẩn danh'}</span>
                        {n.submitter_id && <span className="text-gray-600 font-mono"> (ID: {n.submitter_id.slice(0, 8)})</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{n.reason}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleCompleteWanted(n.id)} className="px-2.5 py-1 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 text-xs font-bold transition-all">
                        Đóng
                      </button>
                      <button onClick={() => handleDeleteWanted(n.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kim Bang Tab */}
      {activeTab === 'kimbang' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Crown className="w-4 h-4 inline mr-1" />
              Cập nhật 6 vị trí Kim Bảng Đề Danh. Thay đổi sẽ hiển thị ngay trên trang Kim Bảng công khai.
            </p>
          </div>
          {kimBangMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${kimBangMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {kimBangMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {kimBangMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kimBangEntries.map(entry => (
              <div key={entry.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-ink-950 font-bold text-sm flex-shrink-0">
                    {entry.rank}
                  </div>
                  <h4 className="font-serif font-bold text-amber-100/90 text-sm sm:text-base">
                    {['', 'Đệ Nhất', 'Đệ Nhị', 'Đệ Tam', 'Đệ Tứ', 'Đệ Ngũ', 'Đệ Lục'][entry.rank]}
                  </h4>
                </div>

                {/* Avatar preview */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-lg border border-amber-500/20 bg-black/30 flex-shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url.trim()}
                        alt={entry.identity_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) parent.classList.add('flex', 'items-center', 'justify-center');
                          if (parent && !parent.querySelector('span')) {
                            const span = document.createElement('span');
                            span.textContent = 'Lỗi';
                            span.className = 'text-red-500 text-xs';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-600 text-xs">Chưa có</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      type="text"
                      defaultValue={entry.avatar_url}
                      placeholder="Dán link ảnh đại diện..."
                      onBlur={e => { if (e.target.value !== entry.avatar_url) handleUpdateKimBang(entry.id, 'avatar_url', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                    {entry.avatar_url && (
                      <button
                        onClick={() => handleUpdateKimBang(entry.id, 'avatar_url', '')}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh tính</label>
                    <input
                      type="text"
                      defaultValue={entry.identity_name}
                      placeholder="Tên nhân vật..."
                      onBlur={e => { if (e.target.value !== entry.identity_name) handleUpdateKimBang(entry.id, 'identity_name', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tài phú</label>
                      <input
                        type="text"
                        defaultValue={entry.wealth}
                        placeholder="vd: 8.460 Hoa Tiền"
                        onBlur={e => { if (e.target.value !== entry.wealth) handleUpdateKimBang(entry.id, 'wealth', e.target.value); }}
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Dị sự</label>
                      <input
                        type="number"
                        defaultValue={entry.quests_completed}
                        onBlur={e => { const v = parseInt(e.target.value) || 0; if (v !== entry.quests_completed) handleUpdateKimBang(entry.id, 'quests_completed', v); }}
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh hiệu tri ân</label>
                    <input
                      type="text"
                      defaultValue={entry.honor_title}
                      placeholder="vd: Trảm U Minh"
                      onBlur={e => { if (e.target.value !== entry.honor_title) handleUpdateKimBang(entry.id, 'honor_title', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vĩ ngữ</label>
                    <input
                      type="text"
                      defaultValue={entry.epithet}
                      placeholder="vd: Một kiếm trấn tà, danh vang đất Trùng Hoan."
                      onBlur={e => { if (e.target.value !== entry.epithet) handleUpdateKimBang(entry.id, 'epithet', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Lookup Tab */}
      {activeTab === 'lookup' && (
        <div className="space-y-4">
          {lookupSelectedId ? (
            <PlayerDetailCard
              profile={approvedProfiles.find(p => p.id === lookupSelectedId) || allProfiles.find(p => p.id === lookupSelectedId)}
              transactions={transactions.filter(t => t.user_id === lookupSelectedId)}
              inventory={allInventory.filter(i => i.user_id === lookupSelectedId)}
              onBack={() => setLookupSelectedId(null)}
              onStatusUpdate={handleStatusUpdate}
            />
          ) : (
            <div className="space-y-4">
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                  <UserSearch className="w-5 h-5 text-amber-300/70" />
                  <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Tra Cứu Người Chơi</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text"
                    value={lookupSearch}
                    onChange={e => setLookupSearch(e.target.value)}
                    placeholder="Tìm theo tên nhân vật, email hoặc ID..."
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {approvedProfiles
                  .filter(p => {
                    if (!lookupSearch.trim()) return true;
                    const q = lookupSearch.toLowerCase().trim();
                    return (
                      p.oc_name?.toLowerCase().includes(q) ||
                      p.email?.toLowerCase().includes(q) ||
                      p.id.slice(0, 8).includes(q) ||
                      p.anonymous_name?.toLowerCase().includes(q)
                    );
                  })
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setLookupSelectedId(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="text-left p-4 rounded-xl bg-black/30 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.oc_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#670201]/30 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-amber-300/60" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-amber-100/90 truncate group-hover:text-amber-100 transition-colors">{p.oc_name}</p>
                          <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500 truncate">{p.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2.5 text-xs">
                        <span className="text-amber-300">🪙 {p.hua_tien}</span>
                        <span className="text-cyan-300">✨ {p.cong_duc}</span>
                        <span className="text-amber-300">🌑 {p.am_duc}</span>
                      </div>
                    </button>
                  ))}
                {approvedProfiles.filter(p => {
                  if (!lookupSearch.trim()) return true;
                  const q = lookupSearch.toLowerCase().trim();
                  return p.oc_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.id.slice(0, 8).includes(q) || p.anonymous_name?.toLowerCase().includes(q);
                }).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8 col-span-full">Không tìm thấy người chơi nào.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <ScrollText className="w-4 h-4 inline mr-1" />
              Nhật ký ghi lại mọi thao tác của Ban Quản Lý — phê duyệt, cộng/trừ tài sản, sửa vật phẩm, xóa giao dịch, cấp lượt quay, v.v. Các thao tác có thể khôi phục sẽ hiển thị nút khôi phục.
            </p>
          </div>
          {undoMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${undoMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {undoMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {undoMsg}
            </div>
          )}
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có ghi chép nào.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
              {auditLogs.map(log => (
                <div key={log.id} className={`p-3 rounded-lg bg-black/20 border ${log.action === 'undo_action' ? 'border-blue-500/15' : 'border-white/5'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 break-words">
                        <span className="text-amber-300/80 font-semibold">{log.admin_email || adminName(log.admin_id)}</span>
                        <span className="text-gray-500"> · </span>
                        <span className={`text-gray-400 ${log.action === 'undo_action' ? 'italic text-blue-300/70' : ''}`}>{log.action}</span>
                      </p>
                      {log.target_description && (
                        <p className="text-xs text-gray-400 mt-1 break-words">{log.target_description}</p>
                      )}
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                        {log.target_user_id && <span className="font-mono"> · Mục tiêu: {log.target_user_id.slice(0, 8)}</span>}
                      </p>
                    </div>
                    {UNDOABLE_ACTIONS.has(log.action) && (
                      <button
                        onClick={() => handleUndoAction(log.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold transition-all flex-shrink-0"
                        title="Khôi phục thao tác này"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Cổng Đăng Ký</h3>
            <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-black/20 border border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                {registrationOpen ? (
                  <Unlock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-100/90">
                    {registrationOpen ? 'Cổng đăng ký đang mở' : 'Cổng đăng ký đang khóa'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {registrationOpen
                      ? 'Người chơi mới có thể gửi hồ sơ đăng ký.'
                      : 'Trang đăng ký hiển thị thông báo khóa, không cho phép gửi hồ sơ.'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleRegistration}
                className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                  registrationOpen
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {registrationOpen ? 'Khóa' : 'Mở'}
              </button>
            </div>
            {regMsg && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${regMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                {regMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {regMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wills Tab */}
      {activeTab === 'wills' && (
        <div className="space-y-6">
          {willMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${willMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {willMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {willMsg}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'revision_requested', 'rejected'] as const).map(st => (
              <button key={st} onClick={() => setWillFilter(st)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${willFilter === st ? 'bg-[#670201]/30 text-amber-100' : 'bg-black/20 text-gray-400 hover:text-amber-100 hover:bg-white/5'}`}>
                {st === 'all' ? 'Tất cả' : st === 'pending' ? 'Chờ duyệt' : st === 'approved' ? 'Đã duyệt' : st === 'revision_requested' ? 'Yêu cầu sửa' : 'Từ chối'}
                {st !== 'all' && wills.filter(w => w.status === st).length > 0 && <span className="ml-1.5 opacity-70">({wills.filter(w => w.status === st).length})</span>}
              </button>
            ))}
          </div>
          {wills.filter(w => willFilter === 'all' || w.status === willFilter).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Không có Di Chúc nào.</p>
          ) : (
            <div className="space-y-3">
              {wills.filter(w => willFilter === 'all' || w.status === willFilter).map(will => {
                const isExpanded = expandedWillIds.has(will.id);
                const stCfg: Record<WillStatus, { label: string; cls: string }> = {
                  pending: { label: 'Chờ duyệt', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
                  approved: { label: 'Đã duyệt', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
                  revision_requested: { label: 'Yêu cầu sửa', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
                  rejected: { label: 'Từ chối', cls: 'bg-red-500/15 text-red-300 border-red-500/25' },
                };
                const cfg = stCfg[will.status];
                return (
                  <div key={will.id} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                    <button
                      onClick={() => setExpandedWillIds(prev => { const n = new Set(prev); if (n.has(will.id)) n.delete(will.id); else n.add(will.id); return n; })}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#670201]/30">
                        <FileSignature className="h-5 w-5 text-amber-300/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-amber-100/90">{will.author_oc_name || 'Ẩn danh'} → {will.heir_name || '?'}</p>
                        <p className="text-xs text-gray-500">{new Date(will.created_at).toLocaleDateString('vi-VN')} · {will.inheritance_type === 'ALL' ? 'Toàn bộ Balo' : 'Chỉ định cụ thể'}</p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-500" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-white/5 p-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Người thừa kế</p><p className="text-sm text-gray-200">{will.heir_name}{will.heir_oc_name && <span className="text-gray-500"> ({will.heir_oc_name})</span>}</p></div>
                          <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Mối quan hệ</p><p className="text-sm text-gray-200">{will.heir_relationship || '—'}</p></div>
                          <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Hình thức</p><p className="text-sm text-gray-200">{will.inheritance_type === 'ALL' ? 'Toàn bộ vật phẩm trong Balo' : 'Chỉ định từng vật phẩm'}</p></div>
                          {will.will_code && <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Mã Di Chúc</p><p className="font-mono text-sm font-bold text-amber-200">{will.will_code}</p></div>}
                          {will.reviewer_name && <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Người xét duyệt</p><p className="text-sm text-gray-200">{will.reviewer_name}</p></div>}
                          {will.reviewed_at && <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Ngày duyệt</p><p className="text-sm text-gray-200">{new Date(will.reviewed_at).toLocaleDateString('vi-VN')}</p></div>}
                        </div>
                        {will.item_list && (
                          <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Danh sách vật phẩm</p><p className="whitespace-pre-wrap text-sm leading-6 text-gray-300 mt-1">{will.item_list}</p></div>
                        )}
                        {will.heir_assignments && (
                          <div><p className="text-[10px] uppercase tracking-wider text-gray-500">Phân chia nhiều người</p><p className="whitespace-pre-wrap text-sm leading-6 text-gray-300 mt-1">{will.heir_assignments}</p></div>
                        )}
                        {will.admin_note && (
                          <div className="rounded-lg border border-[#670201]/20 bg-[#670201]/10 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Ghi chú Hệ Thống</p><p className="text-sm text-gray-300 mt-1">{will.admin_note}</p></div>
                        )}
                        {will.status === 'pending' && (
                          <div className="space-y-3 border-t border-white/5 pt-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Ghi chú cho người chơi (tùy chọn)</label>
                              <textarea value={willNoteDraft[will.id] || ''} onChange={e => setWillNoteDraft(prev => ({ ...prev, [will.id]: e.target.value }))} rows={2} placeholder="Ghi chú yêu cầu chỉnh sửa hoặc lý do từ chối..." className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 resize-none" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleReviewWill(will.id, 'approved')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all"><Check className="w-3.5 h-3.5" /> Phê duyệt</button>
                              <button onClick={() => handleReviewWill(will.id, 'revision_requested')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold transition-all"><Edit3 className="w-3.5 h-3.5" /> Yêu cầu sửa</button>
                              <button onClick={() => handleReviewWill(will.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all"><X className="w-3.5 h-3.5" /> Từ chối</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Generic Confirm Dialog */}
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        details={confirmState?.details}
        onConfirm={async () => {
          if (confirmState) await confirmState.action();
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
