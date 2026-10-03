import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Card';
import { updateUser } from '@/redux/slices/authSlice';
import { getMyProfile, updateProfile, uploadAvatar, getUserStats } from '@/services/userApi';
import type { UserStats } from '@/services/userApi';
import {
  User as UserIcon,
  Mail,
  MapPin,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  Car,
  Clock,
  Wallet,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [addressLine, setAddressLine] = useState(user?.address?.line1 || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [pincode, setPincode] = useState(user?.address?.pincode || '');

  // Loading & feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sync initial user details when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAddressLine(user.address?.line1 || '');
      setCity(user.address?.city || '');
      setState(user.address?.state || '');
      setPincode(user.address?.pincode || '');
    }
  }, [user]);

  // Load fresh profile & stats on mount
  useEffect(() => {
    getMyProfile()
      .then((res) => {
        if (res.data?.user) {
          dispatch(updateUser(res.data.user));
        }
      })
      .catch(() => {});

    getUserStats()
      .then((res) => {
        setStats(res.data);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [dispatch]);

  const onPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setFeedback(null);
    try {
      const res = await uploadAvatar(file);
      dispatch(updateUser(res.data.user));
      setFeedback({ tone: 'success', message: 'Profile photo updated successfully!' });
    } catch {
      setFeedback({ tone: 'error', message: 'Failed to upload photo. Please choose a JPEG/PNG/WebP under 5MB.' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ tone: 'error', message: 'Please enter your name.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        address: {
          line1: addressLine.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        },
      });
      dispatch(updateUser(res.data.user));
      setFeedback({ tone: 'success', message: 'Your profile has been saved successfully!' });
    } catch {
      setFeedback({ tone: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Member';

  const isCustomer = user?.role === 'customer';
  const isOwner = user?.role === 'owner';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* ================= HERO PROFILE HEADER ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-[#240e34] via-[#3a1850] to-[#1c0829] p-6 sm:p-8 text-white shadow-2xl shadow-purple-950/20">
          {/* Subtle background glow accents */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#ffb020]/20 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-[#ea580c]/20 to-transparent blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Profile Avatar with Upload Button */}
              <div className="relative group">
                <div className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-4 border-white/20 bg-gradient-to-br from-[#ffc65c] via-[#ff9f2d] to-[#ea580c] shadow-xl flex items-center justify-center text-3xl sm:text-4xl font-black text-[#2d163d]">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>

                {/* Upload Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#ea580c] text-white shadow-lg border-2 border-[#240e34] hover:bg-[#ff9f2d] hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Upload / Change profile photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPhotoSelect}
                />
              </div>

              {/* User Info Details */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {user?.name || 'DriveHub User'}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ffb020]/20 border border-[#ffb020]/40 px-3 py-0.5 text-xs font-bold text-[#ffc45d]">
                    <Sparkles className="h-3 w-3" />
                    {user?.role === 'customer'
                      ? 'Rental Customer'
                      : user?.role === 'owner'
                      ? 'Vehicle Owner'
                      : 'Platform Admin'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-purple-200">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#ffc45d]" />
                    {user?.email}
                  </span>
                  {user?.isEmailVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-purple-300">
                    <Calendar className="h-3.5 w-3.5 text-[#ffc45d]" />
                    Joined {joinedDate}
                  </span>
                </div>

                {city && (
                  <p className="inline-flex items-center gap-1 text-xs text-amber-300/90 font-medium">
                    <MapPin className="h-3.5 w-3.5" />
                    {city}{state ? `, ${state}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Balance or Action */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-white/10 sm:border-0 pt-4 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Wallet Balance</p>
                <p className="font-display text-2xl font-black text-[#ffc45d]">
                  ₹{(user?.wallet?.balance || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FEEDBACK MESSAGE ================= */}
        {feedback && (
          <div
            className={`rounded-2xl border-2 p-4 text-sm font-semibold transition-all ${
              feedback.tone === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.tone === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {/* ================= STATS CARDS ================= */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {isCustomer && (
            <>
              <StatCard
                title="Vehicles Rented"
                value={statsLoading ? '…' : String(stats?.totalRented ?? 0)}
                subtitle="Total rental trips"
                icon={<Car className="h-5 w-5 text-[#f56a3d]" />}
              />
              <StatCard
                title="Active Rentals"
                value={statsLoading ? '…' : String(stats?.activeRentals ?? 0)}
                subtitle="Currently ongoing"
                icon={<Clock className="h-5 w-5 text-[#ffb020]" />}
              />
              <StatCard
                title="Completed Trips"
                value={statsLoading ? '…' : String(stats?.completedRentals ?? 0)}
                subtitle="Returned successfully"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              />
              <StatCard
                title="Total Spend"
                value={statsLoading ? '…' : `₹${(stats?.totalSpent ?? 0).toLocaleString('en-IN')}`}
                subtitle="Trips booking spend"
                icon={<TrendingUp className="h-5 w-5 text-[#8b4d9b]" />}
              />
            </>
          )}

          {isOwner && (
            <>
              <StatCard
                title="Vehicles Listed"
                value={statsLoading ? '…' : String(stats?.totalVehicles ?? 0)}
                subtitle="In your garage"
                icon={<Car className="h-5 w-5 text-[#f56a3d]" />}
              />
              <StatCard
                title="Active on Fleet"
                value={statsLoading ? '…' : String(stats?.activeVehicles ?? 0)}
                subtitle="Ready for rental"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              />
              <StatCard
                title="Bookings Received"
                value={statsLoading ? '…' : String(stats?.totalBookings ?? 0)}
                subtitle="Customer bookings"
                icon={<Clock className="h-5 w-5 text-[#ffb020]" />}
              />
              <StatCard
                title="Total Earnings"
                value={statsLoading ? '…' : `₹${(stats?.totalEarnings ?? 0).toLocaleString('en-IN')}`}
                subtitle="Lifetime earnings"
                icon={<Wallet className="h-5 w-5 text-[#8b4d9b]" />}
              />
            </>
          )}

          {!isCustomer && !isOwner && (
            <>
              <StatCard
                title="Account Role"
                value="Admin"
                subtitle="Platform management"
                icon={<ShieldCheck className="h-5 w-5 text-[#f56a3d]" />}
              />
              <StatCard
                title="Status"
                value="Active"
                subtitle="Full system access"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              />
            </>
          )}
        </div>

        {/* ================= EDIT PROFILE FORM ================= */}
        <form onSubmit={onSaveProfile} className="space-y-6">
          <div className="rounded-3xl border border-paper-line bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-paper-line pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Personal & Contact Details</h2>
                <p className="text-xs text-slate">Update your name, contact information, and biography.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                placeholder="e.g. Jay Yadav"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <Input
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                />
                <p className="mt-1 text-[11px] text-slate">Email is verified and cannot be changed directly.</p>
              </div>

              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate mb-1">
                  Role / Account Type
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink font-semibold">
                  <Badge tone="neutral">
                    {user?.role === 'customer'
                      ? 'Rental User'
                      : user?.role === 'owner'
                      ? 'Vehicle Owner'
                      : 'Admin'}
                  </Badge>
                  <span className="text-xs text-slate font-normal">
                    {user?.role === 'customer' ? 'Can rent and book vehicles' : 'Can list vehicles for rent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio / About */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-slate mb-1">
                Bio / About Me
              </label>
              <textarea
                rows={3}
                placeholder="Write a few lines about yourself, travel interests, or driving experience..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-2xl border border-paper-line bg-paper-soft px-4 py-3 text-sm text-ink placeholder:text-slate/60 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          {/* ================= LOCATION DETAILS (KAHA KA HAI) ================= */}
          <div className="rounded-3xl border border-paper-line bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-paper-line pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Location & Address Details</h2>
                <p className="text-xs text-slate">Where are you based? (Helpful for local pickups & bookings)</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Street / Area Address"
                  placeholder="e.g. Civil Lines, Near Railway Station"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                />
              </div>

              <Input
                label="City"
                placeholder="e.g. Prayagraj, Lucknow, Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Input
                label="State"
                placeholder="e.g. Uttar Pradesh, Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <Input
                label="Postal / Pincode"
                placeholder="e.g. 211001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>
          </div>

          {/* ================= SAVE ACTIONS ================= */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              isLoading={isSaving}
              size="lg"
              className="px-8 py-3.5 font-bold shadow-lg shadow-orange-950/20 bg-gradient-to-r from-[#ea580c] via-[#f56a3d] to-[#ff9f2d] hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-paper-line bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5">
          {icon}
        </div>
      </div>
      <p className="mt-2 font-display text-xl sm:text-2xl font-black text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate font-medium truncate">{subtitle}</p>
    </div>
  );
}
