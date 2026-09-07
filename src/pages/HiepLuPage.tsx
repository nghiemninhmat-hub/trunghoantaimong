import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, HiepLuuRegistration, HiepLuuRelationship } from '@/lib/supabase';
import {
  Heart, Sparkles, Users, Loader2, AlertCircle, CheckCircle2, Clock,
  X, Send, ImageIcon, Flame, Moon, Star,
} from 'lucide-react';

const RELATIONSHIP_OPTIONS: { value: HiepLuuRelationship; label: string; icon: typeof Heart; description: string }[] = [
  { value: 'NHAN_DUYEN', label: 'Nhân Duyên — Bạn Đời', icon: Heart, description: 'Mối duyên sâu sắc, tâm giao trọn đời. Hai linh hồn cùng vác chung một khối nghiệp, gánh chung một đoạn luân hồi.' },
  { value: 'TRI_KY', label: 'Tri Kỷ', icon: Sparkles, description: 'Một tiếng đàn, một bút pháp, một ánh mắt đủ hiểu — tri kỷ là người nhìn thấu tim mình mà không cần lời.' },
  { value: 'THAN_HUU', label: 'Thân Hữu', icon: Users, description: 'Kề vai sát cánh, cùng trà lạnh cùng đêm sâu. Thân hữu là ngọn lửa sưởi ấm giữa phong trần.' },
];

const MAX_BONDS = 3;

