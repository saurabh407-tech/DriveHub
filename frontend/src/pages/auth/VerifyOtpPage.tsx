import { useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/hooks/useAppRedux';
import { verifyOtp } from '@/redux/slices/authSlice';
import { resendOtpRequest } from '@/services/authApi';

export default function VerifyOtpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  if (!email) {
    return (
      <AuthLayout title="Verify your email" subtitle="We couldn't find an email to verify.">
        <p className="text-sm text-slate">
          Please{' '}
          <Link to="/register" className="font-medium text-route-dim hover:underline">
            register again
          </Link>{' '}
          or{' '}
          <Link to="/login" className="font-medium text-route-dim hover:underline">
            log in
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, i) => pasted[i] || ''));
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const onSubmit = async () => {
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await dispatch(verifyOtp({ email, otp }));
    setIsSubmitting(false);
    if (verifyOtp.fulfilled.match(result)) {
      navigate('/login', { replace: true, state: { verified: true } });
    } else {
      setError((result.payload as string) || 'Verification failed');
    }
  };

  const onResend = async () => {
    setResendState('sending');
    try {
      await resendOtpRequest(email);
      setResendState('sent');
    } catch {
      setResendState('idle');
      setError('Could not resend code, please try again');
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle={`Enter the 6-digit code we sent to ${email}.`}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
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
              className="h-14 w-12 rounded-lg border border-paper-line bg-paper-soft text-center font-mono text-xl font-medium text-ink focus:outline-none focus:ring-2 focus:ring-route/40 focus:border-route"
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}

        <Button onClick={onSubmit} fullWidth isLoading={isSubmitting}>
          Verify email
        </Button>

        <button
          type="button"
          onClick={onResend}
          disabled={resendState !== 'idle'}
          className="text-center text-sm font-medium text-route-dim hover:underline disabled:opacity-60"
        >
          {resendState === 'sent' ? 'Code resent' : resendState === 'sending' ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </AuthLayout>
  );
}
