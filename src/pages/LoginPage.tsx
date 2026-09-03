import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LogIn, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError('Vui lòng nhập email tài khoản của bạn.');
      return;
    }
    if (resetPassword.length < 6) {
      setResetError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setResetLoading(true);
    const { data, error: rpcError } = await supabase.rpc('user_reset_own_password', {
      p_email: resetEmail.trim().toLowerCase(),
      p_new_password: resetPassword,
    });

    if (rpcError) {
      setResetError(`Lỗi: ${rpcError.message}`);
      setResetLoading(false);
      return;
    }

    if (data && data.success) {
      setResetSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.');
      setResetLoading(false);
      setTimeout(() => {
        setShowResetForm(false);
        setResetEmail('');
        setResetPassword('');
        setResetSuccess('');
      }, 2500);
    } else {
      setResetError(data?.error || 'Đặt lại mật khẩu thất bại.');
      setResetLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-sm border border-[#eeb337]/15 bg-[#0d0807]/60 px-4 py-3 text-sm text-[#f3dca8] placeholder-[#8a6a4a]/50 transition-colors focus:border-[#eeb337]/55 focus:outline-none focus:ring-1 focus:ring-[#eeb337]/30';
  const labelClass = 'mb-1.5 block text-xs uppercase tracking-[0.18em] text-[#d7a96d]/70';

  return (
    <div className="relative mx-auto max-w-md pt-12">
      <div className="pointer-events-none absolute -inset-x-10 -top-4 -bottom-4 -z-10 rounded-[2rem] bg-gradient-to-b from-[#3d130e]/40 via-transparent to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-sm border border-[#eeb337]/25 bg-gradient-to-b from-[#24100c]/90 to-[#170b09]/95 p-8 shadow-[0_30px_80px_rgba(13,8,7,0.45)]">
        <div className="pointer-events-none absolute -top-px left-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#eeb337]/70 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#eeb337]/10 blur-3xl" />

        {showResetForm ? (
          <>
            <div className="relative mb-8 text-center">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#eeb337]/50 bg-gradient-to-br from-[#b73720] to-[#5c160f] shadow-[0_0_28px_rgba(238,179,55,0.18)]">
                <KeyRound className="h-7 w-7 text-[#fff1cf]" />
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-[#fff1cf]">Quên Mật Khẩu</h2>
              <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[#d7a96d]/60">Đặt lại mật khẩu mới</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className={labelClass}>Email tài khoản</label>
                <input
                  type="email"
                  name="reset-email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="email@example.com…"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a6a4a] transition-colors hover:text-[#f6ca62]"
                    aria-label={showResetPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-sm border border-[#eeb337]/45 bg-gradient-to-r from-[#8f2418] to-[#b73720] py-3.5 font-bold uppercase tracking-[0.18em] text-[#fff1cf] shadow-[0_12px_30px_rgba(92,22,15,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(238,179,55,0.18)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetLoading ? 'Đang đặt lại…' : 'Đặt Lại Mật Khẩu'}
              </button>
            </form>

            {resetError && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#b73720]/40 bg-[#b73720]/15 p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#f2a06b]" />
                <p className="text-xs text-[#f2a06b]">{resetError}</p>
              </div>
            )}

            {resetSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#eeb337]/35 bg-[#eeb337]/10 p-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#f6ca62]" />
                <p className="text-xs text-[#f6ca62]">{resetSuccess}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowResetForm(false);
                setResetError('');
                setResetSuccess('');
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-[#8a6a4a] transition-colors hover:text-[#f6ca62]"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </button>
          </>
        ) : (
          <>
            <div className="relative mb-8 text-center">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#eeb337]/50 bg-gradient-to-br from-[#b73720] to-[#5c160f] shadow-[0_0_28px_rgba(238,179,55,0.18)]">
                <LogIn className="h-7 w-7 text-[#fff1cf]" />
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-[#fff1cf]">Đăng Nhập</h2>
              <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[#d7a96d]/60">Trở lại Trùng Hoan Tái</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="email@example.com…"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a6a4a] transition-colors hover:text-[#f6ca62]"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm border border-[#eeb337]/45 bg-gradient-to-r from-[#8f2418] to-[#b73720] py-3.5 font-bold uppercase tracking-[0.18em] text-[#fff1cf] shadow-[0_12px_30px_rgba(92,22,15,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(238,179,55,0.18)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Đang kết nối…' : 'Đăng Nhập'}
              </button>
            </form>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#b73720]/40 bg-[#b73720]/15 p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#f2a06b]" />
                <p className="text-xs text-[#f2a06b]">{error}</p>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(true);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="text-sm text-[#8a6a4a] transition-colors hover:text-[#f6ca62]"
              >
                Quên mật khẩu?
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-[#8a6a4a]">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-[#f6ca62] transition-colors hover:text-[#fff1cf]">
                Đăng ký nhập vụ
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