export default function HiepLuPage() {
  const { user, profile } = useAuth();
  const [registrations, setRegistrations] = useState<HiepLuuRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [relationshipType, setRelationshipType] = useState<HiepLuuRelationship>('NHAN_DUYEN');
  const [partnerName, setPartnerName] = useState('');
  const [selfIdentity, setSelfIdentity] = useState('');
  const [themeImage, setThemeImage] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Ceremony modal
  const [ceremonyReg, setCeremonyReg] = useState<HiepLuuRegistration | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('hiep_luu_registrations')
      .select('*, profiles:profiles!hiep_luu_registrations_user_id_fkey(oc_name, anonymous_name, avatar_url)')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRegistrations((data || []) as HiepLuuRegistration[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approvedBonds = registrations.filter(r => r.status === 'approved');
  const pendingBonds = registrations.filter(r => r.status === 'pending');
  const canRegister = approvedBonds.length < MAX_BONDS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMessage('');

    if (!partnerName.trim()) {
      setError('Vui lòng nhập tên đối tượng kết duyên.');
      return;
    }
    if (!selfIdentity.trim()) {
      setError('Vui lòng nhập danh tính bản thân.');
      return;
    }
    if (approvedBonds.length >= MAX_BONDS) {
      setError(`Bạn đã đạt giới hạn ${MAX_BONDS} duyên. Không thể đăng ký thêm.`);
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('hiep_luu_registrations')
        .insert({
          user_id: user.id,
          relationship_type: relationshipType,
          partner_name: partnerName.trim(),
          self_identity: selfIdentity.trim(),
          theme_image_url: themeImage.trim() || null,
          status: 'pending',
        });
      if (insertError) throw insertError;
      setMessage('Đăng ký hiệp lữ đã được gửi. Vui lòng chờ quản trị viên phê duyệt.');
      setShowForm(false);
      setPartnerName('');
      setSelfIdentity('');
      setThemeImage('');
      setRelationshipType('NHAN_DUYEN');
      await fetchData();
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getRegMeta = (reg: HiepLuuRegistration) => {
    return RELATIONSHIP_OPTIONS.find(o => o.value === reg.relationship_type) || RELATIONSHIP_OPTIONS[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center pt-4 pb-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative">
            <Heart className="w-8 h-8 text-[#b73720] fill-[#b73720]/30" />
            <div className="absolute inset-0 animate-ping opacity-30">
              <Heart className="w-8 h-8 text-[#eeb337]/40" />
            </div>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#fff1cf] tracking-wide">Hiệp Lữ</h1>
          <div className="relative">
            <Heart className="w-8 h-8 text-[#b73720] fill-[#b73720]/30" />
            <div className="absolute inset-0 animate-ping opacity-30">
              <Heart className="w-8 h-8 text-[#eeb337]/40" />
            </div>
          </div>
        </div>
        <p className="font-script text-sm sm:text-base text-[#d7a96d]/70 max-w-2xl mx-auto">
          Trụ sở kết duyên — nơi những mối nhân duyên, tri kỷ, thân hữu được ghi nhận và cử hành nghi lễ.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">{message}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-black/30 border border-[#eeb337]/15">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#eeb337]">{approvedBonds.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Duyên đã kết</p>
        </div>
        <div className="w-px h-8 bg-[#eeb337]/15" />
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-400">{pendingBonds.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Chờ duyệt</p>
        </div>
        <div className="w-px h-8 bg-[#eeb337]/15" />
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-400">{MAX_BONDS - approvedBonds.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Còn lại</p>
        </div>
      </div>

      {/* Registration Button */}
      <div className="flex justify-center">
        {canRegister ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#670201] to-[#a00404] text-[#fff1cf] font-bold text-sm shadow-lg shadow-[#670201]/30 hover:shadow-[#670201]/50 transition-all border border-[#eeb337]/30"
          >
            {showForm ? <X className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
            {showForm ? 'Hủy đăng ký' : 'Đăng Ký Hiệp Lữ'}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/30 border border-[#eeb337]/15 text-gray-500 text-sm">
            <Heart className="w-4 h-4" />
            Bạn đã kết đủ {MAX_BONDS} duyên. Không thể đăng ký thêm.
          </div>
        )}
      </div>

      {/* Registration Form */}
      {showForm && canRegister && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-[#670201]/30 space-y-5">
          <h3 className="font-serif text-lg font-bold text-[#fff1cf] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#eeb337]" />
            Đăng Ký Hiệp Lữ Mới
          </h3>

          {/* Relationship Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Mối quan hệ</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RELATIONSHIP_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = relationshipType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRelationshipType(opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-[#eeb337]/50 bg-[#670201]/20 shadow-lg shadow-[#670201]/20'
                        : 'border-white/10 bg-black/20 hover:border-[#eeb337]/25'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${selected ? 'text-[#eeb337]' : 'text-gray-500'}`} />
                      <span className={`text-sm font-bold ${selected ? 'text-[#fff1cf]' : 'text-gray-400'}`}>{opt.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partner Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Tag tên đối tượng kết duyên
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              placeholder="Nhập danh tính OC hoặc tên ẩn danh của đối phương..."
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-[#fff1cf] focus:outline-none focus:border-[#670201]/50 transition-all"
              maxLength={50}
            />
            <p className="text-[10px] text-gray-600 mt-1">Danh tính này sẽ hiển thị trong nghi lễ kết duyên.</p>
          </div>

          {/* Self Identity */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Danh tính bản thân
            </label>
            <input
              type="text"
              value={selfIdentity}
              onChange={e => setSelfIdentity(e.target.value)}
              placeholder="Nhập danh tính của bạn trong mối duyên này..."
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-[#fff1cf] focus:outline-none focus:border-[#670201]/50 transition-all"
              maxLength={50}
            />
            <p className="text-[10px] text-gray-600 mt-1">Cách bạn muốn được xưng gọi trong nghi lễ.</p>
          </div>

          {/* Theme Image */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Ảnh chủ đề (liên kết)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="url"
                  value={themeImage}
                  onChange={e => setThemeImage(e.target.value)}
                  placeholder="https://... (tùy chọn)"
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-[#fff1cf] focus:outline-none focus:border-[#670201]/50 transition-all"
                />
              </div>
              {themeImage && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={themeImage} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-600 mt-1">Ảnh nền cho nghi lễ kết duyên. Bỏ trống nếu không dùng.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#670201] hover:bg-[#a00404] text-[#fff1cf] font-bold text-sm transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gửi Đăng Ký
          </button>
        </form>
      )}

      {/* Pending Registrations */}
      {pendingBonds.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-base font-bold text-amber-300/80 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Chờ Phê Duyệt
          </h3>
          {pendingBonds.map(reg => {
            const meta = getRegMeta(reg);
            const Icon = meta.icon;
            return (
              <div key={reg.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-amber-500/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 flex-shrink-0">
                  <Icon className="w-5 h-5 text-amber-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-100/90">{meta.label}</p>
                  <p className="text-xs text-gray-500">Với: {reg.partner_name} · {formatDate(reg.created_at)}</p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300 flex-shrink-0">
                  <Clock className="w-3 h-3" /> Chờ duyệt
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Approved Bonds — Ceremonies */}
      {approvedBonds.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-[#fff1cf] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#b73720]" /> Nghi Lễ Kết Duyên
          </h3>
          {approvedBonds.map(reg => {
            const meta = getRegMeta(reg);
            return (
              <BondCeremonyCard
                key={reg.id}
                reg={reg}
                meta={meta}
                onView={() => setCeremonyReg(reg)}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {registrations.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto mb-4 text-[#670201]/30" />
          <p className="text-gray-500 text-sm">Chưa có hiệp lữ nào. Hãy đăng ký để bắt đầu kết duyên.</p>
        </div>
      )}

      {/* Ceremony Modal */}
      {ceremonyReg && (
        <CeremonyModal reg={ceremonyReg} onClose={() => setCeremonyReg(null)} />
      )}
    </div>
  );
}

// === Bond Ceremony Card (compact preview) ===
function BondCeremonyCard({
  reg,
  meta,
  onView,
}: {
  reg: HiepLuuRegistration;
  meta: typeof RELATIONSHIP_OPTIONS[number];
  onView: () => void;
}) {
  const Icon = meta.icon;
  const isNhanDuyen = reg.relationship_type === 'NHAN_DUYEN';
  const isTriKy = reg.relationship_type === 'TRI_KY';
  const isThanHuu = reg.relationship_type === 'THAN_HUU';

  return (
    <button
      onClick={onView}
      className="group w-full p-5 rounded-2xl border text-left transition-all overflow-hidden relative"
      style={{
        borderColor: isNhanDuyen ? 'rgba(183,55,32,0.3)' : isTriKy ? 'rgba(238,179,55,0.25)' : 'rgba(110,180,100,0.2)',
        background: reg.theme_image_url
          ? `linear-gradient(135deg, rgba(23,11,9,0.85), rgba(13,8,7,0.9)), url(${reg.theme_image_url}) center/cover`
          : isNhanDuyen
            ? 'linear-gradient(135deg, #1a0a08, #2d0e0a)'
            : isTriKy
              ? 'linear-gradient(135deg, #1a1505, #2a2008)'
              : 'linear-gradient(135deg, #0a1208, #15201a)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 ${
          isNhanDuyen ? 'bg-[#b73720]/20' : isTriKy ? 'bg-[#eeb337]/15' : 'bg-emerald-500/15'
        }`}>
          <Icon className={`w-6 h-6 ${
            isNhanDuyen ? 'text-[#b73720]' : isTriKy ? 'text-[#eeb337]' : 'text-emerald-400'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#fff1cf]">{meta.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="text-[#eeb337]/70">{reg.self_identity}</span>
            {' '}—{' '}
            <span className="text-[#f6ca62]/80">{reg.partner_name}</span>
          </p>
        </div>
        <div className="flex-shrink-0 text-gray-500 group-hover:text-[#eeb337] transition-colors">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

// === Full Ceremony Modal ===
function CeremonyModal({ reg, onClose }: { reg: HiepLuuRegistration; onClose: () => void }) {
  const isNhanDuyen = reg.relationship_type === 'NHAN_DUYEN';
  const isTriKy = reg.relationship_type === 'TRI_KY';

  const defaultMessages: Record<HiepLuuRelationship, string> = {
    NHAN_DUYEN: 'Từ kiếp trước đến kiếp này, duyên ta chưa dứt. Nay nguyện cùng nhau gánh chung luân hồi, trọn kiếp không buông.',
    TRI_KY: 'Một tiếng đàn, một tiếng cười — đủ hiểu lòng nhau mà không cần nói. Tri âm tri kỷ, hiếm có khó tìm.',
    THAN_HUU: 'Cùng trà lạnh, cùng đêm sâu. Giữa phong trần dẫu vô tận, có nhau là đủ ấm.',
  };

  const bondMessage = reg.bond_message || defaultMessages[reg.relationship_type];
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: reg.theme_image_url
            ? `linear-gradient(180deg, rgba(23,11,9,0.7), rgba(13,8,7,0.95)), url(${reg.theme_image_url}) center/cover`
            : isNhanDuyen
              ? 'linear-gradient(180deg, #1a0a08, #0d0807)'
              : isTriKy
                ? 'linear-gradient(180deg, #1a1505, #0d0b07)'
                : 'linear-gradient(180deg, #0a1208, #0d100b)',
          border: `1px solid ${isNhanDuyen ? 'rgba(183,55,32,0.4)' : isTriKy ? 'rgba(238,179,55,0.35)' : 'rgba(110,180,100,0.3)'}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-gray-400 hover:text-[#fff1cf] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ceremony content */}
        <div className="p-6 sm:p-10 text-center">
          {isNhanDuyen ? (
            <NhanDuyenCeremony selfIdentity={reg.self_identity} partnerName={reg.partner_name} bondMessage={bondMessage} date={formatDate(reg.created_at)} />
          ) : isTriKy ? (
            <TriKyCeremony selfIdentity={reg.self_identity} partnerName={reg.partner_name} bondMessage={bondMessage} date={formatDate(reg.created_at)} />
          ) : (
            <ThanHuuCeremony selfIdentity={reg.self_identity} partnerName={reg.partner_name} bondMessage={bondMessage} date={formatDate(reg.created_at)} />
          )}
        </div>
      </div>
    </div>
  );
}

// === Nhân Duyên Ceremony (Heartbeat) ===
function NhanDuyenCeremony({ selfIdentity, partnerName, bondMessage, date }: { selfIdentity: string; partnerName: string; bondMessage: string; date: string }) {
  return (
    <div className="space-y-6">
      {/* Heartbeat animation */}
      <div className="relative flex items-center justify-center py-6">
        <div className="absolute w-48 h-48 rounded-full bg-[#b73720]/20 blur-3xl animate-pulse" />
        <div className="relative animate-heartbeat">
          <Heart className="w-24 h-24 sm:w-32 sm:h-32 text-[#b73720] fill-[#b73720]/40 drop-shadow-[0_0_20px_rgba(183,55,32,0.6)]" />
        </div>
      </div>

      {/* Couple names inside heart glow */}
      <div className="space-y-2">
        <p className="font-script text-2xl sm:text-3xl text-[#fff1cf] drop-shadow-[0_0_10px_rgba(255,241,207,0.3)]">
          {selfIdentity}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-[#eeb337]/30" />
          <Heart className="w-3 h-3 text-[#b73720] fill-[#b73720]/40" />
          <div className="h-px w-12 bg-[#eeb337]/30" />
        </div>
        <p className="font-script text-2xl sm:text-3xl text-[#f6ca62] drop-shadow-[0_0_10px_rgba(246,202,98,0.3)]">
          {partnerName}
        </p>
      </div>

      {/* Bond message */}
      <div className="max-w-md mx-auto p-4 rounded-xl bg-black/30 border border-[#b73720]/20">
        <p className="font-script text-sm sm:text-base text-[#d7a96d] italic leading-relaxed">
          "{bondMessage}"
        </p>
      </div>

      {/* Date seal */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Flame className="w-3 h-3 text-[#b73720]/50" />
        <span>Kết duyên ngày {date}</span>
        <Flame className="w-3 h-3 text-[#b73720]/50" />
      </div>
    </div>
  );
}

// === Tri Kỷ Ceremony (Sparkles + Moon) ===
function TriKyCeremony({ selfIdentity, partnerName, bondMessage, date }: { selfIdentity: string; partnerName: string; bondMessage: string; date: string }) {
  return (
    <div className="space-y-6">
      {/* Celestial animation */}
      <div className="relative flex items-center justify-center py-6">
        <div className="absolute w-40 h-40 rounded-full bg-[#eeb337]/15 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-[#eeb337] animate-pulse" />
          <Moon className="w-20 h-20 text-[#eeb337]/60 drop-shadow-[0_0_15px_rgba(238,179,55,0.4)]" />
          <Sparkles className="w-8 h-8 text-[#eeb337] animate-pulse" />
        </div>
      </div>

      {/* Names */}
      <div className="space-y-2">
        <p className="font-script text-2xl sm:text-3xl text-[#fff1cf]">
          {selfIdentity}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Star className="w-3 h-3 text-[#eeb337]/50" />
          <span className="text-xs text-[#eeb337]/50 uppercase tracking-[0.3em]">Tri Âm</span>
          <Star className="w-3 h-3 text-[#eeb337]/50" />
        </div>
        <p className="font-script text-2xl sm:text-3xl text-[#f6ca62]">
          {partnerName}
        </p>
      </div>

      {/* Bond message */}
      <div className="max-w-md mx-auto p-4 rounded-xl bg-black/30 border border-[#eeb337]/15">
        <p className="font-script text-sm sm:text-base text-[#d7a96d] italic leading-relaxed">
          "{bondMessage}"
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Star className="w-3 h-3 text-[#eeb337]/40" />
        <span>Tri kỷ kết ngày {date}</span>
        <Star className="w-3 h-3 text-[#eeb337]/40" />
      </div>
    </div>
  );
}

// === Thân Hữu Ceremony (Warm flames) ===
function ThanHuuCeremony({ selfIdentity, partnerName, bondMessage, date }: { selfIdentity: string; partnerName: string; bondMessage: string; date: string }) {
  return (
    <div className="space-y-6">
      {/* Warm fire animation */}
      <div className="relative flex items-center justify-center py-6">
        <div className="absolute w-40 h-40 rounded-full bg-emerald-500/15 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-3">
          <Flame className="w-6 h-6 text-emerald-400/60 animate-pulse" />
          <Users className="w-16 h-16 text-emerald-400/50 drop-shadow-[0_0_15px_rgba(110,180,100,0.3)]" />
          <Flame className="w-6 h-6 text-emerald-400/60 animate-pulse" />
        </div>
      </div>

      {/* Names */}
      <div className="space-y-2">
        <p className="font-script text-2xl sm:text-3xl text-[#fff1cf]">
          {selfIdentity}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-10 bg-emerald-500/30" />
          <span className="text-xs text-emerald-400/50 uppercase tracking-[0.3em]">Thân Hữu</span>
          <div className="h-px w-10 bg-emerald-500/30" />
        </div>
        <p className="font-script text-2xl sm:text-3xl text-emerald-300/80">
          {partnerName}
        </p>
      </div>

      {/* Bond message */}
      <div className="max-w-md mx-auto p-4 rounded-xl bg-black/30 border border-emerald-500/15">
        <p className="font-script text-sm sm:text-base text-[#d7a96d] italic leading-relaxed">
          "{bondMessage}"
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Flame className="w-3 h-3 text-emerald-400/40" />
        <span>Thân hữu kết ngày {date}</span>
        <Flame className="w-3 h-3 text-emerald-400/40" />
      </div>
    </div>
  );
}
