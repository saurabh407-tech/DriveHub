import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createVehicle } from '@/services/vehicleApi';

const CATEGORIES = ['hatchback', 'sedan', 'suv', 'bike', 'scooter', 'van', 'luxury'] as const;
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'] as const;

const schema = z.object({
  title: z.string().trim().min(3, 'At least 3 characters').max(120),
  category: z.enum(CATEGORIES),
  make: z.string().trim().min(1, 'Required'),
  model: z.string().trim().min(1, 'Required'),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().trim().min(1, 'Required'),
  fuelType: z.enum(FUEL_TYPES),
  transmission: z.enum(['manual', 'automatic']),
  seats: z.coerce.number().int().min(1).max(60),
  perDay: z.coerce.number().min(1, 'Enter a daily rate'),
  securityDeposit: z.coerce.number().min(0),
  address: z.string().trim().min(3, 'Required'),
  city: z.string().trim().min(1, 'Required'),
  state: z.string().trim().min(1, 'Required'),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'sedan', fuelType: 'petrol', transmission: 'manual', securityDeposit: 0 },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await createVehicle({
        title: values.title,
        category: values.category,
        make: values.make,
        model: values.model,
        year: values.year,
        registrationNumber: values.registrationNumber,
        fuelType: values.fuelType,
        transmission: values.transmission,
        seats: values.seats,
        pricing: { perDay: values.perDay, securityDeposit: values.securityDeposit },
        location: { address: values.address, city: values.city, state: values.state },
      });
      navigate(`/owner/vehicles/${res.data.vehicle._id}`, { replace: true });
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message || 'Could not create vehicle. Please check the form and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">List a new vehicle</h1>
      <p className="mt-1 text-sm text-slate">
        You'll be able to add photos and documents next. Vehicles go live once verified by an admin.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 max-w-2xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Listing title" placeholder="2022 Honda City VX" error={errors.title?.message} {...register('title')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Category</label>
            <select className="rounded-lg border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink" {...register('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Fuel type</label>
            <select className="rounded-lg border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink" {...register('fuelType')}>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f[0].toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <Input label="Make" placeholder="Honda" error={errors.make?.message} {...register('make')} />
          <Input label="Model" placeholder="City" error={errors.model?.message} {...register('model')} />

          <Input label="Year" type="number" error={errors.year?.message} {...register('year')} />
          <Input
            label="Registration number"
            placeholder="DL 3C AB 1234"
            error={errors.registrationNumber?.message}
            {...register('registrationNumber')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Transmission</label>
            <select className="rounded-lg border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink" {...register('transmission')}>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
          <Input label="Seats" type="number" error={errors.seats?.message} {...register('seats')} />

          <Input label="Price per day (₹)" type="number" error={errors.perDay?.message} {...register('perDay')} />
          <Input label="Security deposit (₹)" type="number" error={errors.securityDeposit?.message} {...register('securityDeposit')} />

          <div className="sm:col-span-2">
            <Input label="Pickup address" placeholder="123 MG Road" error={errors.address?.message} {...register('address')} />
          </div>
          <Input label="City" placeholder="Gurugram" error={errors.city?.message} {...register('city')} />
          <Input label="State" placeholder="Haryana" error={errors.state?.message} {...register('state')} />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-6" isLoading={isSubmitting}>
          Save and continue
        </Button>
      </form>
    </DashboardLayout>
  );
}
