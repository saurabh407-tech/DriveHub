import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPasswordRequest } from '@/services/authApi';

const schema = z.object({ email: z.string().trim().email('Enter a valid email') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to choose a new password.">
      {sent ? (
        <div className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal-dim">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate">
        <Link to="/login" className="font-medium text-ink hover:text-route-dim">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
