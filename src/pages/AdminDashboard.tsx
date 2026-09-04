import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile, ShopItem, SitePage, Transaction, InventoryItem, CURRENCY_LABELS, WantedNotice, KimBangEntry, AuditLog, PasswordHistoryEntry, WheelSpinLog, Will, WillStatus, BachHoaEntry, BachHoaVote, Organization, OrganizationMember, Title, UserTitle, TITLE_COLORS } from '@/lib/supabase';
import {
  Shield, Users, Coins, Store, BookOpen, Ghost, Check, X, Plus, Trash2,
  AlertCircle, CheckCircle2, History, Edit3, Eye, EyeOff, Dices, Package,
  Heart, Sparkle, Brain, Lock, Unlock, FileWarning, Crown, Save, ScrollText,
  Undo2, RotateCcw, Search, UserSearch, ArrowLeft, ChevronDown, ChevronUp, FileSignature, Info,
  Download, FileDown, Loader2, Archive, Settings, Clock, Building2, UserCog, Megaphone, Send, Award, Tag,
  Zap,
} from 'lucide-react';
import { LotusIcon } from '@/components/LotusIcon';
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

type Tab = 'accounts' | 'archive' | 'shop' | 'pages' | 'wanted' | 'kimbang' | 'bachhoa' | 'audit' | 'lookup' | 'wills' | 'settings' | 'organizations' | 'broadcast' | 'titles';

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
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<Partial<SitePage>>({});
  const [archiveSubTab, setArchiveSubTab] = useState<'currency' | 'identities' | 'inventories' | 'wheel' | 'status'>('currency');

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
  const [showAddKimBang, setShowAddKimBang] = useState(false);
  const [newKimBang, setNewKimBang] = useState({ rank: 1, identity_name: '', wealth: '', quests_completed: 0, honor_title: '', avatar_url: '', epithet: '' });

  // Danh vọng editing
  const [editingDanhVongId, setEditingDanhVongId] = useState<string | null>(null);
  const [danhVongValue, setDanhVongValue] = useState('');

  // Password editing
  const [editingPwdId, setEditingPwdId] = useState<string | null>(null);
  const [pwdValue, setPwdValue] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
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

  // Bach Hoa Trieu Phung
  const [bachHoaEntries, setBachHoaEntries] = useState<BachHoaEntry[]>([]);
  const [bachHoaMsg, setBachHoaMsg] = useState('');
  const [showAddBachHoa, setShowAddBachHoa] = useState(false);
  const [newBachHoa, setNewBachHoa] = useState({ identity_name: '', quote: '', avatar_url: '', title: '' });
  const [bachHoaVotes, setBachHoaVotes] = useState<Record<string, BachHoaVote[]>>({});
  const [expandedBachHoaVoters, setExpandedBachHoaVoters] = useState<Set<string>>(new Set());
  const [bachHoaVoterLoading, setBachHoaVoterLoading] = useState(false);
  const [bachHoaEditing, setBachHoaEditing] = useState<Record<string, { identity_name: string; quote: string; avatar_url: string; title: string }>>({});
  const [bachHoaSaving, setBachHoaSaving] = useState<string | null>(null);

  // Organizations
  const [organizations, setOrganizations] = useState<(Organization & { leader?: { oc_name: string } | null })[]>([]);
  const [orgMembers, setOrgMembers] = useState<Record<string, OrganizationMember[]>>({});
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', category: 'Tổ Chức', description: '' });
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrg, setEditOrg] = useState<Partial<Organization>>({});
  const [orgMsg, setOrgMsg] = useState('');
  const [expandedOrgIds, setExpandedOrgIds] = useState<Set<string>>(new Set());
  const [addMemberOrgId, setAddMemberOrgId] = useState<string | null>(null);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Thành viên');
  const [newOrgMembers, setNewOrgMembers] = useState<{ user_id: string; role: string; oc_name: string }[]>([]);

  // Broadcast & bulk grant
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [bulkCurrencyType, setBulkCurrencyType] = useState('HUA_TIEN');
  const [bulkAmount, setBulkAmount] = useState(0);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');

  // Titles (Bộ Sưu Tầm)
  const [titles, setTitles] = useState<Title[]>([]);
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [newTitle, setNewTitle] = useState({ name: '', description: '', color: 'amber' });
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<Partial<Title>>({});
  const [titleMsg, setTitleMsg] = useState('');
  const [expandedTitleUserIds, setExpandedTitleUserIds] = useState<Set<string>>(new Set());
  const [userTitlesMap, setUserTitlesMap] = useState<Record<string, UserTitle[]>>({});
  const [assignTitleUserId, setAssignTitleUserId] = useState<string | null>(null);
  const [assignTitleId, setAssignTitleId] = useState('');

  // Registration review
  const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
  const [reviewMsg, setReviewMsg] = useState('');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [allSkills, setAllSkills] = useState<Record<string, unknown[]>>({});
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editSkillDraft, setEditSkillDraft] = useState<Record<string, unknown>>({});

  // Backup / export
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

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
    setPwdMsg('');
    if (!pwdValue || pwdValue.length < 6) {
      setPwdMsg('Lỗi: Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    const targetUser = allProfiles.find(p => p.id === userId);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      setPwdMsg('Lỗi: Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ user_id: userId, new_password: pwdValue, admin_id: profile?.id }),
    });
    if (!response.ok) {
      let errMsg = `Lỗi ${response.status}`;
      try {
        const errBody = await response.json();
        errMsg = errBody.error || errMsg;
      } catch { /* non-JSON error body */ }
      setPwdMsg(`Lỗi: ${errMsg}`);
      return;
    }
    const result = await response.json();
    if (result.error) {
      setPwdMsg(`Lỗi: ${result.error}`);
      return;
    }
    logAction('update_password', userId, `Đổi mật khẩu cho ${targetUser?.oc_name || userId.slice(0, 8)}`);
    setEditingPwdId(null);
    setPwdValue('');
    setPwdMsg(`Đã đổi mật khẩu cho ${targetUser?.oc_name || userId.slice(0, 8)} thành công. Mật khẩu mới có hiệu lực ngay lập tức.`);
    setTimeout(() => setPwdMsg(''), 4000);
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

  const handleDisableUser = (userId: string) => {
    const targetUser = allProfiles.find(p => p.id === userId);
    const name = targetUser?.oc_name || userId.slice(0, 8);
    const email = targetUser?.email || '';
    requireConfirm(
      'Vô Hiệu Hóa Tài Khoản',
      `Bạn sắp vô hiệu hóa tài khoản "${name}". Người chơi sẽ không thể đăng nhập nữa và sẽ thấy thông báo "tài khoản vô hiệu". Hành động này có thể khôi phục bằng nút "Mở Khóa" sau khi vô hiệu hóa.`,
      async () => {
        const { error } = await supabase.rpc('admin_disable_user', { p_user_id: userId });
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        logAction('disable_user', userId, `Vô hiệu hóa tài khoản ${name} (${email})`, { user_id: userId });
        alert(`Đã vô hiệu hóa tài khoản "${name}". Người chơi sẽ không thể đăng nhập.`);
        fetchAllData();
      },
      [
        { label: 'Người chơi', value: name },
        { label: 'Email', value: email },
      ],
      'Vô hiệu hóa',
    );
  };

  const handleEnableUser = async (userId: string) => {
    const targetUser = allProfiles.find(p => p.id === userId);
    const name = targetUser?.oc_name || userId.slice(0, 8);
    const { error } = await supabase.rpc('admin_enable_user', { p_user_id: userId });
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('enable_user', userId, `Mở khóa tài khoản ${name}`, { user_id: userId });
    fetchAllData();
  };

  const fetchAllData = useCallback(async () => {
    const [pending, approved, all, items, pages, txs, inv, settings, pendingWanted, activeWanted, kimBang, audit, spins, willData, bachHoaData, orgData, orgMemData, titlesData] = await Promise.all([
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
      supabase.from('bach_hoa_entries').select('*').order('vote_count', { ascending: false }),
      supabase.from('organizations').select('*, leader:profiles!organizations_leader_id_fkey(oc_name)').order('created_at', { ascending: false }),
      supabase.from('organization_members').select('*, profiles(oc_name)').order('created_at', { ascending: true }),
      supabase.from('titles').select('*').order('created_at', { ascending: false }),
    ]);
    if (titlesData?.data) setTitles(titlesData.data as Title[]);
    if (willData?.data) setWills(willData.data as Will[]);
    if (bachHoaData?.data) setBachHoaEntries(bachHoaData.data as BachHoaEntry[]);
    if (orgData?.data) setOrganizations(orgData.data as (Organization & { leader?: { oc_name: string } | null })[]);
    if (orgMemData?.data) {
      const memMap: Record<string, OrganizationMember[]> = {};
      (orgMemData.data as OrganizationMember[]).forEach(m => {
        if (!memMap[m.organization_id]) memMap[m.organization_id] = [];
        memMap[m.organization_id].push(m);
      });
      setOrgMembers(memMap);
    }
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
    const feedback = reviewFeedback[userId]?.trim();
    requireConfirm(
      'Từ Chối Tài Khoản',
      `Bạn sắp từ chối và xóa vĩnh viễn tài khoản "${name}". Hành động này không thể hoàn tác.`,
      async () => {
        if (feedback) {
          await supabase.from('registration_reviews').insert({
            user_id: userId, admin_id: profile?.id, status: 'rejected', feedback,
          });
        }
        await supabase.from('profiles').delete().eq('id', userId);
        logAction('reject_user', userId, `Từ chối và xóa ${name}` + (feedback ? ` — Phản hồi: ${feedback}` : ''));
        setReviewFeedback(prev => { const n = { ...prev }; delete n[userId]; return n; });
        setReviewMsg('');
        fetchAllData();
      },
      [
        { label: 'Người chơi', value: name },
        ...(feedback ? [{ label: 'Phản hồi', value: feedback }] : []),
      ],
      'Xóa tài khoản',
    );
  };

  const handleRequestEdit = async (userId: string) => {
    const feedback = reviewFeedback[userId]?.trim();
    if (!feedback) { setReviewMsg('Vui lòng nhập phản hồi cho người chơi.'); return; }
    const targetUser = pendingProfiles.find(p => p.id === userId);
    const name = targetUser?.oc_name || userId.slice(0, 8);
    const { error: revError } = await supabase.from('registration_reviews').insert({
      user_id: userId, admin_id: profile?.id, status: 'request_edit', feedback,
    });
    if (revError) { setReviewMsg(`Lỗi: ${revError.message}`); return; }
    const { error: profError } = await supabase.from('profiles').update({
      review_status: 'request_edit', review_feedback: feedback,
    }).eq('id', userId);
    if (profError) { setReviewMsg(`Lỗi: ${profError.message}`); return; }
    await supabase.from('notifications').insert({
      recipient_id: userId, type: 'review_request_edit',
      title: 'Yêu cầu sửa hồ sơ',
      body: `Quản trị viên yêu cầu chỉnh sửa hồ sơ của bạn: ${feedback}`,
    });
    logAction('request_edit_user', userId, `Yêu cầu sửa hồ sơ ${name} — ${feedback}`);
    setReviewFeedback(prev => { const n = { ...prev }; delete n[userId]; return n; });
    setReviewMsg(`Đã gửi yêu cầu sửa hồ sơ đến ${name}.`);
    setTimeout(() => setReviewMsg(''), 4000);
    fetchAllData();
  };

  const handleApproveWithFeedback = async (userId: string) => {
    const feedback = reviewFeedback[userId]?.trim();
    const targetUser = pendingProfiles.find(p => p.id === userId);
    const name = targetUser?.oc_name || userId.slice(0, 8);
    const { error } = await supabase.rpc('admin_approve_user', {
      p_user_id: userId, p_admin_id: profile?.id,
    });
    if (error) { setReviewMsg(`Lỗi phê duyệt: ${error.message}`); return; }
    if (feedback) {
      await supabase.from('registration_reviews').insert({
        user_id: userId, admin_id: profile?.id, status: 'approved', feedback,
      });
      await supabase.from('profiles').update({ review_feedback: feedback }).eq('id', userId);
      await supabase.from('notifications').insert({
        recipient_id: userId, type: 'review_approved',
        title: 'Hồ sơ đã được phê duyệt',
        body: `Hồ sơ của bạn đã được phê duyệt! ${feedback}`,
      });
    }
    logAction('approve_user', userId, `Phê duyệt ${name}` + (feedback ? ` — Phản hồi: ${feedback}` : ''));
    setReviewFeedback(prev => { const n = { ...prev }; delete n[userId]; return n; });
    setReviewMsg('');
    fetchAllData();
  };

  const fetchSkillsForUser = async (userId: string) => {
    if (allSkills[userId]) return;
    const { data } = await supabase.from('character_skills').select('*').eq('user_id', userId).order('slot', { ascending: true });
    setAllSkills(prev => ({ ...prev, [userId]: data || [] }));
  };

  const handleSaveSkill = async (skillId: string) => {
    const { error } = await supabase.from('character_skills').update(editSkillDraft).eq('id', skillId);
    if (error) { setReviewMsg(`Lỗi: ${error.message}`); return; }
    setEditingSkillId(null);
    setEditSkillDraft({});
    setAllSkills({});
    fetchAllData();
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Xóa kỹ năng này?')) return;
    const { error } = await supabase.from('character_skills').delete().eq('id', skillId);
    if (error) { setReviewMsg(`Lỗi: ${error.message}`); return; }
    setAllSkills({});
    fetchAllData();
  };

  const handleAddSkill = async (userId: string) => {
    const existing = allSkills[userId] || [];
    const nextSlot = existing.length + 1;
    if (nextSlot > 4) { setReviewMsg('Đã đủ 4 kỹ năng.'); return; }
    const { error } = await supabase.from('character_skills').insert({
      user_id: userId, slot: nextSlot, name: 'Kỹ năng mới',
    });
    if (error) { setReviewMsg(`Lỗi: ${error.message}`); return; }
    setAllSkills({});
    fetchSkillsForUser(userId);
    fetchAllData();
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
      `Bạn sắp thu hồi "${itemName}" khỏi kho của ${playerName}. Vật phẩm sẽ bị xóa khỏi kho, nhưng lịch sử giao dịch mua vật phẩm này vẫn được giữ nguyên.`,
      async () => {
        const { data, error } = await supabase.rpc('admin_revoke_inventory_item', {
          p_inv_id: invId,
        });
        if (error) { alert(`Lỗi: ${error.message}`); return; }
        const loggedName = data?.item_name || itemName;
        logAction('revoke_inventory_item', inv?.user_id || data?.user_id, `Thu hồi "${loggedName}" khỏi kho ${playerName}`.trim(), { inv_id: invId, item_name: loggedName });
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

  const handleEditPage = (page: SitePage) => {
    setEditingPageId(page.id);
    setEditPage({ ...page });
  };

  const handleSaveEditPage = async (pageId: string) => {
    const oldPage = sitePages.find(p => p.id === pageId);
    const { error } = await supabase.from('site_pages').update({
      page_number: editPage.page_number,
      title: editPage.title,
      category: editPage.category,
      content: editPage.content,
    }).eq('id', pageId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('edit_page', undefined, `Sửa trang bách khoa "${editPage.title}"`, { page_id: pageId, changes: editPage, previous_values: oldPage });
    setEditingPageId(null);
    setEditPage({});
    fetchAllData();
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

  const handleAddKimBang = async () => {
    setKimBangMsg('');
    if (!newKimBang.identity_name.trim()) {
      setKimBangMsg('Lỗi: Vui lòng nhập danh tính.');
      return;
    }
    const { error } = await supabase.from('kim_bang').insert([{
      rank: newKimBang.rank,
      identity_name: newKimBang.identity_name.trim(),
      wealth: newKimBang.wealth.trim(),
      quests_completed: newKimBang.quests_completed,
      honor_title: newKimBang.honor_title.trim(),
      avatar_url: newKimBang.avatar_url.trim(),
      epithet: newKimBang.epithet.trim(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) { setKimBangMsg(`Lỗi: ${error.message}`); return; }
    logAction('add_kim_bang', undefined, `Thêm hạng mục Kim Bảng hạng ${newKimBang.rank} — ${newKimBang.identity_name.trim()}`, { rank: newKimBang.rank, identity_name: newKimBang.identity_name.trim() });
    setNewKimBang({ rank: 1, identity_name: '', wealth: '', quests_completed: 0, honor_title: '', avatar_url: '', epithet: '' });
    setShowAddKimBang(false);
    setKimBangMsg('Đã thêm hạng mục Kim Bảng thành công.');
    setTimeout(() => setKimBangMsg(''), 4000);
    fetchAllData();
  };

  const handleDeleteKimBang = (id: string) => {
    const entry = kimBangEntries.find(e => e.id === id);
    const rankLabel = entry ? ['', 'Đệ Nhất', 'Đệ Nhị', 'Đệ Tam', 'Đệ Tứ', 'Đệ Ngũ', 'Đệ Lục'][entry.rank] || `Hạng ${entry.rank}` : `Hạng`;
    const name = entry?.identity_name || '';
    requireConfirm(
      'Xóa Hạng Mục Kim Bảng',
      `Bạn sắp xóa hạng mục "${rankLabel}"${name ? ` (${name})` : ''} khỏi Kim Bảng. Hành động này không thể hoàn tác.`,
      async () => {
        const { error } = await supabase.from('kim_bang').delete().eq('id', id);
        if (error) { setKimBangMsg(`Lỗi: ${error.message}`); return; }
        logAction('delete_kim_bang', undefined, `Xóa hạng mục Kim Bảng ${rankLabel}${name ? ` (${name})` : ''}`, { kim_bang_id: id, rank: entry?.rank, identity_name: name });
        setKimBangMsg('Đã xóa hạng mục Kim Bảng.');
        setTimeout(() => setKimBangMsg(''), 4000);
        fetchAllData();
      },
      [
        { label: 'Hạng', value: rankLabel },
        { label: 'Danh tính', value: name || '—' },
      ],
      'Xóa hạng mục',
    );
  };

  const handleAddBachHoa = async () => {
    setBachHoaMsg('');
    if (!newBachHoa.identity_name.trim()) {
      setBachHoaMsg('Lỗi: Vui lòng nhập danh tính.');
      return;
    }
    const { error } = await supabase.rpc('admin_create_bach_hoa_entry', {
      p_identity_name: newBachHoa.identity_name.trim(),
      p_quote: newBachHoa.quote.trim(),
      p_avatar_url: newBachHoa.avatar_url.trim(),
      p_title: newBachHoa.title.trim(),
    });
    if (error) { setBachHoaMsg(`Lỗi: ${error.message}`); return; }
    logAction('add_bach_hoa_entry', undefined, `Thêm ứng viên Bách Hoa "${newBachHoa.identity_name.trim()}"`, { identity_name: newBachHoa.identity_name.trim() });
    setNewBachHoa({ identity_name: '', quote: '', avatar_url: '', title: '' });
    setShowAddBachHoa(false);
    setBachHoaMsg('Đã thêm ứng viên thành công.');
    setTimeout(() => setBachHoaMsg(''), 4000);
    fetchAllData();
  };

  const handleSaveBachHoa = async (id: string) => {
    setBachHoaMsg('');
    setBachHoaSaving(id);
    const draft = bachHoaEditing[id];
    if (!draft) { setBachHoaSaving(null); return; }
    if (!draft.identity_name.trim()) {
      setBachHoaMsg('Lỗi: Danh tính không được để trống.');
      setBachHoaSaving(null);
      return;
    }
    const oldEntry = bachHoaEntries.find(e => e.id === id);
    const { error } = await supabase.rpc('admin_update_bach_hoa_entry', {
      p_entry_id: id,
      p_identity_name: draft.identity_name.trim(),
      p_quote: draft.quote.trim(),
      p_avatar_url: draft.avatar_url.trim(),
      p_title: draft.title.trim(),
    });
    if (error) { setBachHoaMsg(`Lỗi: ${error.message}`); setBachHoaSaving(null); return; }
    logAction('update_bach_hoa_entry', undefined, `Sửa Bách Hoa "${oldEntry?.identity_name || id.slice(0, 8)}"`, {
      entry_id: id,
      previous_values: { identity_name: oldEntry?.identity_name, quote: oldEntry?.quote, avatar_url: oldEntry?.avatar_url, title: oldEntry?.title },
      new_values: { identity_name: draft.identity_name.trim(), quote: draft.quote.trim(), avatar_url: draft.avatar_url.trim(), title: draft.title.trim() },
    });
    setBachHoaEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setBachHoaMsg('Đã lưu thay đổi thành công.');
    setTimeout(() => setBachHoaMsg(''), 3000);
    setBachHoaSaving(null);
    fetchAllData();
  };

  const handleCancelEditBachHoa = (id: string) => {
    setBachHoaEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleStartEditBachHoa = (entry: BachHoaEntry) => {
    setBachHoaEditing(prev => ({
      ...prev,
      [entry.id]: { identity_name: entry.identity_name, quote: entry.quote, avatar_url: entry.avatar_url, title: entry.title || '' },
    }));
  };

  const handleDeleteBachHoa = (id: string) => {
    const entry = bachHoaEntries.find(e => e.id === id);
    const name = entry?.identity_name || '';
    const voteCount = entry?.vote_count || 0;
    // First confirmation
    requireConfirm(
      'Xác Nhận Xóa Ứng Viên (Bước 1/2)',
      `Bạn đang yêu cầu xóa ứng viên "${name}" khỏi Bách Hoa Triều Phụng. Tất cả ${voteCount} phiếu bình chọn sẽ bị xóa vĩnh viễn. Đây là bước xác nhận đầu tiên.`,
      () => {
        // Second confirmation
        requireConfirm(
          'Xác Nhận Lại (Bước 2/2) — Không Thể Hoàn Tác',
          `BẠN CÓ CHẮC CHẮN muốn xóa "${name}"? Hành động này KHÔNG THỂ HOÀN TÁC. Mọi dữ liệu bình chọn sẽ mất vĩnh viễn.`,
          async () => {
            const { error } = await supabase.rpc('admin_delete_bach_hoa_entry', { p_entry_id: id });
            if (error) { setBachHoaMsg(`Lỗi: ${error.message}`); return; }
            logAction('delete_bach_hoa_entry', undefined, `Xóa ứng viên Bách Hoa "${name}"`, { entry_id: id, identity_name: name, deleted_vote_count: voteCount });
            setBachHoaMsg('Đã xóa ứng viên thành công.');
            setTimeout(() => setBachHoaMsg(''), 4000);
            fetchAllData();
          },
          [
            { label: 'Ứng viên', value: name || '—' },
            { label: 'Số phiếu sẽ xóa', value: String(voteCount) },
          ],
          'Xóa vĩnh viễn',
        );
      },
      [{ label: 'Ứng viên', value: name || '—' }],
      'Tiếp tục xóa',
    );
  };

  const fetchBachHoaVotes = useCallback(async () => {
    setBachHoaVoterLoading(true);
    const { data, error } = await supabase
      .from('bach_hoa_votes')
      .select('id, entry_id, user_id, created_at, profiles(oc_name, anonymous_name)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Lỗi tải lượt bình chọn Bách Hoa:', error.message);
    } else if (data) {
      const grouped: Record<string, BachHoaVote[]> = {};
      for (const v of data as BachHoaVote[]) {
        if (!grouped[v.entry_id]) grouped[v.entry_id] = [];
        grouped[v.entry_id].push(v);
      }
      setBachHoaVotes(grouped);
    }
    setBachHoaVoterLoading(false);
  }, []);

  const toggleBachHoaVoters = (entryId: string) => {
    setExpandedBachHoaVoters(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  // Realtime: bach_hoa_votes — live voter updates in admin
  useEffect(() => {
    if (activeTab !== 'bachhoa') return;
    fetchBachHoaVotes();
    const channel = supabase
      .channel('admin_bach_hoa_votes_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bach_hoa_votes' }, async (payload) => {
        const newVote = payload.new as { id: string; entry_id: string; user_id: string; created_at: string };
        const { data: profileData } = await supabase
          .from('profiles')
          .select('oc_name, anonymous_name')
          .eq('id', newVote.user_id)
          .maybeSingle();
        const vote: BachHoaVote = {
          ...newVote,
          profiles: profileData as { oc_name: string | null; anonymous_name: string | null } | null,
        };
        setBachHoaVotes(prev => {
          const list = prev[newVote.entry_id] || [];
          if (list.some(v => v.id === newVote.id)) return prev;
          return { ...prev, [newVote.entry_id]: [vote, ...list] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bach_hoa_votes' }, (payload) => {
        const oldId = payload.old?.id;
        if (!oldId) return;
        setBachHoaVotes(prev => {
          const next: Record<string, BachHoaVote[]> = {};
          for (const [eid, list] of Object.entries(prev)) {
            next[eid] = list.filter(v => v.id !== oldId);
          }
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTab, fetchBachHoaVotes]);

  const PAGE_SIZE = 1000;
  type PagedResult = { data: unknown[] | null; error: string | null };
  const fetchAllPaged = async (table: string, select: string, orderBy: string, ascending = false): Promise<PagedResult> => {
    const all: unknown[] = [];
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy, { ascending })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) return { data: null, error: error.message };
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    return { data: all, error: null };
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    setExporting(true);
    setExportMsg('');
    try {
      const [profiles, transactions, inventories, wheelSpins, messages, friendships, posts, postComments, wills, notifications, auditLogs, passwordHistory, wantedNotices, carts, kimBang, shopItems, sitePages, bachQuyAm, wheelRewardStock, siteSettings] = await Promise.all([
        fetchAllPaged('profiles', '*', 'created_at'),
        fetchAllPaged('transactions', '*, profiles(oc_name, email)', 'created_at'),
        fetchAllPaged('inventories', '*, shop_items(name, category), profiles(oc_name)', 'acquired_at'),
        fetchAllPaged('wheel_spin_log', '*', 'created_at'),
        fetchAllPaged('messages', '*, sender:profiles!messages_sender_id_fkey(oc_name), receiver:profiles!messages_receiver_id_fkey(oc_name)', 'created_at'),
        fetchAllPaged('friendships', '*, requester:profiles!friendships_requester_id_fkey(oc_name), addressee:profiles!friendships_addressee_id_fkey(oc_name)', 'created_at'),
        fetchAllPaged('posts', '*, author:profiles!posts_author_id_fkey(oc_name)', 'created_at'),
        fetchAllPaged('post_comments', '*, post:posts(title), author:profiles!post_comments_author_id_fkey(oc_name)', 'created_at'),
        fetchAllPaged('wills', '*', 'created_at'),
        fetchAllPaged('notifications', '*', 'created_at'),
        fetchAllPaged('admin_audit_log', '*', 'created_at'),
        fetchAllPaged('password_history', '*, profiles(oc_name)', 'created_at'),
        fetchAllPaged('wanted_notices', '*', 'created_at'),
        fetchAllPaged('carts', '*, profiles(oc_name), shop_items(name)', 'created_at'),
        fetchAllPaged('kim_bang', '*', 'rank', true),
        fetchAllPaged('shop_items', '*', 'price', true),
        fetchAllPaged('site_pages', '*', 'page_number', true),
        fetchAllPaged('bach_quy_am', '*', 'display_order', true),
        fetchAllPaged('wheel_reward_stock', '*', 'created_at', true),
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      ]);

      const pagedResults = [profiles, transactions, inventories, wheelSpins, messages, friendships, posts, postComments, wills, notifications, auditLogs, passwordHistory, wantedNotices, carts, kimBang, shopItems, sitePages, bachQuyAm, wheelRewardStock];
      const pagedError = pagedResults.find(r => r.error);
      if (pagedError) {
        setExportMsg(`Lỗi: ${pagedError.error}`);
        setExporting(false);
        return;
      }
      if (siteSettings.error) {
        setExportMsg(`Lỗi: ${siteSettings.error.message}`);
        setExporting(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setExportMsg('Lỗi: Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        setExporting(false);
        return;
      }

      const authResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-auth`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      const authBody = await authResponse.json() as { auth_accounts?: unknown; error?: string };
      if (!authResponse.ok || !Array.isArray(authBody.auth_accounts)) {
        setExportMsg(`Lỗi: ${authBody.error || 'Không thể sao lưu tài khoản đăng nhập.'}`);
        setExporting(false);
        return;
      }

      const exportData = {
        exported_at: new Date().toISOString(),
        exported_by: profile?.oc_name || 'unknown',
        auth_accounts: authBody.auth_accounts,
        profiles: profiles.data,
        transactions: transactions.data,
        inventories: inventories.data,
        wheel_spin_log: wheelSpins.data,
        messages: messages.data,
        friendships: friendships.data,
        posts: posts.data,
        post_comments: postComments.data,
        wills: wills.data,
        notifications: notifications.data,
        admin_audit_log: auditLogs.data,
        password_history: passwordHistory.data,
        wanted_notices: wantedNotices.data,
        carts: carts.data,
        kim_bang: kimBang.data,
        shop_items: shopItems.data,
        site_pages: sitePages.data,
        bach_quy_am: bachQuyAm.data,
        wheel_reward_stock: wheelRewardStock.data,
        site_settings: siteSettings.data,
      };

      const dateStr = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trung-hoan-backup-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const rows = (profiles.data || []) as Record<string, unknown>[];
        const headers = ['oc_name', 'email', 'gender', 'hua_tien', 'cong_duc', 'am_duc', 'danh_vong', 'is_approved', 'anonymous_name', 'wheel_spins', 'wheel_total_spins', 'status_physical', 'status_spiritual', 'status_mental', 'created_at', 'approved_at', 'approved_by'];
        const csvLines = [headers.join(',')];
        for (const row of rows) {
          const vals = headers.map(h => {
            const v = row[h];
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
          });
          csvLines.push(vals.join(','));
        }
        const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trung-hoan-players-${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      logAction('export_data', undefined, `Sao lưu dữ liệu (${format.toUpperCase()})`);
      setExportMsg(`Đã tải xuống file ${format.toUpperCase()} thành công.`);
      setTimeout(() => setExportMsg(''), 4000);
    } catch (err) {
      setExportMsg(`Lỗi: ${err instanceof Error ? err.message : 'Không xác định'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingleTable = async (
    label: string,
    table: string,
    select: string,
    orderBy: string,
    ascending = false,
    filename: string,
  ) => {
    setExporting(true);
    setExportMsg('');
    try {
      const result = await fetchAllPaged(table, select, orderBy, ascending);
      if (result.error) {
        setExportMsg(`Lỗi: ${result.error}`);
        return;
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      const exportData = {
        exported_at: new Date().toISOString(),
        exported_by: profile?.oc_name || 'unknown',
        table,
        row_count: (result.data || []).length,
        data: result.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      logAction('export_data', undefined, `Sao lưu ${label} (${(result.data || []).length} dòng)`);
      setExportMsg(`Đã tải xuống file ${label} thành công (${(result.data || []).length} dòng).`);
      setTimeout(() => setExportMsg(''), 4000);
    } catch (err) {
      setExportMsg(`Lỗi: ${err instanceof Error ? err.message : 'Không xác định'}`);
    } finally {
      setExporting(false);
    }
  };

  const SINGLE_TABLE_CONFIG: { label: string; table: string; select: string; orderBy: string; ascending?: boolean; filename: string }[] = [
    { label: 'Hồ sơ người chơi', table: 'profiles', select: '*', orderBy: 'created_at', filename: 'ho-so-nguoi-choi' },
    { label: 'Lịch sử giao dịch', table: 'transactions', select: '*, profiles(oc_name, email)', orderBy: 'created_at', filename: 'giao-dich' },
    { label: 'Kho vật phẩm', table: 'inventories', select: '*, shop_items(name, category), profiles(oc_name)', orderBy: 'acquired_at', filename: 'kho-vat-pham' },
    { label: 'Lịch sử quay Bách Pháp Mệnh', table: 'wheel_spin_log', select: '*', orderBy: 'created_at', filename: 'bach-phap-menh-logs' },
    { label: 'Tin nhắn', table: 'messages', select: '*, sender:profiles!messages_sender_id_fkey(oc_name), receiver:profiles!messages_receiver_id_fkey(oc_name)', orderBy: 'created_at', filename: 'tin-nhan' },
    { label: 'Bạn bè', table: 'friendships', select: '*, requester:profiles!friendships_requester_id_fkey(oc_name), addressee:profiles!friendships_addressee_id_fkey(oc_name)', orderBy: 'created_at', filename: 'ban-be' },
    { label: 'Bài đăng diễn đàn', table: 'posts', select: '*, author:profiles!posts_author_id_fkey(oc_name)', orderBy: 'created_at', filename: 'bai-dang-dien-dan' },
    { label: 'Bình luận', table: 'post_comments', select: '*, post:posts(title), author:profiles!post_comments_author_id_fkey(oc_name)', orderBy: 'created_at', filename: 'binh-luan' },
    { label: 'Di chúc', table: 'wills', select: '*', orderBy: 'created_at', filename: 'di-chuc' },
    { label: 'Thông báo', table: 'notifications', select: '*', orderBy: 'created_at', filename: 'thong-bao' },
    { label: 'Nhật ký quản trị', table: 'admin_audit_log', select: '*', orderBy: 'created_at', filename: 'nhat-ky-quan-tri' },
    { label: 'Lịch sử mật khẩu', table: 'password_history', select: '*, profiles(oc_name)', orderBy: 'created_at', filename: 'lich-su-mat-khau' },
    { label: 'Lệnh truy nã', table: 'wanted_notices', select: '*', orderBy: 'created_at', filename: 'lenh-truy-na' },
    { label: 'Giỏ hàng', table: 'carts', select: '*, profiles(oc_name), shop_items(name)', orderBy: 'created_at', filename: 'gio-hang' },
    { label: 'Kim Bảng', table: 'kim_bang', select: '*', orderBy: 'rank', ascending: true, filename: 'kim-bang' },
    { label: 'Vật phẩm thương thành', table: 'shop_items', select: '*', orderBy: 'price', ascending: true, filename: 'vat-pham-thuong-trong' },
    { label: 'Trang bách khoa', table: 'site_pages', select: '*', orderBy: 'page_number', ascending: true, filename: 'trang-bach-khoa' },
    { label: 'Bách Quỷ Âm', table: 'bach_quy_am', select: '*', orderBy: 'display_order', ascending: true, filename: 'bach-quy-am' },
    { label: 'Kho phần thưởng vòng quay', table: 'wheel_reward_stock', select: '*', orderBy: 'created_at', ascending: true, filename: 'kho-phan-thuong-vong-quay' },
  ];

  const handleExportAllSeparate = async () => {
    setExporting(true);
    setExportMsg('');
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    try {
      for (const cfg of SINGLE_TABLE_CONFIG) {
        const result = await fetchAllPaged(cfg.table, cfg.select, cfg.orderBy, cfg.ascending ?? false);
        if (result.error) {
          failCount++;
          errors.push(`${cfg.label}: ${result.error}`);
          continue;
        }
        const dateStr = new Date().toISOString().slice(0, 10);
        const exportData = {
          exported_at: new Date().toISOString(),
          exported_by: profile?.oc_name || 'unknown',
          table: cfg.table,
          row_count: (result.data || []).length,
          data: result.data,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cfg.filename}-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        successCount++;
        await new Promise(r => setTimeout(r, 200));
      }
      logAction('export_data', undefined, `Sao lưu tất cả (${successCount} file riêng)`);
      if (failCount > 0) {
        setExportMsg(`Đã tải ${successCount} file. ${failCount} mục lỗi: ${errors.join('; ')}`);
      } else {
        setExportMsg(`Đã tải xuống ${successCount} file JSON thành công.`);
        setTimeout(() => setExportMsg(''), 5000);
      }
    } catch (err) {
      setExportMsg(`Lỗi: ${err instanceof Error ? err.message : 'Không xác định'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportBachKhoaPages = async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const result = await fetchAllPaged('site_pages', '*', 'page_number', true);
      if (result.error) {
        setExportMsg(`Lỗi: ${result.error}`);
        return;
      }
      const pages = (result.data || []) as { page_number: number; title: string; category: string; content: string }[];
      if (pages.length === 0) {
        setExportMsg('Không có trang bách khoa nào để tải.');
        return;
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      let count = 0;
      for (const page of pages) {
        const safeName = (page.title || `trang-${page.page_number}`)
          .toLowerCase()
          .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
          .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
          .replace(/[ìíịỉĩ]/g, 'i')
          .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
          .replace(/[ùúụủũưừứựửữ]/g, 'u')
          .replace(/[ỳýỵỷỹ]/g, 'y')
          .replace(/[đ]/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const exportData = {
          exported_at: new Date().toISOString(),
          exported_by: profile?.oc_name || 'unknown',
          page_number: page.page_number,
          title: page.title,
          category: page.category,
          content: page.content,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bach-khoa-${String(page.page_number).padStart(2, '0')}-${safeName}-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        count++;
        await new Promise(r => setTimeout(r, 150));
      }
      logAction('export_data', undefined, `Sao lưu ${count} trang bách khoa (mỗi trang 1 file)`);
      setExportMsg(`Đã tải xuống ${count} file trang bách khoa thành công.`);
      setTimeout(() => setExportMsg(''), 5000);
    } catch (err) {
      setExportMsg(`Lỗi: ${err instanceof Error ? err.message : 'Không xác định'}`);
    } finally {
      setExporting(false);
    }
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
    { id: 'shop', label: 'Thương Thành', icon: Store },
    { id: 'pages', label: 'Bách Khoa', icon: BookOpen },
    { id: 'wanted', label: 'Truy Nã', icon: FileWarning },
    { id: 'wills', label: 'Di Chúc', icon: FileSignature },
    { id: 'kimbang', label: 'Kim Bảng', icon: Crown },
    { id: 'bachhoa', label: 'Bách Hoa', icon: LotusIcon },
    { id: 'archive', label: 'Lưu Trữ Bản Cũ', icon: Archive },
    { id: 'organizations', label: 'Tổ Chức', icon: Building2 },
    { id: 'broadcast', label: 'Phát Thông Báo', icon: Megaphone },
    { id: 'titles', label: 'Danh Hiệu', icon: Award },
    { id: 'audit', label: 'Nhật Ký', icon: ScrollText },
    { id: 'settings', label: 'Cài Đặt & Sao Lưu', icon: Settings },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
  const labelCls = "block text-xs text-gray-400 mb-1.5 uppercase tracking-wider";
  const cardCls = "p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10";

  // Helper: find admin name by id
  const adminName = (id: string | null) => allProfiles.find(p => p.id === id)?.oc_name || (id ? id.slice(0, 8) : '—');

  // ===== Organization handlers =====
  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name.trim()) return;
    const { data, error } = await supabase.from('organizations').insert([{
      name: newOrg.name.trim(),
      category: newOrg.category,
      description: newOrg.description || null,
    }]).select('id').single();
    if (error) { setOrgMsg(`Lỗi: ${error.message}`); return; }
    const orgId = data.id;
    if (newOrgMembers.length > 0) {
      const memberRows = newOrgMembers.map(m => ({
        organization_id: orgId,
        user_id: m.user_id,
        role: m.role || 'Thành viên',
      }));
      const { error: memError } = await supabase.from('organization_members').insert(memberRows);
      if (memError) { setOrgMsg(`Tổ chức đã tạo, lỗi thêm thành viên: ${memError.message}`); }
    }
    logAction('add_organization', undefined, `Tạo tổ chức "${newOrg.name}"`, { category: newOrg.category, member_count: newOrgMembers.length });
    const createdName = newOrg.name;
    setNewOrg({ name: '', category: 'Tổ Chức', description: '' });
    setNewOrgMembers([]);
    setShowAddOrg(false);
    setOrgMsg(`Đã tạo tổ chức "${createdName}" với ${newOrgMembers.length} thành viên.`);
    setTimeout(() => setOrgMsg(''), 3000);
    fetchAllData();
  };

  const handleDeleteOrg = (orgId: string, orgName: string) => {
    requireConfirm(
      'Xóa Tổ Chức',
      `Bạn sắp xóa tổ chức "${orgName}" và toàn bộ thành viên. Hành động này không thể hoàn tác.`,
      async () => {
        const { error } = await supabase.from('organizations').delete().eq('id', orgId);
        if (error) { setOrgMsg(`Lỗi: ${error.message}`); return; }
        logAction('delete_organization', undefined, `Xóa tổ chức "${orgName}"`, { org_id: orgId });
        setOrgMsg(`Đã xóa tổ chức "${orgName}".`);
        setTimeout(() => setOrgMsg(''), 3000);
        fetchAllData();
      },
      [{ label: 'Tổ chức', value: orgName }],
      'Xóa tổ chức',
    );
  };

  const handleSaveEditOrg = async (orgId: string) => {
    const { error } = await supabase.from('organizations').update({
      name: editOrg.name,
      category: editOrg.category,
      description: editOrg.description,
      leader_id: editOrg.leader_id || null,
    }).eq('id', orgId);
    if (error) { setOrgMsg(`Lỗi: ${error.message}`); return; }
    logAction('edit_organization', undefined, `Sửa tổ chức "${editOrg.name}"`, { org_id: orgId, changes: editOrg });
    setEditingOrgId(null);
    setEditOrg({});
    setOrgMsg('Đã cập nhật tổ chức.');
    setTimeout(() => setOrgMsg(''), 3000);
    fetchAllData();
  };

  const handleAddMember = async (orgId: string) => {
    if (!newMemberUserId) return;
    const { error } = await supabase.from('organization_members').insert([{
      organization_id: orgId,
      user_id: newMemberUserId,
      role: newMemberRole || 'Thành viên',
    }]);
    if (error) { setOrgMsg(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === newMemberUserId);
    logAction('add_org_member', newMemberUserId, `Thêm ${targetUser?.oc_name || ''} vào tổ chức`, { org_id: orgId, role: newMemberRole });
    setAddMemberOrgId(null);
    setNewMemberUserId('');
    setNewMemberRole('Thành viên');
    fetchAllData();
  };

  const handleRemoveMember = async (memberId: string, orgId: string, memberName: string) => {
    const { error } = await supabase.from('organization_members').delete().eq('id', memberId);
    if (error) { setOrgMsg(`Lỗi: ${error.message}`); return; }
    logAction('remove_org_member', undefined, `Xóa ${memberName} khỏi tổ chức`, { org_id: orgId, member_id: memberId });
    fetchAllData();
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase.from('organization_members').update({ role }).eq('id', memberId);
    if (error) { setOrgMsg(`Lỗi: ${error.message}`); return; }
    fetchAllData();
  };

  const toggleExpandOrg = (orgId: string) => {
    setExpandedOrgIds(prev => { const n = new Set(prev); if (n.has(orgId)) n.delete(orgId); else n.add(orgId); return n; });
  };

  // === Titles handlers ===
  const handleAddTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.name.trim()) { setTitleMsg('Lỗi: Tên danh hiệu không được để trống.'); return; }
    const { data, error } = await supabase.rpc('admin_add_title', {
      p_name: newTitle.name.trim(),
      p_description: newTitle.description.trim() || null,
      p_color: newTitle.color,
    });
    if (error) { setTitleMsg(`Lỗi: ${error.message}`); return; }
    if (data && !data.success) { setTitleMsg(`Lỗi: ${data.error}`); return; }
    logAction('add_title', undefined, `Thêm danh hiệu "${newTitle.name.trim()}"`, { name: newTitle.name });
    setTitleMsg(`Đã thêm danh hiệu "${newTitle.name.trim()}" thành công.`);
    setNewTitle({ name: '', description: '', color: 'amber' });
    setShowAddTitle(false);
    setTimeout(() => setTitleMsg(''), 3000);
    fetchAllData();
  };

  const handleSaveEditTitle = async (titleId: string) => {
    const { data, error } = await supabase.rpc('admin_update_title', {
      p_title_id: titleId,
      p_name: editTitle.name || null,
      p_description: editTitle.description || null,
      p_color: editTitle.color || null,
    });
    if (error) { setTitleMsg(`Lỗi: ${error.message}`); return; }
    if (data && !data.success) { setTitleMsg(`Lỗi: ${data.error}`); return; }
    logAction('edit_title', undefined, `Sửa danh hiệu "${editTitle.name}"`, { title_id: titleId });
    setTitleMsg('Đã cập nhật danh hiệu thành công.');
    setEditingTitleId(null);
    setEditTitle({});
    setTimeout(() => setTitleMsg(''), 3000);
    fetchAllData();
  };

  const handleDeleteTitle = (titleId: string, titleName: string) => {
    requireConfirm(
      'Xóa Danh Hiệu',
      `Bạn sắp xóa danh hiệu "${titleName}" khỏi hệ thống. Tất cả người chơi đang sở hữu danh hiệu này cũng sẽ bị thu hồi. Hành động không thể hoàn tác.`,
      async () => {
        const { data, error } = await supabase.rpc('admin_delete_title', { p_title_id: titleId });
        if (error) { setTitleMsg(`Lỗi: ${error.message}`); return; }
        if (data && !data.success) { setTitleMsg(`Lỗi: ${data.error}`); return; }
        logAction('delete_title', undefined, `Xóa danh hiệu "${titleName}"`, { title_id: titleId });
        setTitleMsg(`Đã xóa danh hiệu "${titleName}".`);
        setTimeout(() => setTitleMsg(''), 3000);
        fetchAllData();
      },
      [{ label: 'Danh hiệu', value: titleName }],
      'Xóa danh hiệu',
    );
  };

  const toggleExpandTitleUser = async (userId: string) => {
    setExpandedTitleUserIds(prev => {
      const n = new Set(prev);
      if (n.has(userId)) { n.delete(userId); }
      else {
        n.add(userId);
        if (!userTitlesMap[userId]) {
          supabase
            .from('user_titles')
            .select('*, titles(*)')
            .eq('user_id', userId)
            .order('granted_at', { ascending: false })
            .then(({ data }) => {
              if (data) setUserTitlesMap(m => ({ ...m, [userId]: data as UserTitle[] }));
            });
        }
      }
      return n;
    });
  };

  const handleAssignTitle = async (userId: string) => {
    if (!assignTitleId) { setTitleMsg('Lỗi: Vui lòng chọn danh hiệu để cấp.'); return; }
    const { data, error } = await supabase.rpc('admin_assign_title', {
      p_user_id: userId,
      p_title_id: assignTitleId,
    });
    if (error) { setTitleMsg(`Lỗi: ${error.message}`); return; }
    if (data && !data.success) { setTitleMsg(`Lỗi: ${data.error}`); return; }
    const title = titles.find(t => t.id === assignTitleId);
    const user = allProfiles.find(p => p.id === userId);
    logAction('assign_title', userId, `Cấp danh hiệu "${title?.name}" cho ${user?.oc_name || userId.slice(0, 8)}`, { title_id: assignTitleId });
    setTitleMsg(`Đã cấp danh hiệu "${title?.name}" thành công.`);
    setAssignTitleId('');
    setAssignTitleUserId(null);
    // refresh this user's titles
    const { data: fresh } = await supabase.from('user_titles').select('*, titles(*)').eq('user_id', userId).order('granted_at', { ascending: false });
    if (fresh) setUserTitlesMap(m => ({ ...m, [userId]: fresh as UserTitle[] }));
    setTimeout(() => setTitleMsg(''), 3000);
  };

  const handleRevokeTitle = (userTitleId: string, userId: string, titleName: string) => {
    requireConfirm(
      'Thu Hồi Danh Hiệu',
      `Bạn sắp thu hồi danh hiệu "${titleName}" khỏi người chơi này.`,
      async () => {
        const { data, error } = await supabase.rpc('admin_revoke_title', { p_user_title_id: userTitleId });
        if (error) { setTitleMsg(`Lỗi: ${error.message}`); return; }
        if (data && !data.success) { setTitleMsg(`Lỗi: ${data.error}`); return; }
        logAction('revoke_title', userId, `Thu hồi danh hiệu "${titleName}"`, { user_title_id: userTitleId });
        setTitleMsg(`Đã thu hồi danh hiệu "${titleName}".`);
        const { data: fresh } = await supabase.from('user_titles').select('*, titles(*)').eq('user_id', userId).order('granted_at', { ascending: false });
        if (fresh) setUserTitlesMap(m => ({ ...m, [userId]: fresh as UserTitle[] }));
        setTimeout(() => setTitleMsg(''), 3000);
      },
      [{ label: 'Danh hiệu', value: titleName }],
      'Thu hồi',
    );
  };

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
          {approvedProfiles.filter(p => p.password && p.password.startsWith('THT') && p.password.length === 9).length > 0 && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-300/90">
                <p className="font-bold">{approvedProfiles.filter(p => p.password && p.password.startsWith('THT') && p.password.length === 9).length} tài khoản đã được cấp mật khẩu mới tự động</p>
                <p className="mt-0.5 text-sky-300/70">Mật khẩu cũ "tht123456" đã bị vô hiệu hóa. Mỗi tài khoản có mật khẩu riêng (định dạng THT + 6 số). Bấm nút mắt để xem, sau đó thông báo cho người chơi. Người chơi nên đổi mật khẩu sau khi đăng nhập.</p>
              </div>
            </div>
          )}
          {pwdMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${pwdMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {pwdMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {pwdMsg}
            </div>
          )}
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
                          {!p.password && (
                            <span className="text-[9px] text-orange-400/70 font-normal">(chưa có MK)</span>
                          )}
                        </div>
                        {p.bio && <p className="text-xs text-gray-500 mt-2 italic line-clamp-3">"{p.bio}"</p>}
                        {p.review_status === 'request_edit' && p.review_feedback && (
                          <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-[10px] text-yellow-300/80 font-semibold">Đã yêu cầu sửa:</p>
                            <p className="text-xs text-yellow-200/70 mt-0.5">{p.review_feedback}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => handleApproveWithFeedback(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all" title="Phê duyệt">
                          <Check className="w-3.5 h-3.5" /> Duyệt
                        </button>
                        <button onClick={() => handleRequestEdit(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold transition-all" title="Yêu cầu sửa">
                          <Edit3 className="w-3.5 h-3.5" /> Sửa
                        </button>
                        <button onClick={() => rejectUser(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all" title="Từ chối">
                          <X className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    </div>

                    {/* Expand/collapse skills */}
                    <button
                      onClick={() => {
                        if (expandedReviewId === p.id) { setExpandedReviewId(null); }
                        else { setExpandedReviewId(p.id); fetchSkillsForUser(p.id); }
                      }}
                      className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-amber-300 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {expandedReviewId === p.id ? 'Ẩn kỹ năng' : 'Xem kỹ năng'}
                      {expandedReviewId === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedReviewId === p.id && (
                      <div className="mt-2 space-y-2">
                        {(allSkills[p.id] || []).length === 0 ? (
                          <p className="text-xs text-gray-600 italic">Hồ sơ chưa có kỹ năng.</p>
                        ) : (
                          (allSkills[p.id] as Record<string, unknown>[]).map((sk) => (
                            <div key={sk.id as string} className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                              <p className="text-xs font-bold text-amber-100/80">{sk.name as string}</p>
                              <div className="mt-1 space-y-0.5 text-[10px] text-gray-500">
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
                              <div className="flex gap-1.5 mt-1.5">
                                <button onClick={() => { setEditingSkillId(sk.id as string); setEditSkillDraft({ ...sk }); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold transition-all">
                                  <Edit3 className="w-3 h-3" /> Sửa
                                </button>
                                <button onClick={() => handleDeleteSkill(sk.id as string)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold transition-all">
                                  <Trash2 className="w-3 h-3" /> Xóa
                                </button>
                              </div>
                              {editingSkillId === sk.id && (
                                <div className="mt-2 p-2 rounded-lg bg-black/30 border border-amber-500/10 space-y-2">
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
                                    <button onClick={() => handleSaveSkill(sk.id as string)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all">
                                      <Save className="w-3.5 h-3.5" /> Lưu
                                    </button>
                                    <button onClick={() => { setEditingSkillId(null); setEditSkillDraft({}); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold transition-all">
                                      <X className="w-3.5 h-3.5" /> Hủy
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                        <button onClick={() => handleAddSkill(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all">
                          <Plus className="w-3.5 h-3.5" /> Thêm kỹ năng
                        </button>
                      </div>
                    )}

                    {/* Feedback input */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Phản hồi BQL cho người chơi</label>
                      <textarea
                        value={reviewFeedback[p.id] || ''}
                        onChange={e => setReviewFeedback(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Nhập phản hồi cho người chơi (hiển thị khi duyệt, yêu cầu sửa, hoặc từ chối)..."
                        rows={2}
                        className="w-full px-2.5 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/40 transition-all"
                      />
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
                          <span className={`text-[10px] font-mono truncate ${!p.password ? 'text-orange-400/70' : 'text-gray-500'}`}>
                            {revealPwdIds.has(p.id) ? (p.password || '(chưa có MK)') : '••••••••'}
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

      {/* Archive Tab — Lưu Trữ Bản Cũ */}
      {activeTab === 'archive' && (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {([
            { id: 'currency' as const, label: 'Tài Sản', icon: Coins },
            { id: 'identities' as const, label: 'Danh Tính', icon: Ghost },
            { id: 'inventories' as const, label: 'Kho Vật Phẩm', icon: Package },
            { id: 'wheel' as const, label: 'Vòng Quay', icon: Dices },
            { id: 'status' as const, label: 'Trạng Thái', icon: Heart },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setArchiveSubTab(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${archiveSubTab === id ? 'bg-[#670201]/30 text-amber-100' : 'bg-black/20 text-gray-400 hover:text-amber-100 hover:bg-white/5'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'archive' && archiveSubTab === 'currency' && (
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

      {activeTab === 'archive' && archiveSubTab === 'identities' && (
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
      {activeTab === 'archive' && archiveSubTab === 'inventories' && (
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

      {activeTab === 'archive' && archiveSubTab === 'wheel' && (
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

      {activeTab === 'archive' && archiveSubTab === 'status' && (
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
                <div key={page.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  {editingPageId === page.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" value={editPage.page_number ?? 1} onChange={e => setEditPage({ ...editPage, page_number: parseInt(e.target.value) || 1 })} className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editPage.category ?? ''} onChange={e => setEditPage({ ...editPage, category: e.target.value })} placeholder="Thể loại" className="col-span-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                      </div>
                      <input type="text" value={editPage.title ?? ''} onChange={e => setEditPage({ ...editPage, title: e.target.value })} placeholder="Tiêu đề" className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                      <textarea value={editPage.content ?? ''} onChange={e => setEditPage({ ...editPage, content: e.target.value })} placeholder="Nội dung..." rows={4} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEditPage(page.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <Save className="w-3.5 h-3.5" /> Lưu
                        </button>
                        <button onClick={() => { setEditingPageId(null); setEditPage({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-100/90 truncate">Trang {page.page_number}: {page.title}</p>
                        <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID: {page.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 truncate">{page.category}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleEditPage(page)} className="p-2 text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePage(page.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
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
              Quản lý Kim Bảng Đề Danh: thêm, chỉnh sửa, cập nhật hoặc xóa các hạng mục. Thay đổi sẽ hiển thị ngay trên trang Kim Bảng công khai.
            </p>
          </div>
          {kimBangMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${kimBangMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {kimBangMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {kimBangMsg}
            </div>
          )}

          {/* Add new entry form */}
          {showAddKimBang && (
            <div className="p-4 rounded-xl bg-black/30 border border-amber-500/25">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-amber-300/70" />
                <h4 className="font-serif font-bold text-amber-100/90 text-sm sm:text-base">Thêm Hạng Mục Kim Bảng</h4>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hạng</label>
                    <input
                      type="number"
                      min={1}
                      value={newKimBang.rank}
                      onChange={e => setNewKimBang(prev => ({ ...prev, rank: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh tính</label>
                    <input
                      type="text"
                      value={newKimBang.identity_name}
                      onChange={e => setNewKimBang(prev => ({ ...prev, identity_name: e.target.value }))}
                      placeholder="Tên nhân vật..."
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tài phú</label>
                    <input
                      type="text"
                      value={newKimBang.wealth}
                      onChange={e => setNewKimBang(prev => ({ ...prev, wealth: e.target.value }))}
                      placeholder="vd: 8.460 Hoa Tiền"
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Dị sự</label>
                    <input
                      type="number"
                      min={0}
                      value={newKimBang.quests_completed}
                      onChange={e => setNewKimBang(prev => ({ ...prev, quests_completed: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh hiệu tri ân</label>
                  <input
                    type="text"
                    value={newKimBang.honor_title}
                    onChange={e => setNewKimBang(prev => ({ ...prev, honor_title: e.target.value }))}
                    placeholder="vd: Trảm U Minh"
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Link ảnh đại diện</label>
                  <input
                    type="text"
                    value={newKimBang.avatar_url}
                    onChange={e => setNewKimBang(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="Dán link ảnh đại diện..."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vĩ ngữ</label>
                  <input
                    type="text"
                    value={newKimBang.epithet}
                    onChange={e => setNewKimBang(prev => ({ ...prev, epithet: e.target.value }))}
                    placeholder="vd: Một kiếm trấn tà, danh vang đất Trùng Hoan."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddKimBang}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/25 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" /> Lưu hạng mục
                  </button>
                  <button
                    onClick={() => { setShowAddKimBang(false); setNewKimBang({ rank: 1, identity_name: '', wealth: '', quests_completed: 0, honor_title: '', avatar_url: '', epithet: '' }); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/20 hover:bg-black/30 text-gray-400 text-xs font-bold border border-white/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add button */}
          {!showAddKimBang && (
            <button
              onClick={() => setShowAddKimBang(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-bold border border-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm hạng mục Kim Bảng
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kimBangEntries.map(entry => (
              <div key={entry.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/15">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-ink-950 font-bold text-sm flex-shrink-0">
                      {entry.rank}
                    </div>
                    <h4 className="font-serif font-bold text-amber-100/90 text-sm sm:text-base truncate">
                      {['', 'Đệ Nhất', 'Đệ Nhị', 'Đệ Tam', 'Đệ Tứ', 'Đệ Ngũ', 'Đệ Lục'][entry.rank]}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleDeleteKimBang(entry.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/15 transition-all flex-shrink-0"
                    title="Xóa hạng mục này"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
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

      {/* Bach Hoa Tab */}
      {activeTab === 'bachhoa' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <LotusIcon className="w-4 h-4 inline mr-1" />
              Quản lý ứng viên Bách Hoa Triều Phụng: thêm, chỉnh sửa (nhấn nút Lưu để áp dụng) hoặc xóa (cần xác nhận 2 lần). Nhấn vào một ứng viên để xem danh sách người đã bình chọn (cập nhật theo thời gian thực, chỉ quản trị viên xem được).
            </p>
          </div>
          {bachHoaMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${bachHoaMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {bachHoaMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {bachHoaMsg}
            </div>
          )}

          {showAddBachHoa && (
            <div className="p-4 rounded-xl bg-black/30 border border-amber-500/25">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-amber-300/70" />
                <h4 className="font-serif font-bold text-amber-100/90 text-sm sm:text-base">Thêm Ứng Viên Bách Hoa</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh tính</label>
                  <input
                    type="text"
                    value={newBachHoa.identity_name}
                    onChange={e => setNewBachHoa(prev => ({ ...prev, identity_name: e.target.value }))}
                    placeholder="Tên nhân vật..."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh hiệu</label>
                  <input
                    type="text"
                    value={newBachHoa.title}
                    onChange={e => setNewBachHoa(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Danh hiệu tùy chỉnh (vd: Khuynh Quốc Khuynh Thành)..."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trích dẫn</label>
                  <input
                    type="text"
                    value={newBachHoa.quote}
                    onChange={e => setNewBachHoa(prev => ({ ...prev, quote: e.target.value }))}
                    placeholder="Lời thoại / trích dẫn..."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Link ảnh đại diện</label>
                  <input
                    type="text"
                    value={newBachHoa.avatar_url}
                    onChange={e => setNewBachHoa(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="/images/bach-hoa-trieu-phung/..."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddBachHoa}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/25 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" /> Lưu ứng viên
                  </button>
                  <button
                    onClick={() => { setShowAddBachHoa(false); setNewBachHoa({ identity_name: '', quote: '', avatar_url: '', title: '' }); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/20 hover:bg-black/30 text-gray-400 text-xs font-bold border border-white/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showAddBachHoa && (
            <button
              onClick={() => setShowAddBachHoa(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-bold border border-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm ứng viên
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bachHoaEntries.map((entry, idx) => {
              const voters = bachHoaVotes[entry.id] || [];
              const isExpanded = expandedBachHoaVoters.has(entry.id);
              const isEditing = !!bachHoaEditing[entry.id];
              const draft = bachHoaEditing[entry.id];
              return (
              <div key={entry.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/15">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#670201]/20 border border-[#670201]/30 text-amber-300 font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-xs text-amber-300/70 font-semibold flex-shrink-0">{entry.vote_count} phiếu</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEditBachHoa(entry)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/15 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBachHoa(entry.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/15 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
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
                  <div className="flex-1 min-w-0">
                    {isEditing && draft ? (
                      <input
                        type="text"
                        value={draft.avatar_url}
                        onChange={e => setBachHoaEditing(prev => ({ ...prev, [entry.id]: { ...draft, avatar_url: e.target.value } }))}
                        placeholder="Dán link ảnh đại diện..."
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    ) : (
                      <p className="text-xs text-gray-500 truncate">{entry.avatar_url || 'Chưa có ảnh'}</p>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh tính</label>
                    {isEditing && draft ? (
                      <input
                        type="text"
                        value={draft.identity_name}
                        onChange={e => setBachHoaEditing(prev => ({ ...prev, [entry.id]: { ...draft, identity_name: e.target.value } }))}
                        placeholder="Tên nhân vật..."
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    ) : (
                      <p className="text-sm text-amber-100/90 font-serif font-bold">{entry.identity_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh hiệu</label>
                    {isEditing && draft ? (
                      <input
                        type="text"
                        value={draft.title}
                        onChange={e => setBachHoaEditing(prev => ({ ...prev, [entry.id]: { ...draft, title: e.target.value } }))}
                        placeholder="Danh hiệu tùy chỉnh..."
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    ) : (
                      <p className="text-xs text-amber-300/80 italic font-serif">{entry.title || '—'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trích dẫn</label>
                    {isEditing && draft ? (
                      <input
                        type="text"
                        value={draft.quote}
                        onChange={e => setBachHoaEditing(prev => ({ ...prev, [entry.id]: { ...draft, quote: e.target.value } }))}
                        placeholder="Lời thoại / trích dẫn..."
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    ) : (
                      <p className="text-xs text-amber-100/60 italic">"{entry.quote || '—'}"</p>
                    )}
                  </div>
                </div>

                {/* Save / Cancel buttons when editing */}
                {isEditing && draft && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSaveBachHoa(entry.id)}
                      disabled={bachHoaSaving === entry.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/25 transition-all disabled:opacity-50"
                    >
                      {bachHoaSaving === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={() => handleCancelEditBachHoa(entry.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/20 hover:bg-black/30 text-gray-400 text-xs font-bold border border-white/10 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Hủy
                    </button>
                  </div>
                )}

                {/* Voter list — clickable to expand, admin-only */}
                <button
                  onClick={() => toggleBachHoaVoters(entry.id)}
                  className="w-full mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#670201]/10 hover:bg-[#670201]/20 border border-[#670201]/20 transition-all"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300/60 flex-shrink-0" />
                  <span className="text-xs text-amber-300/80 font-semibold">Người bình chọn</span>
                  <span className="text-[10px] text-gray-500 ml-1">({voters.length})</span>
                  {bachHoaVoterLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-300/40 ml-1" />}
                  <span className="ml-auto">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {voters.length === 0 ? (
                      <p className="text-xs text-gray-600 text-center py-3">Chưa có lượt bình chọn nào.</p>
                    ) : (
                      voters.map((v) => {
                        const name = v.profiles?.oc_name || v.profiles?.anonymous_name || `ID:${v.user_id.slice(0, 8)}`;
                        return (
                          <div key={v.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 flex-shrink-0" />
                            <span className="text-xs text-amber-100/80 font-medium truncate flex-1">{name}</span>
                            <span className="flex items-center gap-1 text-[10px] text-gray-600 flex-shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(v.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              );
            })}
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
              shopItems={shopItems}
              onBack={() => setLookupSelectedId(null)}
              onStatusUpdate={handleStatusUpdate}
              onRefresh={fetchAllData}
              onLogAction={logAction}
              onDisableUser={handleDisableUser}
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
                      {p.is_disabled && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">Vô hiệu hóa</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEnableUser(p.id); }}
                            className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20 transition-all"
                          >
                            Mở khóa
                          </button>
                        </div>
                      )}
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

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {exportMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${exportMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {exportMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {exportMsg}
            </div>
          )}
          <div className={cardCls}>
            <div className="flex items-center gap-3 mb-4">
              <FileDown className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Sao Lưu Dữ Liệu Người Chơi</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Tải xuống toàn bộ dữ liệu hệ thống từ trước đến nay, bao gồm cả tài khoản đăng nhập
              của người chơi và quản trị viên, hồ sơ nhân vật, giao dịch tiền tệ, kho vật phẩm, lượt quay vòng quay,
              tin nhắn, bạn bè, bài đăng diễn đàn, bình luận, di chúc, thông báo,
              nhật ký quản trị, lịch sử mật khẩu, lệnh truy nã, giỏ hàng, Kim Bảng,
              vật phẩm thương thành, trang bách khoa, Bách Quỷ Âm, kho phần thưởng vòng quay,
              và cài đặt hệ thống.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExportData('json')}
                disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-sm font-bold border border-[#670201]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Tải file JSON
              </button>
              <button
                onClick={() => handleExportData('csv')}
                disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Tải file CSV (hồ sơ)
              </button>
            </div>
          </div>

          <div className={cardCls}>
            <div className="flex items-center gap-3 mb-2">
              <FileDown className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Sao Lưu Từng Mục</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Tải xuống từng loại dữ liệu riêng biệt, mỗi mục một file JSON riêng. Nhấn "Tải tất cả" để tải toàn bộ 19 mục cùng lúc.
            </p>
            <button
              onClick={handleExportAllSeparate}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-sm font-bold border border-[#670201]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Tải tất cả (mỗi mục 1 file)
            </button>
            <div className="flex flex-wrap gap-2">
              {SINGLE_TABLE_CONFIG.map(cfg => (
                <button
                  key={cfg.filename}
                  onClick={() => handleExportSingleTable(cfg.label, cfg.table, cfg.select, cfg.orderBy, cfg.ascending ?? false, cfg.filename)}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div className={cardCls}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Sao Lưu Trang Bách Khoa (Mỗi Trang 1 File)</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Tải xuống toàn bộ nội dung Bách Khoa Toàn Thư — mỗi trang nhỏ (Khởi Nguồn, Quy Tắc, Vương Triều...) được xuất thành một file JSON riêng, bao gồm tiêu đề, thể loại và toàn bộ nội dung.
            </p>
            <button
              onClick={handleExportBachKhoaPages}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-bold border border-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Tải mỗi trang bách khoa 1 file
            </button>
          </div>

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

      {/* Broadcast Tab */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Broadcast notification card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Phát Thông Báo Toàn Hệ Thống</h3>
                <p className="text-xs text-gray-500 mt-0.5">Gửi thông báo đẩy đến toàn bộ người chơi. Hiển thị 8 giây trên màn hình.</p>
              </div>
            </div>

            {broadcastMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${broadcastMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                {broadcastMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                {broadcastMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Tiêu đề thông báo</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="vd: Thông báo bảo trì hệ thống"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nội dung (tùy chọn)</label>
                <textarea
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  rows={3}
                  placeholder="Nội dung chi tiết của thông báo..."
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Đường dẫn khi bấm vào (tùy chọn)</label>
                <input
                  type="text"
                  value={broadcastLink}
                  onChange={e => setBroadcastLink(e.target.value)}
                  placeholder="vd: /forum hoặc /bach-phap"
                  className={inputCls}
                />
              </div>
              <button
                onClick={() => {
                  if (!broadcastTitle.trim()) {
                    setBroadcastMsg('Lỗi: Vui lòng nhập tiêu đề thông báo.');
                    return;
                  }
                  requireConfirm(
                    'Xác Nhận Phát Thông Báo',
                    `Bạn sắp phát thông báo đến TOÀN BỘ người chơi. Mọi tài khoản đang online sẽ thấy thông báopopup hiển thị 8 giây. Vui lòng kiểm tra kỹ nội dung trước khi xác nhận.`,
                    async () => {
                      const { data, error } = await supabase.rpc('admin_broadcast_notification', {
                        p_title: broadcastTitle.trim(),
                        p_body: broadcastBody.trim() || null,
                        p_link: broadcastLink.trim() || null,
                      });
                      if (error) {
                        setBroadcastMsg(`Lỗi: ${error.message}`);
                        return;
                      }
                      const result = data as { success: boolean; notification_id: string };
                      if (!result?.success) {
                        setBroadcastMsg('Lỗi: Không thể phát thông báo.');
                        return;
                      }
                      logAction('broadcast_notification', undefined, `Phát thông báo: ${broadcastTitle.trim()}`, { title: broadcastTitle.trim(), body: broadcastBody.trim() });
                      setBroadcastMsg(`Đã phát thông báo thành công đến toàn bộ người chơi.`);
                      setBroadcastTitle('');
                      setBroadcastBody('');
                      setBroadcastLink('');
                      setTimeout(() => setBroadcastMsg(''), 4000);
                    },
                    [
                      { label: 'Tiêu đề', value: broadcastTitle.trim() },
                      { label: 'Nội dung', value: broadcastBody.trim() || '(không có)' },
                      { label: 'Người nhận', value: 'TOÀN BỘ người chơi' },
                    ],
                    'Phát thông báo',
                  );
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-sm font-bold border border-red-500/30 transition-all"
              >
                <Send className="w-4 h-4" />
                Phát Thông Báo
              </button>
            </div>
          </div>

          {/* Bulk currency grant card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Cấp Tài Sản Hàng Loạt</h3>
                <p className="text-xs text-gray-500 mt-0.5">Cấp tiền cho toàn bộ người chơi đã duyệt cùng lúc. Mỗi người nhận một giao dịch ghi nhận.</p>
              </div>
            </div>

            {bulkMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${bulkMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                {bulkMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                {bulkMsg}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Loại tiền</label>
                  <select
                    value={bulkCurrencyType}
                    onChange={e => setBulkCurrencyType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Số lượng (mỗi người)</label>
                  <input
                    type="number"
                    value={bulkAmount}
                    onChange={e => setBulkAmount(parseInt(e.target.value) || 0)}
                    placeholder="vd: 100"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Lý do</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={e => setBulkReason(e.target.value)}
                  placeholder="vd: Bồi thường sự cố hệ thống"
                  className={inputCls}
                />
              </div>
              <button
                onClick={() => {
                  if (bulkAmount === 0) {
                    setBulkMsg('Lỗi: Số lượng phải khác 0.');
                    return;
                  }
                  if (!bulkReason.trim()) {
                    setBulkMsg('Lỗi: Vui lòng nhập lý do.');
                    return;
                  }
                  const currencyLabel = bulkCurrencyType === 'HUA_TIEN' ? 'Hoa Tiền' : bulkCurrencyType === 'CONG_DUC' ? 'Công Đức' : 'Âm Đức';
                  requireConfirm(
                    'Xác Nhận Cấp Tài Sản Hàng Loạt',
                    `Bạn sắp cấp ${currencyLabel} x${bulkAmount} cho TOÀN BỘ người chơi đã duyệt. Hành động này không thể hoàn tác và sẽ ghi giao dịch cho từng người.`,
                    async () => {
                      const { data, error } = await supabase.rpc('admin_bulk_grant_currency', {
                        p_currency_type: bulkCurrencyType,
                        p_amount: bulkAmount,
                        p_reason: bulkReason.trim(),
                      });
                      if (error) {
                        setBulkMsg(`Lỗi: ${error.message}`);
                        return;
                      }
                      const result = data as { success: boolean; affected_count: number };
                      if (!result?.success) {
                        setBulkMsg('Lỗi: Không thể cấp tài sản.');
                        return;
                      }
                      logAction('bulk_grant_currency', undefined, `Cấp ${currencyLabel} x${bulkAmount} cho ${result.affected_count} người chơi`, { currency_type: bulkCurrencyType, amount: bulkAmount, reason: bulkReason.trim(), affected: result.affected_count });
                      setBulkMsg(`Đã cấp ${currencyLabel} x${bulkAmount} cho ${result.affected_count} người chơi thành công.`);
                      setBulkAmount(0);
                      setBulkReason('');
                      setTimeout(() => setBulkMsg(''), 5000);
                      fetchAllData();
                    },
                    [
                      { label: 'Loại tiền', value: currencyLabel },
                      { label: 'Số lượng/người', value: String(bulkAmount) },
                      { label: 'Lý do', value: bulkReason.trim() },
                      { label: 'Người nhận', value: 'TOÀN BỘ người chơi đã duyệt' },
                    ],
                    'Cấp tài sản',
                  );
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-sm font-bold border border-amber-500/30 transition-all"
              >
                <Coins className="w-4 h-4" />
                Cấp Cho Toàn Bộ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Titles Tab */}
      {activeTab === 'titles' && (
        <div className="space-y-6">
          {titleMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${titleMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {titleMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {titleMsg}
            </div>
          )}

          {/* Titles catalog management */}
          <div className={cardCls}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Bộ Sưu Tầm Danh Hiệu</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tạo, sửa, xóa danh hiệu và cấp cho người chơi.</p>
                </div>
              </div>
              <button onClick={() => setShowAddTitle(!showAddTitle)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all flex-shrink-0">
                {showAddTitle ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showAddTitle ? 'Hủy' : 'Thêm Danh Hiệu'}
              </button>
            </div>

            {showAddTitle && (
              <form onSubmit={handleAddTitle} className="space-y-3 border border-white/5 rounded-lg p-4 bg-black/20 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tên danh hiệu</label>
                    <input type="text" value={newTitle.name} onChange={e => setNewTitle({ ...newTitle, name: e.target.value })} required placeholder="vd: Tuyệt Đỉnh Cao Thủ" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Màu sắc</label>
                    <select value={newTitle.color} onChange={e => setNewTitle({ ...newTitle, color: e.target.value })} className={inputCls}>
                      {Object.entries(TITLE_COLORS).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mô tả (tùy chọn)</label>
                  <input type="text" value={newTitle.description} onChange={e => setNewTitle({ ...newTitle, description: e.target.value })} placeholder="Mô tả ngắn về danh hiệu..." className={inputCls} />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">Tạo Mới</button>
              </form>
            )}

            {titles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Chưa có danh hiệu nào. Bấm "Thêm Danh Hiệu" để tạo.</p>
            ) : (
              <div className="space-y-2">
                {titles.map(title => {
                  const colorCfg = TITLE_COLORS[title.color] || TITLE_COLORS.amber;
                  const isEditing = editingTitleId === title.id;
                  return (
                    <div key={title.id} className="rounded-lg border border-white/5 bg-black/20 p-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Tên danh hiệu</label>
                              <input type="text" value={editTitle.name || ''} onChange={e => setEditTitle({ ...editTitle, name: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Màu sắc</label>
                              <select value={editTitle.color || 'amber'} onChange={e => setEditTitle({ ...editTitle, color: e.target.value })} className={inputCls}>
                                {Object.entries(TITLE_COLORS).map(([key, cfg]) => (
                                  <option key={key} value={key}>{cfg.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Mô tả</label>
                            <input type="text" value={editTitle.description || ''} onChange={e => setEditTitle({ ...editTitle, description: e.target.value })} className={inputCls} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEditTitle(title.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all"><Save className="w-3.5 h-3.5" /> Lưu</button>
                            <button onClick={() => { setEditingTitleId(null); setEditTitle({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold transition-all"><X className="w-3.5 h-3.5" /> Hủy</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${colorCfg.badgeClass}`}>{title.name}</span>
                            {title.description && <span className="text-xs text-gray-500 truncate hidden sm:inline">{title.description}</span>}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => { setEditingTitleId(title.id); setEditTitle({ ...title }); }} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteTitle(title.id, title.name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assign titles to players */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Cấp Danh Hiệu Cho Người Chơi</h3>
                <p className="text-xs text-gray-500 mt-0.5">Mở rộng từng người để xem và cấp/thu hồi danh hiệu.</p>
              </div>
            </div>

            <div className="space-y-2">
              {approvedProfiles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có người chơi nào.</p>
              ) : approvedProfiles.map(p => {
                const isExpanded = expandedTitleUserIds.has(p.id);
                const userTitles = userTitlesMap[p.id] || [];
                return (
                  <div key={p.id} className="rounded-lg border border-white/5 bg-black/20 overflow-hidden">
                    <button onClick={() => toggleExpandTitleUser(p.id)} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#670201]/30">
                        <UserCog className="h-4 w-4 text-amber-300/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-amber-100/90">{p.oc_name}</p>
                        <p className="text-xs text-gray-500">{userTitles.length} danh hiệu</p>
                      </div>
                      {userTitles.filter(ut => ut.is_displayed).length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 whitespace-nowrap">{userTitles.filter(ut => ut.is_displayed).length} hiển thị</span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-500" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-white/5 p-4 space-y-3">
                        {/* Existing titles */}
                        {userTitles.length > 0 && (
                          <div className="space-y-1.5">
                            {userTitles.map(ut => {
                              const t = ut.titles;
                              const colorCfg = t ? (TITLE_COLORS[t.color] || TITLE_COLORS.amber) : TITLE_COLORS.amber;
                              return (
                                <div key={ut.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/30 border border-white/5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${ut.is_displayed ? colorCfg.activeClass : colorCfg.badgeClass}`}>{t?.name || '(?)'}</span>
                                    {ut.is_displayed && <span className="text-[10px] text-emerald-400/70">Đang hiển thị</span>}
                                  </div>
                                  <button onClick={() => handleRevokeTitle(ut.id, p.id, t?.name || '')} className="p-1 rounded text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Assign new title */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
                          <select value={assignTitleUserId === p.id ? assignTitleId : ''} onChange={e => { setAssignTitleUserId(p.id); setAssignTitleId(e.target.value); }} className={`${inputCls} flex-1`}>
                            <option value="">Chọn danh hiệu để cấp...</option>
                            {titles.filter(t => !userTitles.some(ut => ut.title_id === t.id)).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignTitle(p.id)}
                            disabled={assignTitleUserId !== p.id || !assignTitleId}
                            className="px-4 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
                          >
                            <Plus className="w-4 h-4 inline mr-1" /> Cấp
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          {orgMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${orgMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {orgMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {orgMsg}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Danh Sách Tổ Chức ({organizations.length})</h3>
            <button onClick={() => setShowAddOrg(!showAddOrg)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all flex-shrink-0">
              {showAddOrg ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showAddOrg ? 'Hủy' : 'Tạo Tổ Chức'}
            </button>
          </div>

          {showAddOrg && (
            <form onSubmit={handleAddOrg} className={`${cardCls} space-y-4`}>
              <h4 className="text-sm font-bold text-amber-100/80">Tổ Chức Mới</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tên tổ chức</label>
                  <input type="text" value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} required placeholder="vd: Thiện Nan Giáo" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Thể loại</label>
                  <select value={newOrg.category} onChange={e => setNewOrg({ ...newOrg, category: e.target.value })} className={inputCls}>
                    <option value="Tổ Chức">Tổ Chức</option>
                    <option value="Môn Phái">Môn Phái</option>
                    <option value="Bang Hội">Bang Hội</option>
                    <option value="Giáo Phái">Giáo Phái</option>
                    <option value="Triều Đình">Triều Đình</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Mô tả (tùy chọn)</label>
                <textarea value={newOrg.description} onChange={e => setNewOrg({ ...newOrg, description: e.target.value })} rows={2} placeholder="Mô tả ngắn về tổ chức..." className={`${inputCls} resize-none`} />
              </div>

              {/* Member tagging when creating */}
              <div className="border-t border-white/5 pt-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-3">
                  <Users className="w-3 h-3" /> Thành viên ({newOrgMembers.length})
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <select value={newMemberUserId} onChange={e => setNewMemberUserId(e.target.value)} className={`${inputCls} flex-1`}>
                    <option value="">Chọn người chơi...</option>
                    {allProfiles.filter(p => !newOrgMembers.some(m => m.user_id === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.oc_name} · {p.email}</option>
                    ))}
                  </select>
                  <input type="text" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Vai trò" className={`${inputCls} sm:w-32`} />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMemberUserId) return;
                      const user = allProfiles.find(p => p.id === newMemberUserId);
                      setNewOrgMembers([...newOrgMembers, { user_id: newMemberUserId, role: newMemberRole || 'Thành viên', oc_name: user?.oc_name || '' }]);
                      setNewMemberUserId('');
                      setNewMemberRole('Thành viên');
                    }}
                    disabled={!newMemberUserId}
                    className="px-3 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {newOrgMembers.length > 0 && (
                  <div className="space-y-1.5">
                    {newOrgMembers.map((m, idx) => (
                      <div key={m.user_id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                        <span className="text-sm text-gray-200 truncate">{m.oc_name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input
                            type="text"
                            value={m.role}
                            onChange={e => setNewOrgMembers(newOrgMembers.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))}
                            className="w-24 px-2 py-1 bg-black/30 border border-white/10 rounded text-[10px] text-gray-300 focus:outline-none focus:border-amber-500/40"
                          />
                          <button
                            type="button"
                            onClick={() => setNewOrgMembers(newOrgMembers.filter((_, i) => i !== idx))}
                            className="p-1 rounded text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                Tạo Mới
              </button>
            </form>
          )}

          {organizations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có tổ chức nào. Bấm "Tạo Tổ Chức" để thêm.</p>
          ) : (
            <div className="space-y-3">
              {organizations.map(org => {
                const isExpanded = expandedOrgIds.has(org.id);
                const members = orgMembers[org.id] || [];
                const isEditing = editingOrgId === org.id;
                return (
                  <div key={org.id} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                    <button
                      onClick={() => toggleExpandOrg(org.id)}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#670201]/30">
                        <Building2 className="h-5 w-5 text-amber-300/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-amber-100/90">{org.name}</p>
                        <p className="text-xs text-gray-500">
                          {org.category} · Thủ lĩnh: {org.leader?.oc_name || '—'} · {members.length} thành viên
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-500" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-white/5 p-4 space-y-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Tên tổ chức</label>
                                <input type="text" value={editOrg.name || ''} onChange={e => setEditOrg({ ...editOrg, name: e.target.value })} className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Thể loại</label>
                                <select value={editOrg.category || ''} onChange={e => setEditOrg({ ...editOrg, category: e.target.value })} className={inputCls}>
                                  <option value="Tổ Chức">Tổ Chức</option>
                                  <option value="Môn Phái">Môn Phái</option>
                                  <option value="Bang Hội">Bang Hội</option>
                                  <option value="Giáo Phái">Giáo Phái</option>
                                  <option value="Triều Đình">Triều Đình</option>
                                  <option value="Khác">Khác</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Thủ lĩnh</label>
                              <select value={editOrg.leader_id || ''} onChange={e => setEditOrg({ ...editOrg, leader_id: e.target.value })} className={inputCls}>
                                <option value="">— Chưa chọn —</option>
                                {allProfiles.map(p => (
                                  <option key={p.id} value={p.id}>{p.oc_name} · {p.email}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Mô tả</label>
                              <textarea value={editOrg.description || ''} onChange={e => setEditOrg({ ...editOrg, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveEditOrg(org.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all">
                                <Save className="w-3.5 h-3.5" /> Lưu
                              </button>
                              <button onClick={() => { setEditingOrgId(null); setEditOrg({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold transition-all">
                                <X className="w-3.5 h-3.5" /> Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {org.description && (
                              <p className="text-sm text-gray-400 italic">"{org.description}"</p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => { setEditingOrgId(org.id); setEditOrg({ ...org }); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all">
                                <Edit3 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button onClick={() => handleDeleteOrg(org.id, org.name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </div>
                          </>
                        )}

                        {/* Members section */}
                        <div className="border-t border-white/5 pt-3">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Thành viên ({members.length})
                            </p>
                            <button
                              onClick={() => setAddMemberOrgId(addMemberOrgId === org.id ? null : org.id)}
                              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-300 transition-all"
                            >
                              {addMemberOrgId === org.id ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {addMemberOrgId === org.id ? 'Hủy' : 'Thêm thành viên'}
                            </button>
                          </div>

                          {addMemberOrgId === org.id && (
                            <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 rounded-lg bg-black/30 border border-white/5">
                              <select value={newMemberUserId} onChange={e => setNewMemberUserId(e.target.value)} className={`${inputCls} flex-1`}>
                                <option value="">Chọn người chơi...</option>
                                {allProfiles.filter(p => !members.some(m => m.user_id === p.id)).map(p => (
                                  <option key={p.id} value={p.id}>{p.oc_name} · {p.email}</option>
                                ))}
                              </select>
                              <input type="text" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Vai trò" className={`${inputCls} sm:w-32`} />
                              <button onClick={() => handleAddMember(org.id)} disabled={!newMemberUserId} className="px-3 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {members.length === 0 ? (
                            <p className="text-xs text-gray-600 italic">Chưa có thành viên.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {members.map(m => (
                                <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {org.leader_id === m.user_id && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                    <span className="text-sm text-gray-200 truncate">{m.profiles?.oc_name || m.user_id.slice(0, 8)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <input
                                      type="text"
                                      value={m.role}
                                      onChange={e => handleUpdateMemberRole(m.id, e.target.value)}
                                      className="w-24 px-2 py-1 bg-black/30 border border-white/10 rounded text-[10px] text-gray-300 focus:outline-none focus:border-amber-500/40"
                                    />
                                    <button onClick={() => handleRemoveMember(m.id, org.id, m.profiles?.oc_name || m.user_id.slice(0, 8))} className="p-1 rounded text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
