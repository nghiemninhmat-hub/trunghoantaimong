import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  UserPlus, AlertCircle, CheckCircle2, Lock, ChevronLeft, ChevronRight,
  Sparkles, Heart, Brain, Zap,
} from 'lucide-react';
import {
  STATUS_TAGS, MENTAL_SUB_TAGS, MENTAL_TAG_DESCRIPTIONS,
  SKILL_FIELDS, emptySkill, type SkillFormData,
} from '@/lib/skillTags';

const TOTAL_STEPS = 5; // 1 account + 4 skills

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ocName, setOcName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<SkillFormData[]>([emptySkill, emptySkill, emptySkill, emptySkill]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  const wordCount = bio.trim() ? bio.trim().split(/\s+/).length : 0;

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('registration_open')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => setRegistrationOpen(data ? data.registration_open : false));
  }, []);

  const updateSkill = (slot: number, field: keyof SkillFormData, value: string | number) => {
    setSkills(prev => {
      const next = [...prev];
      next[slot] = { ...next[slot], [field]: value };
      return next;
    });
  };

  const isStepValid = (): boolean => {
    if (step === 1) return email.trim() && password.length >= 6 && ocName.trim() && wordCount <= 100;
    const skillSlot = step - 2;
    const s = skills[skillSlot];
    return s.name.trim() !== '';
  };

  const handleRegister = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signUpError, data } = await signUp(normalizedEmail, password);

    if (signUpError) {
      setError(`Lỗi: ${signUpError}`);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const anonymousName = `Vô Danh #${Math.floor(Math.random() * 9000) + 1000}`;
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: normalizedEmail,
          oc_name: ocName,
          gender,
          bio,
          avatar_url: avatarUrl || null,
          hua_tien: 300,
          cong_duc: 30,
          am_duc: 0,
          is_approved: false,
          review_status: 'pending',
          anonymous_name: anonymousName,
          password,
        },
      ]);

      if (profileError) {
        setError(`Lỗi tạo hồ sơ: ${profileError.message}`);
        setLoading(false);
        return;
      }

      const skillRows = skills.map((s, i) => ({
        user_id: data.user.id,
        slot: i + 1,
        name: s.name,
        usage_detail: s.usage_detail,
        effect: s.effect,
        tradeoff: s.tradeoff,
        cong_duc_cost: s.cong_duc_cost || 0,
        am_duc_cost: s.am_duc_cost || 0,
        duration: s.duration,
        mental_effect: s.mental_effect,
        mental_duration: s.mental_duration || 0,
        health_effect: s.health_effect,
        health_duration: s.health_duration || 0,
        spiritual_effect: s.spiritual_effect,
        spiritual_duration: s.spiritual_duration || 0,
        ghost_level_effect: s.ghost_level_effect,
        destruction_percent: Math.min(100, Math.max(0, s.destruction_percent || 0)),
      })).filter(s => s.name.trim() !== '');

      if (skillRows.length > 0) {
        const { error: skillError } = await supabase.from('character_skills').insert(skillRows);
        if (skillError) {
          setError(`Hồ sơ đã tạo nhưng lỗi khi lưu kỹ năng: ${skillError.message}`);
          setLoading(false);
          return;
        }
      }

      setMessage('Đăng ký thành công! Vui lòng chờ Quản trị viên phê duyệt tài khoản.');
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  const inputClass =
    'w-full rounded-sm border border-[#eeb337]/15 bg-[#0d0807]/60 px-4 py-3 text-sm text-[#f3dca8] placeholder-[#8a6a4a]/50 transition-colors focus:border-[#eeb337]/55 focus:outline-none focus:ring-1 focus:ring-[#eeb337]/30';
  const labelClass = 'mb-1.5 block text-xs uppercase tracking-[0.18em] text-[#d7a96d]/70';

  if (registrationOpen === null) {
    return <div className="mx-auto max-w-lg pt-16 text-center text-[#8a6a4a]">Đang tải…</div>;
  }

  const renderSkillForm = (slot: number) => {
    const s = skills[slot];
    return (
      <div className="space-y-4">
        {SKILL_FIELDS.map(field => {
          const val = s[field.key];
          if (field.type === 'textarea') {
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <textarea
                  placeholder={field.placeholder || ''}
                  value={val as string}
                  onChange={e => updateSkill(slot, field.key, e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
            );
          }
          if (field.type === 'number') {
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <input
                  type="number"
                  min={0}
                  max={field.max}
                  value={val as number}
                  onChange={e => updateSkill(slot, field.key, Math.min(field.max || 999999, Math.max(0, parseInt(e.target.value) || 0)))}
                  className={inputClass}
                />
              </div>
            );
          }
          if (field.type === 'select') {
            return (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <select value={val as string} onChange={e => updateSkill(slot, field.key, e.target.value)} className={`${inputClass} appearance-none`}>
                  <option value="">— Chọn mức —</option>
                  {STATUS_TAGS.map(t => <option key={t.value} value={t.value}>{t.label} ({t.value})</option>)}
                </select>
              </div>
            );
          }
          if (field.type === 'mental') {
            const parentTag = STATUS_TAGS.find(t => t.value === s.mental_effect);
            const subTags = MENTAL_SUB_TAGS.filter(t => t.parent === s.mental_effect);
            return (
              <div key={field.key} className="space-y-3">
                <div>
                  <label className={labelClass}>{field.label} — chọn mức ảnh hưởng</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_TAGS.map(tag => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => updateSkill(slot, 'mental_effect', tag.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${s.mental_effect === tag.value ? tag.activeClass : `${tag.idleClass} hover:scale-105`}`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                  {parentTag && (
                    <p className="mt-2 text-[11px] text-gray-500 italic leading-5">{MENTAL_TAG_DESCRIPTIONS[parentTag.value]}</p>
                  )}
                </div>
                {subTags.length > 0 && (
                  <div>
                    <label className={labelClass}>Trạng thái cụ thể</label>
                    <div className="flex flex-wrap gap-1.5">
                      {subTags.map(sub => (
                        <button
                          key={sub.value}
                          type="button"
                          onClick={() => updateSkill(slot, 'mental_effect', sub.value)}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${s.mental_effect === sub.value ? `${parentTag!.activeClass} border-amber-300/50` : 'border-white/10 bg-black/30 text-gray-500 hover:border-amber-300/30 hover:text-amber-200'}`}
                        >
                          {sub.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={field.key}>
              <label className={labelClass}>{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder || ''}
                value={val as string}
                onChange={e => updateSkill(slot, field.key, e.target.value)}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const stepIcons = [UserPlus, Zap, Zap, Zap, Zap];
  const stepLabels = ['Tài Khoản', 'Kỹ Năng 01', 'Kỹ Năng 02', 'Kỹ Năng 03', 'Kỹ Năng 04'];

  return (
    <div className="relative mx-auto max-w-2xl pt-8">
      <div className="pointer-events-none absolute -inset-x-10 -top-4 -bottom-4 -z-10 rounded-[2rem] bg-gradient-to-b from-[#3d130e]/40 via-transparent to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-sm border border-[#eeb337]/25 bg-gradient-to-b from-[#24100c]/90 to-[#170b09]/95 p-6 sm:p-8 shadow-[0_30px_80px_rgba(13,8,7,0.45)]">
        <div className="pointer-events-none absolute -top-px left-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#eeb337]/70 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#eeb337]/10 blur-3xl" />

        <div className="relative mb-6 text-center">
          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#eeb337]/50 bg-gradient-to-br from-[#b73720] to-[#5c160f] shadow-[0_0_28px_rgba(238,179,55,0.18)]">
            <UserPlus className="h-6 w-6 text-[#fff1cf]" />
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-[#fff1cf]">Đăng Ký Nhập Vụ</h2>
          <p className="mt-1.5 text-xs uppercase tracking-[0.28em] text-[#d7a96d]/60">Trùng Hoan Tái</p>
        </div>

        {!registrationOpen ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#b73720]/40 bg-[#b73720]/15">
              <Lock className="h-6 w-6 text-[#f2a06b]" />
            </div>
            <p className="font-serif text-lg font-bold text-[#fff1cf]">Cổng Đăng Ký Đã Khóa</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#c9b493]/70">
              Hiện tại hệ thống chưa mở cổng đăng ký. Vui lòng chờ Quản trị viên mở lại.
            </p>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="mb-6 flex items-center justify-center gap-1.5 sm:gap-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const StepIcon = stepIcons[i];
                return (
                  <div key={i} className="flex items-center">
                    <div
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border text-[10px] sm:text-xs font-bold transition-all ${
                        step === i + 1
                          ? 'border-[#eeb337] bg-[#670201] text-[#fff1cf] shadow-[0_0_12px_rgba(238,179,55,0.3)]'
                          : step > i + 1
                          ? 'border-[#eeb337]/40 bg-[#eeb337]/10 text-[#f6ca62]'
                          : 'border-white/10 bg-black/30 text-gray-600'
                      }`}
                    >
                      {step > i + 1 ? '✓' : <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </div>
                    {i < TOTAL_STEPS - 1 && (
                      <div className={`h-px w-4 sm:w-8 ${step > i + 1 ? 'bg-[#eeb337]/40' : 'bg-white/10'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mb-5 text-center text-xs uppercase tracking-[0.2em] text-[#d7a96d]/70">
              Bước {step}/{TOTAL_STEPS} — {stepLabels[step - 1]}
            </p>

            {/* Step 1: Account */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" autoComplete="email" spellCheck={false} placeholder="email@example.com…" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mật khẩu</label>
                  <input type="password" name="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Danh tính OC</label>
                  <input type="text" name="oc-name" autoComplete="off" placeholder="Tên nhân vật của bạn…" value={ocName} onChange={e => setOcName(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Giới tính</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className={`${inputClass} appearance-none`}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={labelClass}>Trích dẫn</label>
                    <span className={`text-xs ${wordCount > 100 ? 'text-[#f2a06b]' : 'text-[#8a6a4a]/70'}`}>{wordCount}/100 từ</span>
                  </div>
                  <textarea placeholder="Câu nói tiêu biểu của nhân vật (tối đa 100 từ)…" value={bio} onChange={e => setBio(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Link ảnh đại diện</label>
                  <input type="text" name="avatar-url" autoComplete="url" placeholder="https://…" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            {/* Steps 2-5: Skills */}
            {step >= 2 && step <= 5 && renderSkillForm(step - 2)}

            {/* Navigation */}
            <div className="mt-6 flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 rounded-sm border border-[#eeb337]/30 bg-[#0d0807]/60 px-4 py-3 text-sm font-semibold text-[#d7a96d] transition-all hover:bg-[#1a0c0a]"
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!isStepValid()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-[#eeb337]/45 bg-gradient-to-r from-[#8f2418] to-[#b73720] py-3 font-bold uppercase tracking-[0.18em] text-[#fff1cf] shadow-[0_12px_30px_rgba(92,22,15,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(238,179,55,0.18)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tiếp <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-[#eeb337]/45 bg-gradient-to-r from-[#8f2418] to-[#b73720] py-3 font-bold uppercase tracking-[0.18em] text-[#fff1cf] shadow-[0_12px_30px_rgba(92,22,15,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(238,179,55,0.18)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Đang gửi hồ sơ…' : 'Gửi Hồ Sơ Phê Duyệt'}
                </button>
              )}
            </div>

            <p className="mt-3 text-center text-[10px] text-gray-600">
              {step >= 2 && step <= 5 && 'Để trống tên kỹ năng nếu không dùng slot này.'}
            </p>
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#b73720]/40 bg-[#b73720]/15 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#f2a06b]" />
            <p className="text-xs text-[#f2a06b]">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#eeb337]/35 bg-[#eeb337]/10 p-3">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#f6ca62]" />
            <p className="text-xs text-[#f6ca62]">{message}</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[#8a6a4a]">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-[#f6ca62] transition-colors hover:text-[#fff1cf]">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
