import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { registerUser, clearAuthError } from '@/redux/slices/authSlice';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .regex(/\d/, 'Password must include at least one number'),
  role: z.enum(['customer', 'owner']),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const { status, error } = useAppSelector((s) => s.auth);
  const alertMessage = (location.state as { alert?: string; from?: string } | null)?.alert;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'customer',
    },
  });

  const role = watch('role');

  const onSubmit = async (values: FormValues) => {
    dispatch(clearAuthError());

    const result = await dispatch(registerUser(values));

    if (registerUser.fulfilled.match(result)) {
      navigate('/verify-otp', {
        state: {
          email: values.email,
          from: (location.state as { from?: string } | null)?.from,
        },
        replace: true,
      });
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
        {/* Subtle Dark Vignette Overlay for Contrast */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      </div>

      {/* Luminous Shimmer Border Card Wrapper */}
      <div className="relative z-10 w-full max-w-[460px] p-[1.5px] rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
        {/* Rotating Luminous Light Beams */}
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

          {/* Heading & Subtitle */}
          <div className="mb-5 text-left">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Create Account
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/75">
              Join DriveHub to rent vehicles or start earning today
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

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5">
            {/* Role Selection Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {(['customer', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue('role', r, { shouldValidate: true })}
                  className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    role === r
                      ? 'border-amber-400 bg-amber-500/25 text-white shadow-md shadow-amber-500/20 scale-[1.01]'
                      : 'border-white/15 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{r === 'customer' ? '🚗' : '💼'}</span>
                  <span>{r === 'customer' ? 'Rent a Vehicle' : 'List My Fleet'}</span>
                </button>
              ))}
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <div
                className={`relative flex items-center rounded-2xl border bg-white/[0.08] px-4 py-3 transition-all backdrop-blur-md ${
                  errors.name
                    ? 'border-red-400/80 ring-2 ring-red-400/20'
                    : 'border-white/20 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25'
                }`}
              >
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-white/45 focus:outline-none"
                  {...register('name')}
                />
                <User className="h-5 w-5 text-white/60 shrink-0 ml-2" aria-hidden="true" />
              </div>
              {errors.name && (
                <span className="text-xs text-red-300 px-1">{errors.name.message}</span>
              )}
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <div
                className={`relative flex items-center rounded-2xl border bg-white/[0.08] px-4 py-3 transition-all backdrop-blur-md ${
                  errors.email
                    ? 'border-red-400/80 ring-2 ring-red-400/20'
                    : 'border-white/20 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25'
                }`}
              >
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Email Address"
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-white/45 focus:outline-none"
                  {...register('email')}
                />
                <Mail className="h-5 w-5 text-white/60 shrink-0 ml-2" aria-hidden="true" />
              </div>
              {errors.email && (
                <span className="text-xs text-red-300 px-1">{errors.email.message}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <div
                className={`relative flex items-center rounded-2xl border bg-white/[0.08] px-4 py-3 transition-all backdrop-blur-md ${
                  errors.password
                    ? 'border-red-400/80 ring-2 ring-red-400/20'
                    : 'border-white/20 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25'
                }`}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Password (min 8 chars, 1 number)"
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

            {/* Server Error Message */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2 text-xs text-red-200"
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
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-5 text-center text-sm text-white/75">
            Already have an account?{' '}
            <Link
              to="/login"
              state={location.state}
              className="font-bold text-white hover:text-amber-400 transition-colors"
            >
              Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}