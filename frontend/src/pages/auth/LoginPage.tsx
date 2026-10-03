import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { loginUser, clearAuthError } from '@/redux/slices/authSlice';
import { dashboardPathForRole } from '@/routes/roleRedirect';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { status, error } = useAppSelector((s) => s.auth);
  const alertMessage = (location.state as { alert?: string; from?: string } | null)?.alert;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    dispatch(clearAuthError());

    const result = await dispatch(loginUser(values));

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.data.user.role;

      const redirectTo = (
        location.state as { from?: string } | null
      )?.from;

      navigate(
        redirectTo || dashboardPathForRole(role),
        { replace: true }
      );
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-3.5 sm:px-4 py-8 sm:py-12 text-white selection:bg-route selection:text-white">
      {/* Full-Screen Scenic Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src="/frames/frame_0180.jpg"
          alt=""
          className="w-full h-full object-cover scale-105"
        />
        {/* Subtle Dark Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      </div>

      {/* Luminous Shimmer Border Card Wrapper */}
      <div className="relative z-10 w-full max-w-[430px] p-[1.5px] rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
        {/* Rotating Luminous Light Beams for the Card Perimeter */}
        <div className="auth-border-glow-blur" aria-hidden="true" />
        <div className="auth-border-glow" aria-hidden="true" />

        {/* Glassmorphic Authentication Card */}
        <section className="relative w-full rounded-[30.5px] bg-[#0c111a]/60 backdrop-blur-2xl border border-white/20 p-5 sm:p-9">
          {/* Brand Logo */}
          <div className="mb-4 flex justify-center">
            <Link to="/" className="transition-transform duration-300 hover:scale-105">
              <img
                src="/drivehub-logo.png"
                alt="DriveHub"
                className="h-10 w-auto object-contain drop-shadow"
              />
            </Link>
          </div>

          {/* Heading & Subtitle exactly matching reference */}
          <div className="mb-5 text-left">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Login
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/75">
              Welcome back please login to your account
            </p>
          </div>

          {/* Access Restriction Alert Banner */}
          {alertMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-400/50 bg-amber-500/15 p-3.5 text-xs text-amber-200 backdrop-blur-md shadow-lg shadow-amber-500/10 animate-fadeIn">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Authentication Required</p>
                <p className="mt-0.5 text-white/90 leading-relaxed">{alertMessage}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {/* Email / Username Input */}
            <div className="flex flex-col gap-1.5">
              <div
                className={`relative flex items-center rounded-2xl border bg-white/[0.08] px-4 py-3.5 transition-all backdrop-blur-md ${
                  errors.email
                    ? 'border-red-400/80 ring-2 ring-red-400/20'
                    : 'border-white/20 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25'
                }`}
              >
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="User Name or Email"
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-white/45 focus:outline-none"
                  {...register('email')}
                />
                <User className="h-5 w-5 text-white/60 shrink-0 ml-2" aria-hidden="true" />
              </div>
              {errors.email && (
                <span className="text-xs text-red-300 px-1">{errors.email.message}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div
                className={`relative flex items-center rounded-2xl border bg-white/[0.08] px-4 py-3.5 transition-all backdrop-blur-md ${
                  errors.password
                    ? 'border-red-400/80 ring-2 ring-red-400/20'
                    : 'border-white/20 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25'
                }`}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-white/45 focus:outline-none"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-white/60 hover:text-white shrink-0 ml-2 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-300 px-1">{errors.password.message}</span>
              )}
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-white/80 hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-400 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-white/70 hover:text-amber-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Server Error Message */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-xs text-red-200"
              >
                {error}
              </p>
            )}

            {/* Premium Gradient CTA Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-2 w-full rounded-2xl py-3.5 text-base font-bold text-black tracking-wide bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_10px_25px_rgba(255,176,32,0.35)] hover:shadow-[0_12px_32px_rgba(255,176,32,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-sm text-white/75">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              state={location.state}
              className="font-bold text-white hover:text-amber-400 transition-colors"
            >
              Signup
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}