import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppRedux';
import { verifyOtp } from '@/redux/slices/authSlice';
import { resendOtpRequest } from '@/services/authApi';

export default function VerifyOtpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string; from?: string } | null)?.email;
  const from = (location.state as { from?: string } | null)?.from;

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input automatically on mount
  useEffect(() => {
    if (email && inputsRef.current[0]) {
      inputsRef.current[0]?.focus();
    }
  }, [email]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!email) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12 text-white selection:bg-route selection:text-white">
        {/* Full-Screen Scenic Cinematic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <img
            src="/frames/frame_0180.jpg"
            alt=""
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
        </div>

        {/* Luminous Shimmer Border Card Wrapper */}
        <div className="relative z-10 w-full max-w-[440px] p-[1.5px] rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
          <div className="auth-border-glow-blur" aria-hidden="true" />
          <div className="auth-border-glow" aria-hidden="true" />

          <section className="relative w-full rounded-[30.5px] bg-[#0c111a]/70 backdrop-blur-2xl border border-white/20 p-8 text-center">
            <div className="mb-4 flex justify-center">
              <Link to="/">
                <img
                  src="/drivehub-logo.png"
                  alt="DriveHub"
                  className="h-10 w-auto object-contain drop-shadow"
                />
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">No Email Found</h1>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              We couldn't detect an active verification session. Please register or log in to continue.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/register"
                className="w-full rounded-2xl py-3 text-sm font-bold text-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:scale-[1.01] transition-all text-center"
              >
                Go to Sign Up
              </Link>
              <Link
                to="/login"
                className="w-full rounded-2xl py-3 text-sm font-semibold text-white/80 bg-white/10 hover:bg-white/15 hover:text-white transition-all text-center"
              >
                Back to Sign In
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError(null);
    if (clean && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    setDigits(next);
    setError(null);
    const nextFocus = Math.min(pasted.length, 5);
    inputsRef.current[nextFocus]?.focus();
  };

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await dispatch(verifyOtp({ email, otp }));
    setIsSubmitting(false);

    if (verifyOtp.fulfilled.match(result)) {
      const role = result.payload.data.user.role;
      const target = from || (role === 'owner' ? '/owner' : '/vehicles');
      navigate(target, { replace: true });
    } else {
      setError((result.payload as string) || 'Invalid or expired verification code');
    }
  };

  const onResend = async () => {
    if (resendState === 'sending' || resendCountdown > 0) return;
    setResendState('sending');
    setError(null);
    try {
      await resendOtpRequest(email);
      setResendState('sent');
      setResendCountdown(60); // 60 seconds cooldown
    } catch {
      setResendState('idle');
      setError('Could not resend code, please try again.');
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12 text-white selection:bg-route selection:text-white">
      {/* Full-Screen Scenic Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src="/frames/frame_0180.jpg"
          alt=""
          className="w-full h-full object-cover scale-105"
        />
        {/* Subtle Dark Vignette Overlay for Crisp Focus */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />
      </div>

      {/* Luminous Shimmer Border Card Wrapper */}
      <div className="relative z-10 w-full max-w-[460px] p-[1.5px] rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] animate-fadeIn">
        {/* Rotating Luminous Light Beams */}
        <div className="auth-border-glow-blur" aria-hidden="true" />
        <div className="auth-border-glow" aria-hidden="true" />

        {/* Clean, Centered Glassmorphic Verification Card */}
        <section className="relative w-full rounded-[30.5px] bg-[#0c111a]/70 backdrop-blur-2xl border border-white/20 p-7 sm:p-9 text-center">
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

          {/* Centered Icon Badge */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-400 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="h-7 w-7" />
          </div>

          {/* Clean Focused Header */}
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto leading-relaxed mb-6">
            Enter the 6-digit verification code sent to
            <span className="block mt-1 font-semibold text-amber-300 break-all">{email}</span>
          </p>

          {/* OTP Input Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* 6-Digit OTP Input Boxes */}
            <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${i + 1}`}
                  className={`h-14 w-11 sm:h-14 sm:w-13 rounded-2xl border bg-white/[0.08] backdrop-blur-md text-center font-mono text-2xl font-bold transition-all focus:outline-none ${
                    d
                      ? 'border-amber-400 text-amber-300 bg-amber-500/10 shadow-sm shadow-amber-500/20'
                      : 'border-white/20 text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2 text-xs text-red-200"
              >
                {error}
              </p>
            )}

            {/* Premium Gradient Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || digits.join('').length !== 6}
              className="mt-1 w-full rounded-2xl py-3.5 text-base font-bold text-black tracking-wide bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_10px_25px_rgba(255,176,32,0.35)] hover:shadow-[0_12px_32px_rgba(255,176,32,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                'Verify & Proceed'
              )}
            </button>

            {/* Resend Code Section */}
            <div className="flex items-center justify-center gap-2 text-xs text-white/60 pt-1">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                onClick={onResend}
                disabled={resendState === 'sending' || resendCountdown > 0}
                className="font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors disabled:opacity-50 disabled:no-underline flex items-center gap-1"
              >
                {resendState === 'sending' ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Sending…
                  </>
                ) : resendCountdown > 0 ? (
                  `Resend in ${resendCountdown}s`
                ) : (
                  'Resend code'
                )}
              </button>
            </div>

            {/* Back to Login / Register Link */}
            <div className="pt-2 border-t border-white/10 mt-1">
              <Link
                to="/login"
                state={{ from }}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
