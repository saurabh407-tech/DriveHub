// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { AuthLayout } from '@/components/layout/AuthLayout';
// import { Input } from '@/components/ui/Input';
// import { Button } from '@/components/ui/Button';
// import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
// import { loginUser, clearAuthError } from '@/redux/slices/authSlice';
// import { dashboardPathForRole } from '@/routes/roleRedirect';

// const schema = z.object({
//   email: z.string().trim().email('Enter a valid email'),
//   password: z.string().min(1, 'Password is required'),
// });
// type FormValues = z.infer<typeof schema>;

// export default function LoginPage() {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { status, error } = useAppSelector((s) => s.auth);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<FormValues>({ resolver: zodResolver(schema) });

//   const onSubmit = async (values: FormValues) => {
//     dispatch(clearAuthError());
//     const result = await dispatch(loginUser(values));
//     if (loginUser.fulfilled.match(result)) {
//       const role = result.payload.data.user.role;
//       const redirectTo = (location.state as { from?: string } | null)?.from;
//       navigate(redirectTo || dashboardPathForRole(role), { replace: true });
//     }
//   };

//   return (
//     <AuthLayout title="Welcome back" subtitle="Log in to manage your bookings, listings, or fleet.">
//       <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
//         <Input
//           label="Email address"
//           type="email"
//           autoComplete="email"
//           placeholder="you@example.com"
//           error={errors.email?.message}
//           {...register('email')}
//         />
//         <Input
//           label="Password"
//           type="password"
//           autoComplete="current-password"
//           placeholder="••••••••"
//           error={errors.password?.message}
//           {...register('password')}
//         />

//         <div className="flex justify-end">
//           <Link to="/forgot-password" className="text-xs font-medium text-route-dim hover:underline">
//             Forgot password?
//           </Link>
//         </div>

//         {error && (
//           <p role="alert" className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
//             {error}
//           </p>
//         )}

//         <Button type="submit" fullWidth isLoading={status === 'loading'}>
//           Log in
//         </Button>
//       </form>

//       <p className="mt-6 text-center text-sm text-slate">
//         Don't have an account?{' '}
//         <Link to="/register" className="font-medium text-ink hover:text-route-dim">
//           Create one
//         </Link>
//       </p>
//     </AuthLayout>
//   );
// }




import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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

  const { status, error } = useAppSelector((s) => s.auth);

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#fdf4f8] via-[#ae84aa] to-[#e8d9ee] px-4 py-10">

      {/* Background Decorative Circles */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d99bd0]/30 blur-3xl" />

      <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#b98ad0]/25 blur-3xl" />

      {/* Login Card */}
      <section className="relative w-full max-w-md rounded-3xl border border-white/70 bg-fuchsia-200 p-7 shadow-2xl backdrop-blur-xl sm:p-10">

        {/* Logo */}
        <div className="mb-7 flex justify-center">
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
          >
            <img
              src="/drivehub-logo.png"
              alt="DriveHub Logo"
              className="h-14 w-14 rounded-2xl object-contain"
            />

            <span className="text-3xl font-extrabold tracking-tight text-[#241b2f]">
              Drive<span className="text-[#8b4d9b]">Hub</span>
            </span>
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241b2f]">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage your bookings, vehicles, and rentals.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
        >
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Forgot Password */}
          <div className="-mt-1 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-[#8b4d9b] transition-colors hover:text-[#5f286d] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {/* Login Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={status === 'loading'}
          >
            Log in
          </Button>
        </form>

        {/* Register */}
        <div className="mt-7 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#8b4d9b] transition-colors hover:text-[#5f286d] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}