

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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

  const { status, error } = useAppSelector((s) => s.auth);

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
        },
        replace: true,
      });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fdf4f8] via-[#caaac7] to-[#e8d9ef] px-4 py-8">

      {/* Background glow */}
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#d99bd0]/30 blur-3xl" />

      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#a978c5]/25 blur-3xl" />

      {/* Full Width Registration Banner */}
<div className="relative z-20 mb-7 w-full overflow-hidden border-y border-white/60 bg-gradient-to-r from-[#7c3f8c] via-[#a65aa8] to-[#7c3f8c] py-3 shadow-lg">

  <div className="animate-marquee whitespace-nowrap text-base font-bold tracking-wide text-white">

    ✨ Join DriveHub Today — Your Journey Starts Here 🚗
    &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
    Rent Your Perfect Ride with Ease
    &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
    List Your Vehicle and Start Earning 💰
    &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
    Safe • Simple • Smart Mobility

  </div>

</div>
      {/* Register Card */}
      <section className="relative z-10 mx-auto w-full max-w-lg rounded-3xl border border-white/80 bg-fuchsia-200 p-6 shadow-2xl backdrop-blur-xl sm:p-9">

        {/* Logo */}
        <div className="mb-5 flex justify-center">

          <Link
            to="/"
            className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
          >
            <img
              src="/drivehub-logo.png"
              alt="DriveHub Logo"
              className="h-12 w-12 rounded-2xl object-contain"
            />

            <span className="text-2xl font-extrabold tracking-tight text-[#241b2f]">
              Drive<span className="text-[#8b4d9b]">Hub</span>
            </span>

          </Link>

        </div>

        {/* Heading */}
        <div className="mb-6 text-center">

          <h1 className="text-3xl font-extrabold tracking-tight text-[#241b2f]">
            Create Your Account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Join DriveHub and start renting vehicles or earning from your own vehicle.
          </p>

        </div>

        {/* Register Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >

          {/* Role Selection */}
          <div className="flex flex-col gap-2">

            <span className="text-sm font-bold text-[#241b2f]">
              How would you like to use DriveHub?
            </span>

            <div className="grid grid-cols-2 gap-3">

              {(['customer', 'owner'] as const).map((r) => (

                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setValue('role', r, {
                      shouldValidate: true,
                    })
                  }
                  className={clsx(
                    'rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300',
                    role === r
                      ? 'scale-[1.02] border-[#8b4d9b] bg-[#f5e4f5] text-[#5f286d] shadow-md'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-[#b879b5] hover:shadow-sm'
                  )}
                >

                  <span className="block text-xl">
                    {r === 'customer' ? '🚗' : '💰'}
                  </span>

                  <span className="mt-1 block">
                    {r === 'customer'
                      ? 'Rent a Vehicle'
                      : 'List My Vehicle'}
                  </span>

                </button>

              ))}

            </div>

          </div>

          {/* Name */}
          <Input
            label="Full Name"
            autoComplete="name"
            placeholder="Enter your full name"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Password */}
          <Input
            label="Create Password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Password hint */}
          <p className="-mt-2 text-xs text-slate-400">
            Use at least 8 characters and include one number.
          </p>

          {/* Server error */}
          {error && (

            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>

          )}

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            isLoading={status === 'loading'}
          >
            Create Account
          </Button>

        </form>

        {/* Login */}
        <div className="mt-6 border-t border-slate-200 pt-5 text-center">

          <p className="text-sm text-slate-500">

            Already have an account?{' '}

            <Link
              to="/login"
              className="font-bold text-[#8b4d9b] transition-colors hover:text-[#5f286d] hover:underline"
            >
              Log in
            </Link>

          </p>

        </div>

      </section>

    </main>
  );
}