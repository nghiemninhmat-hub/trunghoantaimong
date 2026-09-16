import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  supabase, Profile, ShopItem, SitePage, Transaction, InventoryItem,
  CURRENCY_LABELS, WantedNotice, KimBangEntry, AuditLog, PasswordHistoryEntry,
  WheelSpinLog, Will, WillStatus, BachHoaEntry, BachHoaVote,
  Organization, OrganizationMember, Title, UserTitle, TITLE_COLORS,
  Coupon, SkillTemplate, OrgTreasury, OrgTreasuryLog, HiepLuuRegistration,
} from '@/lib/supabase';
import {
  Shield, Users, Coins, Store, BookOpen, Ghost, Check, X, Plus, Trash2,
  AlertCircle, CheckCircle2, History, Edit3, Eye, EyeOff, Dices, Package,
  Heart, Sparkle, Brain, Lock, Unlock, FileWarning, Crown, Save, ScrollText,
  Undo2, RotateCcw, Search, UserSearch, ArrowLeft, ChevronDown, ChevronUp,
  FileSignature, Info, Download, FileDown, Loader2, Archive, Settings, Clock,
  Building2, UserCog, Megaphone, Send, Award, Tag, Zap, ToggleLeft, ToggleRight,
  Ticket, Sparkles, User,
} from 'lucide-react';
import { LotusIcon } from '@/components/LotusIcon';
import ConfirmDialog from '@/components/ConfirmDialog';
import PlayerDetailCard from '@/components/PlayerDetailCard';
import NghiepThuatAdmin from '@/components/admin/NghiepThuatAdmin';
import Avatar from '@/components/Avatar';
import { STATUS_TAGS, MENTAL_SUB_TAGS, PHYSICAL_SUB_TAGS, parseMultiValue, joinMultiValue, toggleTag } from '@/lib/skillTags';

type Tab = 'accounts' | 'archive' | 'shop' | 'pages' | 'wanted' | 'kimbang' | 'bachhoa' | 'audit' | 'lookup' | 'wheel' | 'wills' | 'settings' | 'organizations' | 'broadcast' | 'titles' | 'coupons' | 'nghiepthuat' | 'hiepluu';

const cardCls = "p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10";
const inputCls = "w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
const labelCls = "block text-[10px] text-gray-500 mb-1 uppercase tracking-wider";

const TAB_CONFIG: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: 'accounts', label: 'Tài Khoản', icon: Users },
  { id: 'archive', label: 'Lưu Trữ', icon: Archive },
  { id: 'shop', label: 'Cửa Hàng', icon: Store },
  { id: 'pages', label: 'Trang', icon: BookOpen },
  { id: 'wanted', label: 'Truy Nã', icon: FileWarning },
  { id: 'kimbang', label: 'Kim Bảng', icon: Crown },
  { id: 'bachhoa', label: 'Bách Hoa', icon: Sparkles },
  { id: 'audit', label: 'Nhật Ký', icon: History },
  { id: 'lookup', label: 'Tra Cứu', icon: UserSearch },
  { id: 'wheel', label: 'Vòng Quay', icon: Dices },
  { id: 'wills', label: 'Di Chúc', icon: ScrollText },
  { id: 'settings', label: 'Cài Đặt', icon: Settings },
  { id: 'organizations', label: 'Tổ Chức', icon: Building2 },
  { id: 'broadcast', label: 'Thông Báo', icon: Megaphone },
  { id: 'titles', label: 'Danh Hiệu', icon: Award },
  { id: 'coupons', label: 'Mã Giảm', icon: Ticket },
  { id: 'nghiepthuat', label: 'Nghiệp Thuật', icon: Zap },
  { id: 'hiepluu', label: 'Hiệp Lưu', icon: Heart },
];

