import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPasswordRequest } from '@/services/authApi';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const emailValue = watch('email');

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await forgotPasswordRequest(values.email);
    } finally {
      setIsSubmitting(false);
      setSent(true);
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
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />
      </div>

      {/* Luminous Shimmer Border Card Wrapper */}
      <div className="relative z-10 w-full max-w-[460px] p-[1.5px] rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] animate-fadeIn">
        <div className="auth-border-glow-blur" aria-hidden="true" />
        <div className="auth-border-glow" aria-hidden="true" />

        {/* Clean, Centered Glassmorphic Card */}
        <section className="relative w-full rounded-[30.5px] bg-[#0c111a]/70 backdrop-blur-2xl border border-white/20 p-5 sm:p-9 text-center">
          {/* Brand Logo */}
          <div className="mb-5 flex justify-center">
            <Link to="/" className="transition-transform duration-300 hover:scale-105">
              <img
                src="/drivehub-logo.png"
                alt="DriveHub"
                className="h-10 w-auto object-contain drop-shadow"
              />
            </Link>
          </div>

          {/* Icon Badge */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-400 shadow-lg shadow-amber-500/10">
            {sent ? <CheckCircle2 className="h-7 w-7 text-emerald-400" /> : <KeyRound className="h-7 w-7" />}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            {sent ? 'Check Your Inbox' : 'Reset Password'}
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto leading-relaxed mb-6">
            {sent
              ? `If an account exists for ${emailValue}, a recovery link has been sent.`
              : "Enter your registered email address and we'll send you a password reset link."}
          </p>

          {sent ? (
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full rounded-2xl py-3.5 text-base font-bold text-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_10px_25px_rgba(255,176,32,0.35)] hover:scale-[1.01] transition-all text-center"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <div
                  className={`relative flex items-center rounded-2xl border bg-white/[0.08] px-4 py-3 transition-all backdrop-blur-md ${
                    errors.email
                      ? 'border-red-400/80 ring-2 ring-red-400/20'
                      : 'border-white/20 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/25'
                  }`}
                >
                  <Mail className="h-5 w-5 text-white/50 shrink-0 mr-3" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm font-medium text-white placeholder-white/45 focus:outline-none"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-red-300 px-1">{errors.email.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-2xl py-3.5 text-base font-bold text-black tracking-wide bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_10px_25px_rgba(255,176,32,0.35)] hover:shadow-[0_12px_32px_rgba(255,176,32,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="pt-2 border-t border-white/10 mt-1 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
