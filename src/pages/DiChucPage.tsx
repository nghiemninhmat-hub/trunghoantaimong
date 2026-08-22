import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Will, WillStatus } from '@/lib/supabase';
import {
  ScrollText, FileText, Send, CheckCircle2, XCircle, Clock3, AlertCircle,
  Loader2, Plus, Edit3, Trash2, X, ChevronDown, Lock, Heart, Skull
} from 'lucide-react';

const STATUS_CONFIG: Record<WillStatus, { label: string; icon: typeof Clock3; color: string; bg: string }> = {
  pending: { label: 'Đã Tiếp Nhận', icon: Clock3, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
  approved: { label: 'Đã Phê Duyệt', icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  revision_requested: { label: 'Yêu Cầu Chỉnh Sửa', icon: AlertCircle, color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/20' },
  rejected: { label: 'Từ Chối', icon: XCircle, color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/20' },
};

const RULES_SECTIONS = [
  {
    title: 'I. Quyền lập Di Chúc',
    body: 'Mỗi người chơi được quyền lập 01 bản Di Chúc có hiệu lực. Di Chúc chỉ có giá trị sau khi được Hệ Thống kiểm tra và phê duyệt. Người chơi có quyền: Lập Di Chúc mới, Sửa đổi Di Chúc, Hủy Di Chúc, Thay đổi người thừa kế. Mỗi lần thay đổi, bản Di Chúc mới phải được gửi lại cho Hệ Thống xét duyệt. Chỉ bản Di Chúc được Hệ Thống phê duyệt gần nhất trước thời điểm tử vong mới có giá trị.',
  },
  {
    title: 'II. Tài sản được thừa kế',
    body: 'Di Chúc chỉ có thể dùng để chỉ định người nhận vật phẩm thuộc Balo của người chơi tại thời điểm tử vong. Các vật phẩm có thể bao gồm: Pháp khí, Bùa chú, Dược phẩm, Trang bị, Vật phẩm nhiệm vụ, Vật phẩm đặc biệt, Các vật phẩm hợp lệ khác do Hệ Thống xác định. Người chơi có thể chỉ định: Một người nhận toàn bộ vật phẩm, hoặc Nhiều người cùng nhận những vật phẩm khác nhau.',
  },
  {
    title: 'III. Tài sản không được thừa kế',
    body: 'Các loại tài sản sau không thể đưa vào Di Chúc: Hoa Tiền, Công Đức, Âm Đức, Điểm Xếp Hạng, Thành tích, Danh hiệu, Quyền hạn của người chơi, Tài sản hoặc quyền lợi không thuộc quyền sở hữu cá nhân. Sau khi người chơi tử vong, Hoa Tiền, Công Đức và Âm Đức sẽ được Hệ Thống thu hồi.',
  },
  {
    title: 'IV. Điều kiện thực thi Di Chúc',
    body: 'Di Chúc được thực thi khi người chơi tử vong bởi: Quỷ Dị, Dị Sự, Tai nạn, Thiên tai, Các nguyên nhân tử vong khác không xuất phát từ hành vi sát hại trực tiếp của người chơi khác. Khi đó, Hệ Thống sẽ kiểm tra bản Di Chúc hợp lệ và chuyển giao vật phẩm theo đúng nội dung đã được phê duyệt.',
  },
  {
    title: 'V. Trường hợp bị người chơi khác sát hại',
    body: 'Nếu người chơi bị một người chơi khác trực tiếp sát hại, Di Chúc không có hiệu lực đối với vật phẩm trong Balo. Toàn bộ vật phẩm mà người chết đang mang theo sẽ thuộc về người trực tiếp gây ra cái chết. Hoa Tiền, Công Đức và Âm Đức vẫn bị Hệ Thống thu hồi. Quy định này nhằm phân biệt rõ giữa tử vong thông thường và tử vong do tranh đấu giữa người chơi.',
  },
  {
    title: 'VI. Trường hợp người thừa kế đã tử vong',
    body: 'Nếu người được chỉ định thừa kế đã tử vong trước người lập Di Chúc, phần tài sản được chỉ định cho người đó sẽ quay về Hệ Thống. Người thừa kế không được tự ý chuyển quyền thừa kế cho người thứ ba.',
  },
  {
    title: 'VII. Trường hợp vật phẩm không còn tồn tại',
    body: 'Nếu vật phẩm được ghi trong Di Chúc đã: Bị tiêu hao, Bị phá hủy, Bị mất, Được sử dụng, Hoặc không còn nằm trong Balo tại thời điểm tử vong, Hệ Thống sẽ không tiến hành bồi hoàn. Di Chúc chỉ có hiệu lực đối với tài sản thực tế tồn tại tại thời điểm người chơi tử vong.',
  },
  {
    title: 'VIII. Bảo mật',
    body: 'Nội dung Di Chúc được Hệ Thống lưu trữ và bảo mật. Người chơi khác không có quyền xem nội dung Di Chúc của một người nếu chưa được người lập Di Chúc công khai. Hệ Thống chỉ công bố thông tin liên quan đến người thừa kế khi Di Chúc chính thức được thực thi.',
  },
  {
    title: 'IX. Hiệu lực',
    body: 'Di Chúc không có thời hạn. Bản Di Chúc được phê duyệt gần nhất sẽ tiếp tục có hiệu lực cho đến khi: Người chơi sửa đổi, Người chơi hủy bỏ, Hoặc người chơi tử vong. Sau khi Di Chúc được thực thi, nó chính thức mất hiệu lực.',
  },
];

export default function DiChucPage() {
  const { user, profile } = useAuth();
  const [wills, setWills] = useState<Will[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWill, setEditingWill] = useState<Will | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [expandedRules, setExpandedRules] = useState(false);

  const [form, setForm] = useState({
    heir_name: '',
    heir_oc_name: '',
    heir_relationship: '',
    inheritance_type: 'ALL' as 'ALL' | 'SPECIFIC',
    item_list: '',
    heir_assignments: '',
  });

  const fetchWills = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('wills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!err && data) setWills(data as Will[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWills(); }, [fetchWills]);

  const resetForm = () => {
    setForm({ heir_name: '', heir_oc_name: '', heir_relationship: '', inheritance_type: 'ALL', item_list: '', heir_assignments: '' });
    setEditingWill(null);
    setError('');
  };

  const openNewForm = () => { resetForm(); setShowForm(true); };
  const openEditForm = (will: Will) => {
    setForm({
      heir_name: will.heir_name || '',
      heir_oc_name: will.heir_oc_name || '',
      heir_relationship: will.heir_relationship || '',
      inheritance_type: will.inheritance_type as 'ALL' | 'SPECIFIC',
      item_list: will.item_list || '',
      heir_assignments: will.heir_assignments || '',
    });
    setEditingWill(will);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!form.heir_name.trim()) { setError('Vui lòng nhập tên người thừa kế.'); return; }
    setSubmitting(true);
    setError('');

    const payload = {
      user_id: user.id,
      author_oc_name: profile.oc_name,
      heir_name: form.heir_name.trim(),
      heir_oc_name: form.heir_oc_name.trim() || null,
      heir_relationship: form.heir_relationship.trim() || null,
      inheritance_type: form.inheritance_type,
      item_list: form.item_list.trim() || null,
      heir_assignments: form.heir_assignments.trim() || null,
      status: 'pending' as WillStatus,
      reviewer_id: null,
      reviewer_name: null,
      reviewed_at: null,
      will_code: null,
      admin_note: null,
    };

    let result;
    if (editingWill) {
      result = await supabase.from('wills').update(payload).eq('id', editingWill.id);
    } else {
      result = await supabase.from('wills').insert([payload]);
    }

    setSubmitting(false);
    if (result.error) { setError(`Lỗi: ${result.error.message}`); return; }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setShowForm(false); resetForm(); fetchWills(); }, 2000);
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('wills').delete().eq('id', id);
    if (!err) fetchWills();
  };

  const inputClass = "w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
  const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-gray-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400/60" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <ScrollText className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Hệ Thống Di Chúc</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Di Chúc</h2>
        <p className="text-sm text-gray-500 mt-2 italic">Quy định về quyền thừa kế vật phẩm của người chơi</p>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Intro */}
      <div className="rounded-2xl border border-[#670201]/25 bg-gradient-to-b from-[#0d0606] to-[#0a0404] p-5 sm:p-7">
        <p className="text-sm leading-7 text-gray-400">
          Sinh tử tại Trùng Hoa không thể cưỡng cầu. Một khi người chơi tử vong, toàn bộ hành trình tại thế gian này sẽ chính thức khép lại.
          Những vật phẩm còn lưu giữ trong Balo sẽ được Hệ Thống xử lý theo quy định.
          Để tránh việc tài sản bị thất lạc sau khi chết, mỗi người chơi được quyền lập Di Chúc và gửi lên Hệ Thống để lưu trữ.
        </p>
      </div>

      {/* Rules accordion */}
      <div className="rounded-2xl border border-[#670201]/25 bg-gradient-to-b from-[#0d0606] to-[#0a0404] overflow-hidden">
        <button
          onClick={() => setExpandedRules(!expandedRules)}
          className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-[#670201]/[0.06]"
        >
          <FileText className="w-5 h-5 text-amber-300/70 flex-shrink-0" />
          <h3 className="font-serif text-base font-bold text-amber-100/90">Quy Định Di Chúc</h3>
          <ChevronDown className={`ml-auto w-5 h-5 text-amber-300/60 transition-transform duration-300 ${expandedRules ? 'rotate-180' : ''}`} />
        </button>
        {expandedRules && (
          <div className="border-t border-[#670201]/15 px-5 pb-6 pt-4 space-y-4">
            {RULES_SECTIONS.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-serif text-sm font-bold text-amber-200/80 mb-1.5">{section.title}</h4>
                <p className="text-xs leading-6 text-gray-400">{section.body}</p>
              </div>
            ))}
            <div className="mt-4 rounded-lg border border-[#670201]/20 bg-[#670201]/10 p-4 text-center">
              <p className="font-serif text-sm italic text-amber-200/70">Một đời người chỉ có một lần kết thúc.</p>
              <p className="mt-1 font-serif text-sm italic text-amber-200/70">Hãy quyết định thứ gì sẽ được để lại trước khi tiếng chuông tang vang lên.</p>
              <p className="mt-2 text-[10px] text-gray-600">— Hệ Thống Trùng Hoa Tái</p>
            </div>
          </div>
        )}
      </div>

      {/* Not logged in */}
      {!user ? (
        <div className="rounded-2xl border border-[#670201]/25 bg-black/30 p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">Vui lòng đăng nhập để lập Di Chúc.</p>
        </div>
      ) : (
        <>
          {/* Action button */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-serif font-bold text-amber-100/90">Di Chúc Của Bạn</h3>
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 rounded-xl border border-[#670201]/40 bg-[#670201]/15 px-4 py-2.5 text-sm font-bold text-amber-100 transition-all hover:bg-[#670201]/30"
            >
              <Plus className="h-4 w-4" /> Lập Di Chúc
            </button>
          </div>

          {/* Will list */}
          {wills.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-black/20 p-8 text-center">
              <ScrollText className="mx-auto h-10 w-10 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Bạn chưa lập Di Chúc nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wills.map(will => {
                const cfg = STATUS_CONFIG[will.status];
                const StatusIcon = cfg.icon;
                return (
                  <article key={will.id} className="overflow-hidden rounded-2xl border border-[#670201]/25 bg-gradient-to-b from-[#0f0606] to-[#080405] shadow-lg">
                    <div className="p-5">
                      {/* Status badge */}
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-600">{new Date(will.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>

                      {/* Content */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className={labelClass}>Người thừa kế</p>
                          <p className="text-sm font-semibold text-amber-100">{will.heir_name}</p>
                          {will.heir_oc_name && <p className="text-xs text-gray-500">OC: {will.heir_oc_name}</p>}
                        </div>
                        <div>
                          <p className={labelClass}>Mối quan hệ</p>
                          <p className="text-sm text-gray-300">{will.heir_relationship || '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className={labelClass}>Hình thức thừa kế</p>
                          <p className="text-sm text-gray-300">
                            {will.inheritance_type === 'ALL' ? 'Toàn bộ vật phẩm trong Balo' : 'Chỉ định từng vật phẩm cụ thể'}
                          </p>
                        </div>
                        {will.item_list && (
                          <div className="sm:col-span-2">
                            <p className={labelClass}>Danh sách vật phẩm</p>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{will.item_list}</p>
                          </div>
                        )}
                        {will.heir_assignments && (
                          <div className="sm:col-span-2">
                            <p className={labelClass}>Phân chia nhiều người thừa kế</p>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{will.heir_assignments}</p>
                          </div>
                        )}
                      </div>

                      {/* Admin section */}
                      {will.status !== 'pending' && (will.will_code || will.admin_note || will.reviewer_name) && (
                        <div className="mt-4 rounded-xl border border-[#670201]/20 bg-[#670201]/10 p-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300/60">Phần Hệ Thống</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {will.will_code && (
                              <div>
                                <p className={labelClass}>Mã Di Chúc</p>
                                <p className="font-mono text-sm font-bold tracking-widest text-amber-200">{will.will_code}</p>
                              </div>
                            )}
                            {will.reviewer_name && (
                              <div>
                                <p className={labelClass}>Người xét duyệt</p>
                                <p className="text-sm text-gray-300">{will.reviewer_name}</p>
                              </div>
                            )}
                            {will.reviewed_at && (
                              <div>
                                <p className={labelClass}>Ngày phê duyệt</p>
                                <p className="text-sm text-gray-300">{new Date(will.reviewed_at).toLocaleDateString('vi-VN')}</p>
                              </div>
                            )}
                            {will.admin_note && (
                              <div className="sm:col-span-2">
                                <p className={labelClass}>Ghi chú của Hệ Thống</p>
                                <p className="text-sm leading-6 text-gray-300">{will.admin_note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                        <button
                          onClick={() => openEditForm(will)}
                          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-amber-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Sửa / Gửi lại
                        </button>
                        <button
                          onClick={() => handleDelete(will.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400/70 transition-all hover:bg-red-500/15 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hủy Di Chúc
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Form modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#670201]/30 bg-gradient-to-b from-[#150807] to-[#0a0404] shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#670201]/25 bg-[#150807]/95 px-5 py-4 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <ScrollText className="h-5 w-5 text-amber-300" />
                    <h2 className="font-serif text-lg font-bold text-amber-100">{editingWill ? 'Sửa Di Chúc' : 'Lập Di Chúc Mới'}</h2>
                  </div>
                  <button onClick={() => setShowForm(false)} className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-amber-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-5 p-5">
                  {success ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-300">Di Chúc đã được gửi. Vui lòng chờ Hệ Thống xét duyệt.</p>
                    </div>
                  ) : (
                    <>
                      {/* Notice */}
                      <div className="flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/5 p-3">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/70" />
                        <p className="text-xs leading-5 text-gray-400">Chỉ Di Chúc được Hệ Thống phê duyệt mới có hiệu lực. Người chơi chịu trách nhiệm kiểm tra lại nội dung Di Chúc sau mỗi lần thay đổi.</p>
                      </div>

                      {/* I. Author info */}
                      <section>
                        <div className="mb-3 flex items-center gap-2 border-b border-[#670201]/25 pb-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#670201]/40 bg-[#670201]/15">
                            <Heart className="h-3.5 w-3.5 text-amber-300" />
                          </div>
                          <h3 className="font-serif text-sm font-bold text-amber-100">I. Thông Tin Người Lập</h3>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className={labelClass}>Tên người chơi</label>
                            <input value={profile?.email || ''} disabled className={`${inputClass} opacity-50`} />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelClass}>Tên OC</label>
                            <input value={profile?.oc_name || ''} disabled className={`${inputClass} opacity-50`} />
                          </div>
                        </div>
                      </section>

                      {/* II. Heir info */}
                      <section>
                        <div className="mb-3 flex items-center gap-2 border-b border-[#670201]/25 pb-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#670201]/40 bg-[#670201]/15">
                            <ScrollText className="h-3.5 w-3.5 text-amber-300" />
                          </div>
                          <h3 className="font-serif text-sm font-bold text-amber-100">II. Người Thừa Kế</h3>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className={labelClass}>Tên người chơi được chỉ định *</label>
                            <input value={form.heir_name} onChange={e => setForm({ ...form, heir_name: e.target.value })} placeholder="Tên tài khoản người nhận" className={inputClass} />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelClass}>Tên OC</label>
                            <input value={form.heir_oc_name} onChange={e => setForm({ ...form, heir_oc_name: e.target.value })} placeholder="Tên nhân vật người nhận" className={inputClass} />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className={labelClass}>Mối quan hệ với người lập Di Chúc</label>
                            <input value={form.heir_relationship} onChange={e => setForm({ ...form, heir_relationship: e.target.value })} placeholder="VD: Sư huynh, bằng hữu, người thương..." className={inputClass} />
                          </div>
                        </div>
                      </section>

                      {/* III. Inheritance content */}
                      <section>
                        <div className="mb-3 flex items-center gap-2 border-b border-[#670201]/25 pb-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#670201]/40 bg-[#670201]/15">
                            <FileText className="h-3.5 w-3.5 text-amber-300" />
                          </div>
                          <h3 className="font-serif text-sm font-bold text-amber-100">III. Nội Dung Thừa Kế</h3>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <label className={labelClass}>Hình thức thừa kế</label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${form.inheritance_type === 'ALL' ? 'border-[#670201]/50 bg-[#670201]/20 text-amber-100' : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/20'}`}>
                              <input type="radio" checked={form.inheritance_type === 'ALL'} onChange={() => setForm({ ...form, inheritance_type: 'ALL' })} className="sr-only" />
                              Toàn bộ vật phẩm trong Balo
                            </label>
                            <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${form.inheritance_type === 'SPECIFIC' ? 'border-[#670201]/50 bg-[#670201]/20 text-amber-100' : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/20'}`}>
                              <input type="radio" checked={form.inheritance_type === 'SPECIFIC'} onChange={() => setForm({ ...form, inheritance_type: 'SPECIFIC' })} className="sr-only" />
                              Chỉ định từng vật phẩm cụ thể
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <label className={labelClass}>Danh sách vật phẩm muốn để lại</label>
                          <textarea value={form.item_list} onChange={e => setForm({ ...form, item_list: e.target.value })} rows={4} placeholder="Liệt kê vật phẩm..." className={`${inputClass} resize-none`} />
                        </div>

                        <div className="space-y-1.5">
                          <label className={labelClass}>Nếu có nhiều người thừa kế, ghi rõ vật phẩm tương ứng</label>
                          <textarea value={form.heir_assignments} onChange={e => setForm({ ...form, heir_assignments: e.target.value })} rows={5} placeholder={"Người thừa kế 1: ...\nVật phẩm nhận: ...\n\nNgười thừa kế 2: ...\nVật phẩm nhận: ..."} className={`${inputClass} resize-none`} />
                        </div>
                      </section>

                      {/* IV. Confirmation */}
                      <section>
                        <div className="mb-3 flex items-center gap-2 border-b border-[#670201]/25 pb-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#670201]/40 bg-[#670201]/15">
                            <Skull className="h-3.5 w-3.5 text-amber-300" />
                          </div>
                          <h3 className="font-serif text-sm font-bold text-amber-100">IV. Xác Nhận</h3>
                        </div>
                        <ul className="space-y-2 text-xs leading-5 text-gray-400">
                          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/50" /> Tôi xác nhận những thông tin trên là chính xác.</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/50" /> Tôi hiểu rằng Di Chúc chỉ có hiệu lực sau khi được Hệ Thống phê duyệt.</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/50" /> Tôi đồng ý rằng Hoa Tiền, Công Đức, Âm Đức và các tài sản không được phép thừa kế sẽ không được chuyển giao.</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/50" /> Tôi hiểu rằng nếu tử vong do bị người chơi khác sát hại, vật phẩm trong Balo sẽ được xử lý theo Quy Định Tử Vong.</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/50" /> Tôi chịu trách nhiệm về toàn bộ nội dung bản Di Chúc này.</li>
                        </ul>
                      </section>

                      {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                        </div>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#670201] px-5 py-3 text-sm font-bold text-amber-100 transition-all hover:bg-[#a00404] disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {editingWill ? 'Gửi lại Di Chúc' : 'Gửi Di Chúc'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