export default function AdminDashboard() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('accounts');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Accounts
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [approvedProfiles, setApprovedProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [revealPwd, setRevealPwd] = useState<Record<string, boolean>>({});
  const [pwdHistory, setPwdHistory] = useState<Record<string, PasswordHistoryEntry[]>>({});
  const [showPwdHistory, setShowPwdHistory] = useState<Record<string, boolean>>({});
  const [editingPwd, setEditingPwd] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState('');

  // Status
  const [statusMsg, setStatusMsg] = useState('');

  // Shop
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemDraft, setEditItemDraft] = useState<Partial<ShopItem>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ShopItem>>({});

  // Pages
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageDraft, setEditPageDraft] = useState<Partial<SitePage>>({});
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPage, setNewPage] = useState<Partial<SitePage>>({});

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxDraft, setEditTxDraft] = useState<Partial<Transaction>>({});

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Wanted
  const [wantedNotices, setWantedNotices] = useState<WantedNotice[]>([]);

  // Kim Bang
  const [kimBang, setKimBang] = useState<KimBangEntry[]>([]);
  const [editingKimBangId, setEditingKimBangId] = useState<string | null>(null);
  const [editKimBangDraft, setEditKimBangDraft] = useState<Partial<KimBangEntry>>({});
  const [showAddKimBang, setShowAddKimBang] = useState(false);
  const [newKimBang, setNewKimBang] = useState<Partial<KimBangEntry>>({});

  // Wheel
  const [wheelLogs, setWheelLogs] = useState<WheelSpinLog[]>([]);

  // Wills
  const [wills, setWills] = useState<Will[]>([]);

  // Bach Hoa
  const [bachHoaEntries, setBachHoaEntries] = useState<BachHoaEntry[]>([]);
  const [bachHoaVotes, setBachHoaVotes] = useState<BachHoaVote[]>([]);

  // Organizations
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgMembers, setOrgMembers] = useState<Record<string, OrganizationMember[]>>({});
  const [orgTreasuries, setOrgTreasuries] = useState<Record<string, OrgTreasury>>({});
  const [orgTreasuryLogs, setOrgTreasuryLogs] = useState<Record<string, OrgTreasuryLog[]>>({});

  // Titles
  const [titles, setTitles] = useState<Title[]>([]);
  const [userTitles, setUserTitles] = useState<UserTitle[]>([]);
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [newTitle, setNewTitle] = useState<Partial<Title>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState<Partial<Title>>({});
  const [grantTitleUserId, setGrantTitleUserId] = useState('');
  const [grantTitleId, setGrantTitleId] = useState('');

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({});
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [editCouponDraft, setEditCouponDraft] = useState<Partial<Coupon>>({});

  // Skill templates
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>([]);
  const [allSkills, setAllSkills] = useState<Record<string, unknown[]>>({});
  const [templateMsg, setTemplateMsg] = useState('');
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<Partial<SkillTemplate>>({});
  const [newTemplate, setNewTemplate] = useState<Record<string, unknown>>({});
  const [assignTemplateId, setAssignTemplateId] = useState<string | null>(null);
  const [assignTargetUserId, setAssignTargetUserId] = useState('');
  const [assignSlot, setAssignSlot] = useState(1);

  // Hiep Luu
  const [hiepLuuRegs, setHiepLuuRegs] = useState<HiepLuuRegistration[]>([]);

  // Player lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<Profile | null>(null);
  const [lookupTx, setLookupTx] = useState<Transaction[]>([]);
  const [lookupInv, setLookupInv] = useState<(InventoryItem & { shop_items?: ShopItem | null; profiles?: { oc_name: string } | null })[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Bulk grant
  const [bulkGrantItemId, setBulkGrantItemId] = useState('');
  const [bulkGrantLoading, setBulkGrantLoading] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmDetails, setConfirmDetails] = useState<{ label: string; value: string }[]>([]);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => Promise.resolve());

  const showMsg = (m: string, isError = false) => {
    setMsg(isError ? `Lỗi: ${m}` : m);
    setTimeout(() => setMsg(''), 4000);
  };

  const requireConfirm = (title: string, message: string, action: () => Promise<void>, details?: { label: string; value: string }[]) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmDetails(details || []);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const logAction = async (action: string, targetUserId?: string, targetDesc?: string, details?: Record<string, unknown>) => {
    if (!user) return;
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action,
      target_user_id: targetUserId || null,
      target_description: targetDesc || null,
      details: details || null,
    });
  };

  const toggleRegistration = async () => {
    const newVal = !registrationOpen;
    const { error } = await supabase.from('registration_settings').update({ is_open: newVal }).eq('id', 1);
    if (error) { showMsg(error.message, true); return; }
    setRegistrationOpen(newVal);
    logAction('toggle_registration', undefined, `${newVal ? 'Mở' : 'Đóng'} đăng ký tài khoản`);
    showMsg(`Đã ${newVal ? 'mở' : 'đóng'} đăng ký.`);
  };

  const toggleRevealPwd = (id: string) => {
    setRevealPwd(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePwdHistory = async (id: string) => {
    if (showPwdHistory[id]) {
      setShowPwdHistory(prev => ({ ...prev, [id]: false }));
      return;
    }
    const { data } = await supabase.from('password_history').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(10);
    if (data) setPwdHistory(prev => ({ ...prev, [id]: data as PasswordHistoryEntry[] }));
    setShowPwdHistory(prev => ({ ...prev, [id]: true }));
  };

  const handleSavePassword = async (userId: string) => {
    if (!newPwd || newPwd.length < 6) { showMsg('Mật khẩu phải có ít nhất 6 ký tự.', true); return; }
    const { error } = await supabase.rpc('admin_update_password', { p_user_id: userId, p_new_password: newPwd });
    if (error) { showMsg(error.message, true); return; }
    logAction('change_password', userId, 'Đổi mật khẩu người dùng');
    showMsg('Đã đổi mật khẩu thành công.');
    setEditingPwd(null);
    setNewPwd('');
    togglePwdHistory(userId);
  };

  const handleStatusUpdate = async (userId: string, field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => {
    const { error } = await supabase.rpc('admin_update_status', { p_user_id: userId, p_field: field, p_value: value });
    if (error) { showMsg(error.message, true); return; }
    const p = approvedProfiles.find(pp => pp.id === userId);
    const fieldLabel = field === 'status_physical' ? 'Thể Chất' : field === 'status_spiritual' ? 'Tâm Linh' : 'Tinh Thần';
    logAction('update_status', userId, `Cập nhật ${fieldLabel} của ${p?.oc_name || 'người chơi'}`, { field, value });
    setApprovedProfiles(prev => prev.map(pp => pp.id === userId ? { ...pp, [field]: value } : pp));
    setStatusMsg('Đã cập nhật trạng thái.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
    if (error) { showMsg(error.message, true); return; }
    logAction('delete_user', userId, 'Xóa tài khoản người dùng');
    showMsg('Đã xóa tài khoản.');
    fetchAllData();
  };

  const handleApproveUser = async (userId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('admin_approve_user', { p_user_id: userId, p_admin_id: user.id });
    if (error) { showMsg(error.message, true); return; }
    const p = pendingProfiles.find(pp => pp.id === userId);
    logAction('approve_user', userId, `Duyệt tài khoản ${p?.oc_name || ''}`);
    showMsg('Đã duyệt tài khoản.');
    fetchAllData();
  };

  const handleRejectUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) { showMsg(error.message, true); return; }
    const p = pendingProfiles.find(pp => pp.id === userId);
    logAction('reject_user', userId, `Từ chối tài khoản ${p?.oc_name || ''}`);
    showMsg('Đã từ chối tài khoản.');
    fetchAllData();
  };

  const handleToggleDisable = async (userId: string, currentDisabled: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_disabled: !currentDisabled }).eq('id', userId);
    if (error) { showMsg(error.message, true); return; }
    const p = allProfiles.find(pp => pp.id === userId);
    logAction(!currentDisabled ? 'disable_user' : 'enable_user', userId, `${!currentDisabled ? 'Vô hiệu' : 'Kích hoạt'} tài khoản ${p?.oc_name || ''}`);
    showMsg(`Đã ${!currentDisabled ? 'vô hiệu' : 'kích hoạt'} tài khoản.`);
    fetchAllData();
  };

  // Shop handlers
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category || newItem.price == null) { showMsg('Vui lòng điền đủ tên, nhóm, giá.', true); return; }
    const { error } = await supabase.from('shop_items').insert(newItem);
    if (error) { showMsg(error.message, true); return; }
    logAction('add_shop_item', undefined, `Thêm vật phẩm "${newItem.name}"`);
    showMsg('Đã thêm vật phẩm.');
    setShowAddItem(false);
    setNewItem({});
    fetchAllData();
  };

  const handleEditItem = (item: ShopItem) => {
    setEditingItemId(item.id);
    setEditItemDraft(item);
  };

  const handleSaveEditItem = async (id: string) => {
    const { error } = await supabase.from('shop_items').update(editItemDraft).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('edit_shop_item', undefined, `Sửa vật phẩm "${editItemDraft.name || ''}"`);
    showMsg('Đã lưu vật phẩm.');
    setEditingItemId(null);
    setEditItemDraft({});
    fetchAllData();
  };

  const handleDeleteItem = async (id: string, name: string) => {
    requireConfirm('Xóa vật phẩm', `Xóa "${name}" khỏi cửa hàng?`, async () => {
      const { error } = await supabase.from('shop_items').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logAction('delete_shop_item', undefined, `Xóa vật phẩm "${name}"`);
      showMsg('Đã xóa vật phẩm.');
      fetchAllData();
    });
  };

  // Page handlers
  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPage.title || !newPage.category || newPage.page_number == null) { showMsg('Vui lòng điền đủ số trang, tiêu đề, nhóm.', true); return; }
    const { error } = await supabase.from('site_pages').insert(newPage);
    if (error) { showMsg(error.message, true); return; }
    logAction('add_page', undefined, `Thêm trang "${newPage.title}"`);
    showMsg('Đã thêm trang.');
    setShowAddPage(false);
    setNewPage({});
    fetchAllData();
  };

  const handleEditPage = (page: SitePage) => {
    setEditingPageId(page.id);
    setEditPageDraft(page);
  };

  const handleSaveEditPage = async (id: string) => {
    const { error } = await supabase.from('site_pages').update(editPageDraft).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('edit_page', undefined, `Sửa trang "${editPageDraft.title || ''}"`);
    showMsg('Đã lưu trang.');
    setEditingPageId(null);
    setEditPageDraft({});
    fetchAllData();
  };

  const handleDeletePage = async (id: string, title: string) => {
    requireConfirm('Xóa trang', `Xóa trang "${title}"?`, async () => {
      const { error } = await supabase.from('site_pages').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logAction('delete_page', undefined, `Xóa trang "${title}"`);
      showMsg('Đã xóa trang.');
      fetchAllData();
    });
  };

  // Wanted handlers
  const handleApproveWanted = async (id: string) => {
    const { error } = await supabase.from('wanted_notices').update({ status: 'approved', published_at: new Date().toISOString() }).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('approve_wanted', undefined, `Duyệt truy nã`);
    showMsg('Đã duyệt truy nã.');
    fetchAllData();
  };

  const handleRejectWanted = async (id: string) => {
    const { error } = await supabase.from('wanted_notices').update({ status: 'rejected' }).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('reject_wanted', undefined, `Từ chối truy nã`);
    showMsg('Đã từ chối truy nã.');
    fetchAllData();
  };

  // Kim Bang handlers
  const handleAddKimBang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKimBang.identity_name) { showMsg('Vui lòng nhập tên.', true); return; }
    const { error } = await supabase.from('kim_bang').insert(newKimBang);
    if (error) { showMsg(error.message, true); return; }
    logAction('add_kimbang', undefined, `Thêm kim bảng "${newKimBang.identity_name}"`);
    showMsg('Đã thêm kim bảng.');
    setShowAddKimBang(false);
    setNewKimBang({});
    fetchAllData();
  };

  const handleEditKimBang = (entry: KimBangEntry) => {
    setEditingKimBangId(entry.id);
    setEditKimBangDraft(entry);
  };

  const handleSaveEditKimBang = async (id: string) => {
    const { error } = await supabase.from('kim_bang').update(editKimBangDraft).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('edit_kimbang', undefined, `Sửa kim bảng "${editKimBangDraft.identity_name || ''}"`);
    showMsg('Đã lưu kim bảng.');
    setEditingKimBangId(null);
    setEditKimBangDraft({});
    fetchAllData();
  };

  const handleDeleteKimBang = async (id: string, name: string) => {
    requireConfirm('Xóa kim bảng', `Xóa "${name}"?`, async () => {
      const { error } = await supabase.from('kim_bang').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logAction('delete_kimbang', undefined, `Xóa kim bảng "${name}"`);
      showMsg('Đã xóa kim bảng.');
      fetchAllData();
    });
  };

  // Title handlers
  const handleAddTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.name || !newTitle.color) { showMsg('Vui lòng nhập tên và màu.', true); return; }
    const { error } = await supabase.from('titles').insert(newTitle);
    if (error) { showMsg(error.message, true); return; }
    logAction('add_title', undefined, `Thêm danh hiệu "${newTitle.name}"`);
    showMsg('Đã thêm danh hiệu.');
    setShowAddTitle(false);
    setNewTitle({});
    fetchAllData();
  };

  const handleEditTitle = (t: Title) => {
    setEditingTitleId(t.id);
    setEditTitleDraft(t);
  };

  const handleSaveEditTitle = async (id: string) => {
    const { error } = await supabase.from('titles').update(editTitleDraft).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('edit_title', undefined, `Sửa danh hiệu "${editTitleDraft.name || ''}"`);
    showMsg('Đã lưu danh hiệu.');
    setEditingTitleId(null);
    setEditTitleDraft({});
    fetchAllData();
  };

  const handleDeleteTitle = async (id: string, name: string) => {
    requireConfirm('Xóa danh hiệu', `Xóa danh hiệu "${name}"?`, async () => {
      const { error } = await supabase.from('titles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logAction('delete_title', undefined, `Xóa danh hiệu "${name}"`);
      showMsg('Đã xóa danh hiệu.');
      fetchAllData();
    });
  };

  const handleGrantTitle = async () => {
    if (!grantTitleUserId || !grantTitleId) { showMsg('Vui lòng chọn người chơi và danh hiệu.', true); return; }
    if (!user) return;
    const { error } = await supabase.from('user_titles').insert({ user_id: grantTitleUserId, title_id: grantTitleId, granted_by: user.id });
    if (error) { showMsg(error.message, true); return; }
    const p = allProfiles.find(pp => pp.id === grantTitleUserId);
    const t = titles.find(tt => tt.id === grantTitleId);
    logAction('grant_title', grantTitleUserId, `Cấp danh hiệu "${t?.name || ''}" cho ${p?.oc_name || ''}`);
    showMsg('Đã cấp danh hiệu.');
    setGrantTitleUserId('');
    setGrantTitleId('');
    fetchAllData();
  };

  const handleToggleTitleDisplay = async (utId: string, current: boolean) => {
    const { error } = await supabase.from('user_titles').update({ is_displayed: !current }).eq('id', utId);
    if (error) { showMsg(error.message, true); return; }
    showMsg('Đã thay đổi hiển thị danh hiệu.');
    fetchAllData();
  };

  const handleRevokeTitle = async (utId: string, userName: string, titleName: string) => {
    requireConfirm('Thu hồi danh hiệu', `Thu hồi "${titleName}" khỏi ${userName}?`, async () => {
      const { error } = await supabase.from('user_titles').delete().eq('id', utId);
      if (error) throw new Error(error.message);
      logAction('revoke_title', undefined, `Thu hồi danh hiệu "${titleName}" khỏi ${userName}`);
      showMsg('Đã thu hồi danh hiệu.');
      fetchAllData();
    });
  };

  // Coupon handlers
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || newCoupon.discount_percent == null) { showMsg('Vui lòng nhập mã và % giảm.', true); return; }
    if (!user) return;
    const { error } = await supabase.from('coupons').insert({ ...newCoupon, created_by: user.id });
    if (error) { showMsg(error.message, true); return; }
    logAction('add_coupon', undefined, `Thêm mã giảm "${newCoupon.code}"`);
    showMsg('Đã thêm mã giảm.');
    setShowAddCoupon(false);
    setNewCoupon({});
    fetchAllData();
  };

  const handleEditCoupon = (c: Coupon) => {
    setEditingCouponId(c.id);
    setEditCouponDraft(c);
  };

  const handleSaveEditCoupon = async (id: string) => {
    const { error } = await supabase.from('coupons').update(editCouponDraft).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('edit_coupon', undefined, `Sửa mã giảm "${editCouponDraft.code || ''}"`);
    showMsg('Đã lưu mã giảm.');
    setEditingCouponId(null);
    setEditCouponDraft({});
    fetchAllData();
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    requireConfirm('Xóa mã giảm', `Xóa mã "${code}"?`, async () => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logAction('delete_coupon', undefined, `Xóa mã giảm "${code}"`);
      showMsg('Đã xóa mã giảm.');
      fetchAllData();
    });
  };

  const handleToggleCoupon = async (id: string, current: boolean) => {
    const { error } = await supabase.from('coupons').update({ is_active: !current }).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    showMsg('Đã thay đổi trạng thái mã giảm.');
    fetchAllData();
  };

  // Skill template handlers
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, category, cong_duc_cost, am_duc_cost, mental_duration, health_duration, spiritual_duration, destruction_percent } = newTemplate as Record<string, unknown>;
    if (!name) { setTemplateMsg('Vui lòng nhập tên kỹ năng.'); return; }
    const insertData = {
      name: String(name || ''),
      usage_detail: String((newTemplate as Record<string, unknown>).usage_detail || ''),
      effect: String((newTemplate as Record<string, unknown>).effect || ''),
      tradeoff: String((newTemplate as Record<string, unknown>).tradeoff || ''),
      cong_duc_cost: Number(cong_duc_cost || 0),
      am_duc_cost: Number(am_duc_cost || 0),
      duration: String((newTemplate as Record<string, unknown>).duration || ''),
      mental_effect: String((newTemplate as Record<string, unknown>).mental_effect || ''),
      mental_duration: Number(mental_duration || 0),
      health_effect: String((newTemplate as Record<string, unknown>).health_effect || ''),
      health_duration: Number(health_duration || 0),
      spiritual_effect: String((newTemplate as Record<string, unknown>).spiritual_effect || ''),
      spiritual_duration: Number(spiritual_duration || 0),
      ghost_level_effect: String((newTemplate as Record<string, unknown>).ghost_level_effect || ''),
      destruction_percent: Number(destruction_percent || 0),
      category: String(category || ''),
      oc_name: String((newTemplate as Record<string, unknown>).oc_name || ''),
    };
    const { error } = await supabase.from('skill_templates').insert(insertData);
    if (error) { setTemplateMsg(`Lỗi: ${error.message}`); return; }
    setTemplateMsg('Đã thêm mẫu kỹ năng.');
    setShowAddTemplate(false);
    setNewTemplate({});
    fetchAllData();
  };

  const handleEditTemplate = (t: SkillTemplate) => {
    setEditingTemplateId(t.id);
    setEditTemplate(t);
  };

  const handleSaveEditTemplate = async (id: string) => {
    const { error } = await supabase.from('skill_templates').update(editTemplate).eq('id', id);
    if (error) { setTemplateMsg(`Lỗi: ${error.message}`); return; }
    setTemplateMsg('Đã lưu mẫu kỹ năng.');
    setEditingTemplateId(null);
    setEditTemplate({});
    fetchAllData();
  };

  const handleApproveTemplate = async (id: string) => {
    const { error } = await supabase.from('skill_templates').update({ phe_duyet: 'Đã duyệt' }).eq('id', id);
    if (error) { setTemplateMsg(`Lỗi: ${error.message}`); return; }
    setTemplateMsg('Đã duyệt mẫu kỹ năng.');
    fetchAllData();
  };

  const handleRejectTemplate = async (id: string) => {
    const { error } = await supabase.from('skill_templates').update({ phe_duyet: 'Chưa duyệt' }).eq('id', id);
    if (error) { setTemplateMsg(`Lỗi: ${error.message}`); return; }
    setTemplateMsg('Đã hủy duyệt mẫu kỹ năng.');
    fetchAllData();
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    requireConfirm('Xóa mẫu kỹ năng', `Xóa "${name}"?`, async () => {
      const { error } = await supabase.from('skill_templates').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setTemplateMsg('Đã xóa mẫu kỹ năng.');
      fetchAllData();
    });
  };

  const handleAssignTemplate = async () => {
    if (!assignTemplateId || !assignTargetUserId) { setTemplateMsg('Vui lòng chọn mẫu và người chơi.'); return; }
    const template = skillTemplates.find(t => t.id === assignTemplateId);
    if (!template) return;
    const { error } = await supabase.from('character_skills').insert({
      user_id: assignTargetUserId,
      slot: assignSlot,
      name: template.name,
      usage_detail: template.usage_detail,
      effect: template.effect,
      tradeoff: template.tradeoff,
      cong_duc_cost: template.cong_duc_cost,
      am_duc_cost: template.am_duc_cost,
      duration: template.duration,
      mental_effect: template.mental_effect,
      mental_duration: template.mental_duration,
      health_effect: template.health_effect,
      health_duration: template.health_duration,
      spiritual_effect: template.spiritual_effect,
      spiritual_duration: template.spiritual_duration,
      ghost_level_effect: template.ghost_level_effect,
      destruction_percent: template.destruction_percent,
    });
    if (error) { setTemplateMsg(`Lỗi: ${error.message}`); return; }
    setTemplateMsg('Đã cấp kỹ năng thành công.');
    setAssignTemplateId(null);
    setAssignTargetUserId('');
    fetchSkillsForUser(assignTargetUserId);
  };

  const fetchSkillsForUser = useCallback((userId: string) => {
    supabase.from('character_skills').select('*').eq('user_id', userId).order('slot', { ascending: true }).then(({ data }) => {
      setAllSkills(prev => ({ ...prev, [userId]: data || [] }));
    });
  }, []);

  // Will handlers
  const handleReviewWill = async (id: string, status: WillStatus, note?: string) => {
    if (!user) return;
    const { error } = await supabase.from('wills').update({
      status,
      reviewer_id: user.id,
      reviewer_name: profile?.oc_name || user.email,
      reviewed_at: new Date().toISOString(),
      admin_note: note || null,
    }).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('review_will', undefined, `Duyệt di chúc với trạng thái: ${status}`);
    showMsg('Đã cập nhật di chúc.');
    fetchAllData();
  };

  // Hiep Luu handlers
  const handleReviewHiepLuu = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    if (!user) return;
    const { error } = await supabase.from('hiep_luu_registrations').update({
      status,
      reviewer_id: user.id,
      reviewer_name: profile?.oc_name || user.email,
      reviewed_at: new Date().toISOString(),
      admin_note: note || null,
    }).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('review_hiep_luu', undefined, `Duyệt hiệp lưu: ${status}`);
    showMsg('Đã cập nhật hiệp lưu.');
    fetchAllData();
  };

  // Broadcast handler
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim()) { showMsg('Vui lòng nhập tiêu đề.', true); return; }
    setBroadcastSending(true);
    const { error } = await supabase.from('notifications').insert({
      title: broadcastTitle.trim(),
      body: broadcastBody.trim() || null,
      link: broadcastLink.trim() || null,
      type: 'broadcast',
      recipient_id: null,
    });
    setBroadcastSending(false);
    if (error) { showMsg(error.message, true); return; }
    logAction('broadcast', undefined, `Gửi thông báo: ${broadcastTitle}`);
    showMsg('Đã gửi thông báo đến tất cả người dùng.');
    setBroadcastTitle('');
    setBroadcastBody('');
    setBroadcastLink('');
  };

  // Bulk grant
  const handleBulkGrant = async () => {
    if (!bulkGrantItemId) { showMsg('Vui lòng chọn vật phẩm.', true); return; }
    setBulkGrantLoading(true);
    let success = 0;
    for (const p of approvedProfiles) {
      const { error } = await supabase.rpc('admin_grant_inventory_item', { p_user_id: p.id, p_item_id: bulkGrantItemId });
      if (!error) success++;
    }
    setBulkGrantLoading(false);
    logAction('bulk_grant_item', undefined, `Cấp vật phẩm cho ${success} người chơi`, { item_id: bulkGrantItemId, count: success });
    showMsg(`Đã cấp vật phẩm cho ${success} người chơi.`);
    setBulkGrantItemId('');
  };

  // Player lookup
  const handleLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    const q = lookupQuery.trim();
    const { data } = await supabase.from('profiles').select('*').or(`oc_name.ilike.%${q}%,email.ilike.%${q}%,anonymous_name.ilike.%${q}%`).limit(1).maybeSingle();
    if (data) {
      const p = data as Profile;
      setLookupResult(p);
      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*, profiles(oc_name, email)').eq('user_id', p.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('inventories').select('*, shop_items(name, category), profiles(oc_name)').eq('user_id', p.id).order('acquired_at', { ascending: false }),
      ]);
      if (txRes.data) setLookupTx(txRes.data as Transaction[]);
      if (invRes.data) setLookupInv(invRes.data as (InventoryItem & { shop_items?: ShopItem | null; profiles?: { oc_name: string } | null })[]);
    } else {
      setLookupResult(null);
      setLookupTx([]);
      setLookupInv([]);
    }
    setLookupLoading(false);
  };

  // Transaction edit
  const handleSaveEditTx = async (id: string) => {
    const { error } = await supabase.from('transactions').update(editTxDraft).eq('id', id);
    if (error) { showMsg(error.message, true); return; }
    logAction('edit_transaction', undefined, 'Sửa giao dịch');
    showMsg('Đã lưu giao dịch.');
    setEditingTxId(null);
    setEditTxDraft({});
    fetchAllData();
  };

  const handleDeleteTx = async (id: string) => {
    requireConfirm('Xóa giao dịch', 'Xóa giao dịch này?', async () => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logAction('delete_transaction', undefined, 'Xóa giao dịch');
      showMsg('Đã xóa giao dịch.');
      fetchAllData();
    });
  };

  const handleUndoAction = async (logId: string, action: string, targetUserId: string | null) => {
    const { error } = await supabase.rpc('admin_undo_action', { p_log_id: logId, p_action: action, p_target_user_id: targetUserId });
    if (error) { showMsg(error.message, true); return; }
    logAction('undo_action', targetUserId || undefined, `Hoàn tác hành động: ${action}`);
    showMsg('Đã hoàn tác hành động.');
    fetchAllData();
  };

  const handleExportAuth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-export-auth');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        showMsg('Đã xuất danh sách tài khoản.');
      }
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Lỗi xuất dữ liệu.', true);
    }
  };

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [
      pendingRes, approvedRes, allRes, shopRes, pagesRes, txRes, auditRes,
      wantedRes, kimBangRes, wheelRes, willsRes, bachHoaRes, bachHoaVotesRes,
      orgRes, titlesRes, userTitlesRes, couponsRes, templatesRes,
      regSettingsRes, hiepLuuRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('shop_items').select('*').order('created_at', { ascending: false }),
      supabase.from('site_pages').select('*').order('page_number', { ascending: true }),
      supabase.from('transactions').select('*, profiles(oc_name, email)').order('created_at', { ascending: false }).limit(200),
      supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('wanted_notices').select('*').order('created_at', { ascending: false }),
      supabase.from('kim_bang').select('*').order('rank', { ascending: true }),
      supabase.from('wheel_spin_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('wills').select('*').order('created_at', { ascending: false }),
      supabase.from('bach_hoa_trieu_phung').select('*').order('created_at', { ascending: false }),
      supabase.from('bach_hoa_votes').select('*, profiles(oc_name, anonymous_name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('organizations').select('*').order('created_at', { ascending: false }),
      supabase.from('titles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_titles').select('*, titles(*), profiles(oc_name)').order('granted_at', { ascending: false }),
      supabase.from('coupons').select('*, profiles(oc_name)').order('created_at', { ascending: false }),
      supabase.from('skill_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('registration_settings').select('*').limit(1).maybeSingle(),
      supabase.from('hiep_luu_registrations').select('*, profiles(oc_name, anonymous_name, avatar_url)').order('created_at', { ascending: false }),
    ]);

    if (pendingRes.data) setPendingProfiles(pendingRes.data as Profile[]);
    if (approvedRes.data) setApprovedProfiles(approvedRes.data as Profile[]);
    if (allRes.data) setAllProfiles(allRes.data as Profile[]);
    if (shopRes.data) setShopItems(shopRes.data as ShopItem[]);
    if (pagesRes.data) setSitePages(pagesRes.data as SitePage[]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (auditRes.data) setAuditLogs(auditRes.data as AuditLog[]);
    if (wantedRes.data) setWantedNotices(wantedRes.data as WantedNotice[]);
    if (kimBangRes.data) setKimBang(kimBangRes.data as KimBangEntry[]);
    if (wheelRes.data) setWheelLogs(wheelRes.data as WheelSpinLog[]);
    if (willsRes.data) setWills(willsRes.data as Will[]);
    if (bachHoaRes.data) setBachHoaEntries(bachHoaRes.data as BachHoaEntry[]);
    if (bachHoaVotesRes.data) setBachHoaVotes(bachHoaVotesRes.data as BachHoaVote[]);
    if (orgRes.data) setOrganizations(orgRes.data as Organization[]);
    if (titlesRes.data) setTitles(titlesRes.data as Title[]);
    if (userTitlesRes.data) setUserTitles(userTitlesRes.data as UserTitle[]);
    if (couponsRes.data) setCoupons(couponsRes.data as Coupon[]);
    if (templatesRes.data) setSkillTemplates(templatesRes.data as SkillTemplate[]);
    if (regSettingsRes.data) setRegistrationOpen((regSettingsRes.data as Record<string, unknown>)?.is_open as boolean ?? true);
    if (hiepLuuRes.data) setHiepLuuRegs(hiepLuuRes.data as HiepLuuRegistration[]);

    // Fetch org members and treasuries
    if (orgRes.data) {
      const orgs = orgRes.data as Organization[];
      for (const org of orgs) {
        supabase.from('organization_members').select('*, profiles(oc_name)').eq('organization_id', org.id).then(({ data }) => {
          if (data) setOrgMembers(prev => ({ ...prev, [org.id]: data as OrganizationMember[] }));
        });
        supabase.from('organization_treasuries').select('*').eq('organization_id', org.id).maybeSingle().then(({ data }) => {
          if (data) setOrgTreasuries(prev => ({ ...prev, [org.id]: data as OrgTreasury }));
        });
        supabase.from('organization_treasury_logs').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => {
          if (data) setOrgTreasuryLogs(prev => ({ ...prev, [org.id]: data as OrgTreasuryLog[] }));
        });
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAllData();
  }, [isAdmin, fetchAllData]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <LotusIcon className="w-7 h-7 text-amber-300/70" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100/90">Bảng Quản Trị</h1>
        </div>
        <p className="text-xs text-gray-500">Quản lý hệ thống Trùng Hoan Tái</p>
      </div>

      {/* Message */}
      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${msg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
          {msg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {msg}
        </div>
      )}

      {/* Tab navigation */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === id
                ? 'bg-[#670201]/40 text-amber-100 border border-[#670201]/40'
                : 'bg-black/20 text-gray-500 hover:text-gray-300 border border-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'accounts' && (
        <div className="space-y-4">
          {/* Registration toggle */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {registrationOpen ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-red-400" />}
                <div>
                  <h3 className="text-sm font-serif font-bold text-amber-100/80">Đăng Ký Tài Khoản</h3>
                  <p className="text-xs text-gray-500">{registrationOpen ? 'Đang mở' : 'Đang đóng'}</p>
                </div>
              </div>
              <button onClick={toggleRegistration} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-200 transition-all">
                {registrationOpen ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                {registrationOpen ? 'Đang mở' : 'Đang đóng'}
              </button>
            </div>
          </div>

          {/* Pending accounts */}
          {pendingProfiles.length > 0 && (
            <div className={cardCls}>
              <div className="flex items-center gap-2 mb-4">
                <UserCog className="w-5 h-5 text-amber-300/70" />
                <h3 className="text-base font-serif font-bold text-amber-100/80">Tài Khoản Chờ Duyệt ({pendingProfiles.length})</h3>
              </div>
              <div className="space-y-2">
                {pendingProfiles.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                    <Avatar src={p.avatar_url} alt={p.oc_name} className="w-10 h-10 flex-shrink-0" iconClassName="w-5 h-5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-amber-100/90 truncate">{p.oc_name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email} · {p.gender}</p>
                    </div>
                    <button onClick={() => handleApproveUser(p.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all">
                      <Check className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={() => handleRejectUser(p.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved accounts */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-300/70" />
                <h3 className="text-base font-serif font-bold text-amber-100/80">Tài Khoản Đã Duyệt ({approvedProfiles.length})</h3>
              </div>
              <button onClick={handleExportAuth} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-all">
                <Download className="w-3.5 h-3.5" /> Xuất DS
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {approvedProfiles.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                  <Avatar src={p.avatar_url} alt={p.oc_name} className="w-10 h-10 flex-shrink-0" iconClassName="w-5 h-5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-amber-100/90 truncate">{p.oc_name}</p>
                      {p.is_disabled && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">Vô hiệu</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-amber-300">🪙 {p.hua_tien}</span>
                      <span className="text-[10px] text-cyan-300">功德 {p.cong_duc}</span>
                      <span className="text-[10px] text-purple-300">陰德 {p.am_duc}</span>
                      <span className="text-[10px] text-gray-600">· {new Date(p.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleDisable(p.id, p.is_disabled)} className={`p-1.5 rounded-lg transition-all ${p.is_disabled ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`} title={p.is_disabled ? 'Kích hoạt' : 'Vô hiệu'}>
                      {p.is_disabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => toggleRevealPwd(p.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all" title="Hiện mật khẩu">
                      {revealPwd[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {revealPwd[p.id] && (
                      <span className="text-xs font-mono text-amber-100/80 px-2">{p.password || '(không có)'}</span>
                    )}
                    <button onClick={() => { setEditingPwd(editingPwd === p.id ? null : p.id); setNewPwd(''); }} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all" title="Đổi mật khẩu">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => togglePwdHistory(p.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all" title="Lịch sử mật khẩu">
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => requireConfirm('Xóa tài khoản', `Xóa tài khoản "${p.oc_name}"? Hành động này không thể hoàn tác.`, async () => {
                      const { error } = await supabase.rpc('admin_delete_user', { p_user_id: p.id });
                      if (error) throw new Error(error.message);
                      logAction('delete_user', p.id, `Xóa tài khoản ${p.oc_name}`);
                      showMsg('Đã xóa tài khoản.');
                      fetchAllData();
                    }, [{ label: 'Tên', value: p.oc_name }, { label: 'Email', value: p.email }])} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all" title="Xóa">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {editingPwd === p.id && (
                    <div className="w-full mt-2 flex items-center gap-2">
                      <input type="text" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mật khẩu mới (≥6 ký tự)" className={`${inputCls} flex-1`} />
                      <button onClick={() => handleSavePassword(p.id)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all">
                        <Save className="w-3.5 h-3.5" /> Lưu
                      </button>
                      <button onClick={() => { setEditingPwd(null); setNewPwd(''); }} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">Hủy</button>
                    </div>
                  )}
                  {showPwdHistory[p.id] && pwdHistory[p.id] && (
                    <div className="w-full mt-2 p-2 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Lịch sử mật khẩu</p>
                      {pwdHistory[p.id].map(h => (
                        <div key={h.id} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-gray-300">{h.new_password}</span>
                          <span className="text-gray-600">{new Date(h.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'archive' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Archive className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Tài Khoản Lưu Trữ</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Tất cả tài khoản trong hệ thống.</p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {allProfiles.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                <Avatar src={p.avatar_url} alt={p.oc_name} className="w-8 h-8 flex-shrink-0" iconClassName="w-4 h-4" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{p.oc_name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.email}</p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${p.is_approved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                  {p.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}
                </span>
                {p.is_disabled && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">Vô hiệu</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-300/70" />
                <h3 className="text-base font-serif font-bold text-amber-100/80">Cửa Hàng ({shopItems.length})</h3>
              </div>
              <button onClick={() => setShowAddItem(!showAddItem)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-xs font-bold transition-all">
                <Plus className="w-3.5 h-3.5" /> Thêm vật phẩm
              </button>
            </div>

            {showAddItem && (
              <form onSubmit={handleAddItem} className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tên</label>
                    <input value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className={inputCls} placeholder="Tên vật phẩm..." />
                  </div>
                  <div>
                    <label className={labelCls}>Nhóm</label>
                    <input value={newItem.category || ''} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className={inputCls} placeholder="Nhóm..." />
                  </div>
                  <div>
                    <label className={labelCls}>Giá</label>
                    <input type="number" value={newItem.price ?? ''} onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Loại tiền</label>
                    <select value={newItem.currency_type || 'HUA_TIEN'} onChange={e => setNewItem({ ...newItem, currency_type: e.target.value })} className={inputCls}>
                      <option value="HUA_TIEN">Hoa Tiền</option>
                      <option value="CONG_DUC">Công Đức</option>
                      <option value="AM_DUC">Âm Đức</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tồn kho</label>
                    <input type="number" value={newItem.stock ?? ''} onChange={e => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Khu vực</label>
                    <input value={newItem.shop_area || ''} onChange={e => setNewItem({ ...newItem, shop_area: e.target.value })} className={inputCls} placeholder="Khu vực..." />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mô tả</label>
                  <textarea value={newItem.description || ''} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className={inputCls} rows={2} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                    <Save className="w-4 h-4" /> Lưu
                  </button>
                  <button type="button" onClick={() => setShowAddItem(false)} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold">Hủy</button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {shopItems.map(item => (
                <div key={item.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  {editingItemId === item.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={editItemDraft.name || ''} onChange={e => setEditItemDraft({ ...editItemDraft, name: e.target.value })} className={inputCls} placeholder="Tên" />
                        <input value={editItemDraft.category || ''} onChange={e => setEditItemDraft({ ...editItemDraft, category: e.target.value })} className={inputCls} placeholder="Nhóm" />
                        <input type="number" value={editItemDraft.price ?? 0} onChange={e => setEditItemDraft({ ...editItemDraft, price: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Giá" />
                        <select value={editItemDraft.currency_type || 'HUA_TIEN'} onChange={e => setEditItemDraft({ ...editItemDraft, currency_type: e.target.value })} className={inputCls}>
                          <option value="HUA_TIEN">Hoa Tiền</option>
                          <option value="CONG_DUC">Công Đức</option>
                          <option value="AM_DUC">Âm Đức</option>
                        </select>
                        <input type="number" value={editItemDraft.stock ?? 0} onChange={e => setEditItemDraft({ ...editItemDraft, stock: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Tồn kho" />
                        <input value={editItemDraft.shop_area || ''} onChange={e => setEditItemDraft({ ...editItemDraft, shop_area: e.target.value })} className={inputCls} placeholder="Khu vực" />
                      </div>
                      <textarea value={editItemDraft.description || ''} onChange={e => setEditItemDraft({ ...editItemDraft, description: e.target.value })} className={inputCls} rows={2} placeholder="Mô tả" />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEditItem(item.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all">
                          <Save className="w-3.5 h-3.5" /> Lưu
                        </button>
                        <button onClick={() => { setEditingItemId(null); setEditItemDraft({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-amber-100/90 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category} · {item.price} {CURRENCY_LABELS[item.currency_type]} · Kho: {item.stock}</p>
                      </div>
                      <button onClick={() => handleEditItem(item)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id, item.name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'pages' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base font-serif font-bold text-amber-100/80">Trang Nội Dung ({sitePages.length})</h3>
            </div>
            <button onClick={() => setShowAddPage(!showAddPage)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-xs font-bold transition-all">
              <Plus className="w-3.5 h-3.5" /> Thêm trang
            </button>
          </div>

          {showAddPage && (
            <form onSubmit={handleAddPage} className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Số trang</label>
                  <input type="number" value={newPage.page_number ?? ''} onChange={e => setNewPage({ ...newPage, page_number: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tiêu đề</label>
                  <input value={newPage.title || ''} onChange={e => setNewPage({ ...newPage, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nhóm</label>
                  <input value={newPage.category || ''} onChange={e => setNewPage({ ...newPage, category: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Nội dung</label>
                <textarea value={newPage.content || ''} onChange={e => setNewPage({ ...newPage, content: e.target.value })} className={inputCls} rows={4} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                  <Save className="w-4 h-4" /> Lưu
                </button>
                <button type="button" onClick={() => setShowAddPage(false)} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold">Hủy</button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sitePages.map(page => (
              <div key={page.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                {editingPageId === page.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="number" value={editPageDraft.page_number ?? 0} onChange={e => setEditPageDraft({ ...editPageDraft, page_number: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Số trang" />
                      <input value={editPageDraft.title || ''} onChange={e => setEditPageDraft({ ...editPageDraft, title: e.target.value })} className={inputCls} placeholder="Tiêu đề" />
                      <input value={editPageDraft.category || ''} onChange={e => setEditPageDraft({ ...editPageDraft, category: e.target.value })} className={inputCls} placeholder="Nhóm" />
                    </div>
                    <textarea value={editPageDraft.content || ''} onChange={e => setEditPageDraft({ ...editPageDraft, content: e.target.value })} className={inputCls} rows={4} placeholder="Nội dung" />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEditPage(page.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all">
                        <Save className="w-3.5 h-3.5" /> Lưu
                      </button>
                      <button onClick={() => { setEditingPageId(null); setEditPageDraft({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-amber-100/90 truncate">#{page.page_number} · {page.title}</p>
                      <p className="text-xs text-gray-500">{page.category}</p>
                    </div>
                    <button onClick={() => handleEditPage(page)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeletePage(page.id, page.title)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'wanted' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <FileWarning className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Truy Nã ({wantedNotices.length})</h3>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {wantedNotices.map(w => (
              <div key={w.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-start gap-3">
                  {w.avatar_url && <Avatar src={w.avatar_url} alt={w.target_name} className="w-12 h-12 flex-shrink-0" iconClassName="w-6 h-6" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-amber-100/90">{w.target_name}</p>
                    <p className="text-xs text-gray-500">{w.gender} · {w.age} · {w.occupation}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{w.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        w.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                        w.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                        'bg-yellow-500/15 text-yellow-400'
                      }`}>{w.status}</span>
                      {w.code && <span className="text-[10px] text-gray-600 font-mono">{w.code}</span>}
                    </div>
                  </div>
                  {w.status === 'pending' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleApproveWanted(w.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all">
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button onClick={() => handleRejectWanted(w.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'kimbang' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base font-serif font-bold text-amber-100/80">Kim Bảng ({kimBang.length})</h3>
            </div>
            <button onClick={() => setShowAddKimBang(!showAddKimBang)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-xs font-bold transition-all">
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {showAddKimBang && (
            <form onSubmit={handleAddKimBang} className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Hạng</label>
                  <input type="number" value={newKimBang.rank ?? ''} onChange={e => setNewKimBang({ ...newKimBang, rank: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tên</label>
                  <input value={newKimBang.identity_name || ''} onChange={e => setNewKimBang({ ...newKimBang, identity_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phú</label>
                  <input value={newKimBang.wealth || ''} onChange={e => setNewKimBang({ ...newKimBang, wealth: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nhiệm vụ</label>
                  <input type="number" value={newKimBang.quests_completed ?? ''} onChange={e => setNewKimBang({ ...newKimBang, quests_completed: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Danh hiệu</label>
                  <input value={newKimBang.honor_title || ''} onChange={e => setNewKimBang({ ...newKimBang, honor_title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Avatar URL</label>
                  <input value={newKimBang.avatar_url || ''} onChange={e => setNewKimBang({ ...newKimBang, avatar_url: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Biệt danh</label>
                  <input value={newKimBang.epithet || ''} onChange={e => setNewKimBang({ ...newKimBang, epithet: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                  <Save className="w-4 h-4" /> Lưu
                </button>
                <button type="button" onClick={() => setShowAddKimBang(false)} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold">Hủy</button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {kimBang.map(entry => (
              <div key={entry.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                {editingKimBangId === entry.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input type="number" value={editKimBangDraft.rank ?? 0} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, rank: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Hạng" />
                      <input value={editKimBangDraft.identity_name || ''} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, identity_name: e.target.value })} className={inputCls} placeholder="Tên" />
                      <input value={editKimBangDraft.wealth || ''} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, wealth: e.target.value })} className={inputCls} placeholder="Phú" />
                      <input type="number" value={editKimBangDraft.quests_completed ?? 0} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, quests_completed: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Nhiệm vụ" />
                      <input value={editKimBangDraft.honor_title || ''} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, honor_title: e.target.value })} className={inputCls} placeholder="Danh hiệu" />
                      <input value={editKimBangDraft.avatar_url || ''} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, avatar_url: e.target.value })} className={inputCls} placeholder="Avatar URL" />
                      <input value={editKimBangDraft.epithet || ''} onChange={e => setEditKimBangDraft({ ...editKimBangDraft, epithet: e.target.value })} className={inputCls} placeholder="Biệt danh" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEditKimBang(entry.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all">
                        <Save className="w-3.5 h-3.5" /> Lưu
                      </button>
                      <button onClick={() => { setEditingKimBangId(null); setEditKimBangDraft({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-amber-300/70 flex-shrink-0">#{entry.rank}</span>
                    <Avatar src={entry.avatar_url} alt={entry.identity_name} className="w-9 h-9 flex-shrink-0" iconClassName="w-5 h-5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-amber-100/90 truncate">{entry.identity_name}</p>
                      <p className="text-xs text-gray-500 truncate">{entry.wealth} · {entry.quests_completed} nhiệm vụ · {entry.honor_title}</p>
                    </div>
                    <button onClick={() => handleEditKimBang(entry)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteKimBang(entry.id, entry.identity_name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'bachhoa' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Bách Hoa Triệu Phụng ({bachHoaEntries.length})</h3>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {bachHoaEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                <Avatar src={entry.avatar_url} alt={entry.identity_name} className="w-10 h-10 flex-shrink-0" iconClassName="w-5 h-5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-amber-100/90 truncate">{entry.identity_name}</p>
                  <p className="text-xs text-gray-500 truncate">"{entry.quote}"</p>
                  <p className="text-[10px] text-gray-600">{entry.vote_count} phiếu · {entry.title}</p>
                </div>
              </div>
            ))}
          </div>
          {bachHoaVotes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-2">Lượt vote gần đây:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {bachHoaVotes.map(v => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{v.profiles?.oc_name || v.profiles?.anonymous_name || 'Vô Danh'}</span>
                    <span className="text-gray-600">{new Date(v.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Nhật Ký Quản Trị ({auditLogs.length})</h3>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-100/90">{log.action}</p>
                    {log.target_description && <p className="text-xs text-gray-400 mt-0.5">{log.target_description}</p>}
                    <p className="text-[10px] text-gray-600 mt-1">{log.admin_email || '—'} · {new Date(log.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                  {(log.action === 'adjust_currency' || log.action === 'grant_inventory_item' || log.action === 'grant_spins') && log.target_user_id && (
                    <button onClick={() => handleUndoAction(log.id, log.action, log.target_user_id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold transition-all flex-shrink-0">
                      <Undo2 className="w-3 h-3" /> Hoàn tác
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'lookup' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <UserSearch className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base font-serif font-bold text-amber-100/80">Tra Cứu Người Chơi</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleLookup(); }}
                  placeholder="Nhập tên OC, email, hoặc tên ẩn danh..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              <button onClick={handleLookup} disabled={lookupLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold transition-all disabled:opacity-50">
                {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Tìm
              </button>
            </div>
          </div>

          {lookupResult && (
            <PlayerDetailCard
              profile={lookupResult}
              transactions={lookupTx}
              inventory={lookupInv}
              shopItems={shopItems}
              onBack={() => { setLookupResult(null); setLookupQuery(''); }}
              onStatusUpdate={handleStatusUpdate}
              onRefresh={fetchAllData}
              onLogAction={logAction}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {!lookupResult && lookupQuery && !lookupLoading && (
            <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy người chơi phù hợp.</p>
          )}
        </div>
      )}

      {tab === 'wheel' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Dices className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Lịch Sử Vòng Quay ({wheelLogs.length})</h3>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {wheelLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{log.oc_name || 'Vô Danh'}</p>
                  <p className="text-xs text-gray-500">{log.reward_label} · {log.reward_group}</p>
                </div>
                {log.is_special && <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold">Đặc biệt</span>}
                <span className="text-[10px] text-gray-600">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'wills' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Di Chúc ({wills.length})</h3>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {wills.map(will => (
              <div key={will.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-amber-100/90">{will.author_oc_name || 'Vô Danh'}</p>
                    <p className="text-xs text-gray-500">Thừa kế: {will.heir_oc_name || '—'} · {will.inheritance_type}</p>
                    {will.item_list && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{will.item_list}</p>}
                    <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      will.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                      will.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                      will.status === 'revision_requested' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>{will.status}</span>
                    {will.will_code && <span className="ml-2 text-[10px] text-gray-600 font-mono">{will.will_code}</span>}
                  </div>
                  {will.status === 'pending' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleReviewWill(will.id, 'approved')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all">
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button onClick={() => handleReviewWill(will.id, 'revision_requested')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold transition-all">
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button onClick={() => handleReviewWill(will.id, 'rejected')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Cài Đặt Hệ Thống</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
              <div>
                <p className="text-sm font-semibold text-amber-100/80">Đăng ký tài khoản</p>
                <p className="text-xs text-gray-500">{registrationOpen ? 'Đang mở' : 'Đang đóng'}</p>
              </div>
              <button onClick={toggleRegistration} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-200 transition-all">
                {registrationOpen ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                {registrationOpen ? 'Mở' : 'Đóng'}
              </button>
            </div>
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-sm font-semibold text-amber-100/80 mb-1">Xuất dữ liệu tài khoản</p>
              <p className="text-xs text-gray-500 mb-3">Tải xuống danh sách tài khoản và mật khẩu.</p>
              <button onClick={handleExportAuth} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-sm font-bold transition-all">
                <FileDown className="w-4 h-4" /> Xuất danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'organizations' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Tổ Chức ({organizations.length})</h3>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {organizations.map(org => (
              <div key={org.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-300/70" />
                  <p className="text-sm font-bold text-amber-100/90 truncate flex-1">{org.name}</p>
                  <span className="text-[10px] text-gray-500">{org.category}</span>
                </div>
                {org.description && <p className="text-xs text-gray-400 mb-2">{org.description}</p>}
                <div className="text-xs text-gray-500 mb-2">
                  Thành viên: {orgMembers[org.id]?.length || 0}
                </div>
                {orgTreasuries[org.id] && (
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                    <span className="text-amber-300">🪙 {orgTreasuries[org.id].hua_tien}</span>
                    <span className="text-cyan-300">功德 {orgTreasuries[org.id].cong_duc}</span>
                    <span className="text-purple-300">陰德 {orgTreasuries[org.id].am_duc}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'broadcast' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Gửi Thông Báo Hệ Thống</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Tiêu đề</label>
              <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} className={inputCls} placeholder="Tiêu đề thông báo..." />
            </div>
            <div>
              <label className={labelCls}>Nội dung</label>
              <textarea value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} className={inputCls} rows={4} placeholder="Nội dung thông báo..." />
            </div>
            <div>
              <label className={labelCls}>Liên kết (tùy chọn)</label>
              <input value={broadcastLink} onChange={e => setBroadcastLink(e.target.value)} className={inputCls} placeholder="URL..." />
            </div>
            <button onClick={handleBroadcast} disabled={broadcastSending} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold transition-all disabled:opacity-50">
              {broadcastSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi thông báo
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-amber-300/70" />
              <h4 className="text-sm font-serif font-bold text-amber-100/70">Cấp Vật Phẩm Hàng Loạt</h4>
            </div>
            <div className="flex gap-2">
              <select value={bulkGrantItemId} onChange={e => setBulkGrantItemId(e.target.value)} className={inputCls}>
                <option value="">Chọn vật phẩm...</option>
                {shopItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button onClick={handleBulkGrant} disabled={bulkGrantLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold transition-all disabled:opacity-50 whitespace-nowrap">
                {bulkGrantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Cấp cho tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'titles' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300/70" />
                <h3 className="text-base font-serif font-bold text-amber-100/80">Danh Hiệu ({titles.length})</h3>
              </div>
              <button onClick={() => setShowAddTitle(!showAddTitle)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-xs font-bold transition-all">
                <Plus className="w-3.5 h-3.5" /> Thêm danh hiệu
              </button>
            </div>

            {showAddTitle && (
              <form onSubmit={handleAddTitle} className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tên danh hiệu</label>
                    <input value={newTitle.name || ''} onChange={e => setNewTitle({ ...newTitle, name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Màu</label>
                    <select value={newTitle.color || 'amber'} onChange={e => setNewTitle({ ...newTitle, color: e.target.value })} className={inputCls}>
                      {Object.entries(TITLE_COLORS).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mô tả</label>
                  <textarea value={newTitle.description || ''} onChange={e => setNewTitle({ ...newTitle, description: e.target.value })} className={inputCls} rows={2} />
                </div>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                  <Save className="w-4 h-4" /> Lưu
                </button>
              </form>
            )}

            <div className="space-y-2">
              {titles.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${TITLE_COLORS[t.color]?.badgeClass || TITLE_COLORS.amber.badgeClass}`}>
                    <Award className="w-2.5 h-2.5" /> {t.name}
                  </span>
                  {t.description && <p className="text-xs text-gray-500 truncate flex-1">{t.description}</p>}
                  <button onClick={() => handleEditTitle(t)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteTitle(t.id, t.name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Grant title */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base font-serif font-bold text-amber-100/80">Cấp Danh Hiệu</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={grantTitleUserId} onChange={e => setGrantTitleUserId(e.target.value)} className={inputCls}>
                <option value="">Chọn người chơi...</option>
                {allProfiles.map(p => <option key={p.id} value={p.id}>{p.oc_name} · {p.email}</option>)}
              </select>
              <select value={grantTitleId} onChange={e => setGrantTitleId(e.target.value)} className={inputCls}>
                <option value="">Chọn danh hiệu...</option>
                {titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleGrantTitle} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold transition-all">
                <Award className="w-4 h-4" /> Cấp danh hiệu
              </button>
            </div>
          </div>

          {/* User titles */}
          {userTitles.length > 0 && (
            <div className={cardCls}>
              <h3 className="text-base font-serif font-bold text-amber-100/80 mb-4">Danh Hiệu Đã Cấp ({userTitles.length})</h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {userTitles.map(ut => {
                  const t = ut.titles;
                  const colorCfg = t ? (TITLE_COLORS[t.color] || TITLE_COLORS.amber) : TITLE_COLORS.amber;
                  return (
                    <div key={ut.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-white/5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${ut.is_displayed ? colorCfg.activeClass : colorCfg.badgeClass}`}>
                        <Award className="w-2.5 h-2.5" /> {t?.name || '(?)'}
                        {!ut.is_displayed && <span className="text-[8px] opacity-60">(ẩn)</span>}
                      </span>
                      <p className="text-xs text-gray-500 truncate flex-1">{ut.profiles?.oc_name || 'Vô Danh'}</p>
                      <button onClick={() => handleToggleTitleDisplay(ut.id, ut.is_displayed)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all" title={ut.is_displayed ? 'Ẩn' : 'Hiện'}>
                        {ut.is_displayed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleRevokeTitle(ut.id, ut.profiles?.oc_name || 'Vô Danh', t?.name || '?')} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'coupons' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base font-serif font-bold text-amber-100/80">Mã Giảm Giá ({coupons.length})</h3>
            </div>
            <button onClick={() => setShowAddCoupon(!showAddCoupon)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-xs font-bold transition-all">
              <Plus className="w-3.5 h-3.5" /> Thêm mã
            </button>
          </div>

          {showAddCoupon && (
            <form onSubmit={handleAddCoupon} className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Mã</label>
                  <input value={newCoupon.code || ''} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className={inputCls} placeholder="VD: SUMMER50" />
                </div>
                <div>
                  <label className={labelCls}>% Giảm</label>
                  <input type="number" value={newCoupon.discount_percent ?? ''} onChange={e => setNewCoupon({ ...newCoupon, discount_percent: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Số lần dùng tối đa</label>
                  <input type="number" value={newCoupon.max_uses ?? ''} onChange={e => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value) || 1 })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Ghi chú</label>
                <input value={newCoupon.note || ''} onChange={e => setNewCoupon({ ...newCoupon, note: e.target.value })} className={inputCls} />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Save className="w-4 h-4" /> Lưu
              </button>
            </form>
          )}

          <div className="space-y-2">
            {coupons.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-white/5">
                <Ticket className="w-4 h-4 text-amber-300/70 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-amber-100/90 font-mono">{c.code}</p>
                  <p className="text-xs text-gray-500">{c.discount_percent}% · {c.used_count}/{c.max_uses} lần · {c.profiles?.oc_name || 'Hệ thống'}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${c.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                  {c.is_active ? 'Hoạt động' : 'Tắt'}
                </span>
                <button onClick={() => handleToggleCoupon(c.id, c.is_active)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                  {c.is_active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleEditCoupon(c)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteCoupon(c.id, c.code)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'nghiepthuat' && (
        <NghiepThuatAdmin
          skillTemplates={skillTemplates}
          allProfiles={allProfiles}
          allSkills={allSkills}
          templateMsg={templateMsg}
          showAddTemplate={showAddTemplate}
          setShowAddTemplate={setShowAddTemplate}
          editingTemplateId={editingTemplateId}
          setEditingTemplateId={setEditingTemplateId}
          editTemplate={editTemplate}
          setEditTemplate={setEditTemplate}
          newTemplate={newTemplate as Record<string, unknown> as never}
          setNewTemplate={setNewTemplate as never}
          assignTemplateId={assignTemplateId}
          setAssignTemplateId={setAssignTemplateId}
          assignTargetUserId={assignTargetUserId}
          setAssignTargetUserId={setAssignTargetUserId}
          assignSlot={assignSlot}
          setAssignSlot={setAssignSlot}
          onAdd={handleAddTemplate}
          onEdit={handleEditTemplate}
          onSaveEdit={handleSaveEditTemplate}
          onDelete={handleDeleteTemplate}
          onAssign={handleAssignTemplate}
          onApproveTemplate={handleApproveTemplate}
          onRejectTemplate={handleRejectTemplate}
          fetchSkillsForUser={fetchSkillsForUser}
          inputCls={inputCls}
          labelCls={labelCls}
          cardCls={cardCls}
        />
      )}

      {tab === 'hiepluu' && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base font-serif font-bold text-amber-100/80">Hiệp Lưu ({hiepLuuRegs.length})</h3>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {hiepLuuRegs.map(reg => (
              <div key={reg.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-start gap-3">
                  <Avatar src={reg.profiles?.avatar_url} alt={reg.profiles?.oc_name || 'Vô Danh'} className="w-10 h-10 flex-shrink-0" iconClassName="w-5 h-5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-amber-100/90">{reg.profiles?.oc_name || reg.profiles?.anonymous_name || 'Vô Danh'}</p>
                    <p className="text-xs text-gray-500">{reg.relationship_type} · {reg.partner_name}</p>
                    {reg.self_identity && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{reg.self_identity}</p>}
                    <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      reg.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                      reg.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                      'bg-yellow-500/15 text-yellow-400'
                    }`}>{reg.status}</span>
                  </div>
                  {reg.status === 'pending' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleReviewHiepLuu(reg.id, 'approved')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all">
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button onClick={() => handleReviewHiepLuu(reg.id, 'rejected')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        details={confirmDetails}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
