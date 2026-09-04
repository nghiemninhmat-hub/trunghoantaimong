import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ADMIN_EMAILS = [
  'kinhnha010@gmail.com',
  'hamthien53@gmail.com',
  'Ngoncanhtac001@gmail.com',
  'thanhhuyenbsc@gmail.com',
  'dungchikienn@gmail.com',
  'vinhtongthuong@gmail.com',
];

export const ADMIN_PASSWORD_DEFAULT = 'TrungHoanTai@2026!';

export const CURRENCY_LABELS: Record<string, string> = {
  HUA_TIEN: 'Hoa Tiền',
  CONG_DUC: 'Công Đức',
  AM_DUC: 'Âm Đức',
};

export const SHOP_AREA_LABELS: Record<string, string> = {
  'Thường': 'Thương Thành Thường',
  'Hiếm': 'Thương Thành Hiếm',
  'Sự kiện': 'Thương Thành Sự Kiện',
};

export const CURRENCY_ICONS: Record<string, string> = {
  HUA_TIEN: '🪙',
  CONG_DUC: '✨',
  AM_DUC: '🌑',
};

export interface Profile {
  id: string;
  email: string;
  oc_name: string;
  avatar_url: string | null;
  gender: string;
  bio: string | null;
  hua_tien: number;
  cong_duc: number;
  am_duc: number;
  is_approved: boolean;
  anonymous_name: string | null;
  anonymous_name_changes: number;
  created_at: string;
  wheel_spins: number;
  wheel_special_claimed: boolean;
  wheel_total_spins: number;
  status_physical: string;
  status_spiritual: string;
  status_mental: string;
  danh_vong: string | null;
  approved_by: string | null;
  approved_at: string | null;
  password: string | null;
  is_disabled: boolean;
  chuc_nghiep_level: number;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_user_id: string | null;
  target_description: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface PasswordHistoryEntry {
  id: string;
  user_id: string;
  old_password: string | null;
  new_password: string;
  changed_by: string | null;
  created_at: string;
}

export interface WheelSpinResult {
  reward_key: string;
  reward_label: string;
  reward_group: string;
  is_special: boolean;
  currency_type: string | null;
  amount: number;
}

export interface WheelSpinLog {
  id: string;
  user_id: string;
  oc_name: string | null;
  reward_key: string;
  reward_label: string;
  reward_group: string;
  is_special: boolean;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: string;
  price: number;
  currency_type: string;
  description: string | null;
  stock: number;
  price_secondary: number | null;
  currency_type_secondary: string | null;
  shop_area: string;
  purchase_limit: string | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
  shop_items?: ShopItem;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  acquired_at: string;
  quantity: number;
  shop_items?: ShopItem;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  profiles?: { anonymous_name: string | null; oc_name: string } | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  profiles?: { anonymous_name: string | null; oc_name: string } | null;
  replies?: PostComment[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency_type: string;
  reason: string;
  created_at: string;
  related_user_name: string | null;
  profiles?: { oc_name: string; email: string } | null;
}

export interface SitePage {
  id: string;
  page_number: number;
  title: string;
  category: string;
  content: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
}

export interface SearchProfile {
  id: string;
  oc_name: string;
  anonymous_name: string | null;
  avatar_url: string | null;
  gender: string;
  bio: string | null;
  is_approved: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  deleted_by_user: boolean;
  created_at: string;
}

export interface KimBangEntry {
  id: string;
  rank: number;
  identity_name: string;
  wealth: string;
  quests_completed: number;
  honor_title: string;
  avatar_url: string;
  epithet: string;
  updated_at: string;
}

export interface WantedNotice {
  id: string;
  target_name: string;
  gender: string;
  age: string;
  occupation: string;
  organization: string;
  identifying_features: string;
  reason: string;
  task_requirement: string;
  completion_condition: string;
  avatar_url: string | null;
  reward_amount: string;
  reward_method: string;
  deadline: string;
  status: string;
  code: string | null;
  published_at: string | null;
  created_at: string;
  submitter_id: string | null;
}

export interface BachQuyAm {
  id: string;
  name: string;
  classification: string;
  danger_level: string;
  event_level: string | null;
  brief_description: string;
  weakness: string | null;
  appearance: string | null;
  behavior: string | null;
  destruction: string | null;
  sealing: string | null;
  display_order: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  volume_number: number;
  volume_name: string;
  volume_subtitle: string;
  volume_tagline: string;
  volume_traits: string;
  volume_signs: string;
  volume_taboo: string;
  volume_vuc_name: string;
  volume_vuc_desc: string;
  looi_phan: string;
  duyen_sinh: string;
  quy_tinh: string;
  quy_luat: string;
  quy_vuc: string;
  tu_huyet: string;
  pha_phap: string;
  di_van: string;
}

export interface BachHoaEntry {
  id: string;
  identity_name: string;
  quote: string;
  avatar_url: string;
  vote_count: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface BachHoaVote {
  id: string;
  entry_id: string;
  user_id: string;
  created_at: string;
  profiles?: { oc_name: string | null; anonymous_name: string | null } | null;
}

export interface Organization {
  id: string;
  name: string;
  category: string;
  leader_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  leader?: { oc_name: string } | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: { oc_name: string } | null;
}

export interface Title {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

export interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  is_displayed: boolean;
  granted_by: string | null;
  granted_at: string;
  titles?: Title | null;
}

export const TITLE_COLORS: Record<string, { label: string; badgeClass: string; activeClass: string }> = {
  amber: { label: 'Hổ Phách', badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-200', activeClass: 'bg-amber-500/25 border-amber-500/50 text-amber-100' },
  red: { label: 'Huyết Nguyệt', badgeClass: 'bg-red-500/15 border-red-500/30 text-red-300', activeClass: 'bg-red-500/25 border-red-500/50 text-red-200' },
  emerald: { label: 'Ngọc Lục', badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', activeClass: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-200' },
  blue: { label: 'Bích Lam', badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-300', activeClass: 'bg-blue-500/25 border-blue-500/50 text-blue-200' },
  purple: { label: 'Tử Uyên', badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-300', activeClass: 'bg-purple-500/25 border-purple-500/50 text-purple-200' },
  gray: { label: 'Hư Vô', badgeClass: 'bg-gray-500/15 border-gray-500/30 text-gray-300', activeClass: 'bg-gray-500/25 border-gray-500/50 text-gray-100' },
};

export type WillStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected';

export interface Will {
  id: string;
  user_id: string;
  author_oc_name: string | null;
  heir_name: string | null;
  heir_oc_name: string | null;
  heir_relationship: string | null;
  inheritance_type: string;
  item_list: string | null;
  heir_assignments: string | null;
  status: WillStatus;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  will_code: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}
