import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPasswordRequest } from '@/services/authApi';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!email || !token) {
    return (
      <AuthLayout title="Invalid reset link" subtitle="This password reset link is missing required information.">
        <Link to="/forgot-password" className="text-sm font-medium text-route-dim hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPasswordRequest({ email, token, password: values.password });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle={`Resetting password for ${email}.`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {error && (
          <p role="alert" className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
