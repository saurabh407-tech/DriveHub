import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Card';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getBooking } from '@/services/bookingApi';
import type { Booking } from '@/services/bookingApi';
import { createOrder, verifyPayment } from '@/services/paymentApi';
import type { OrderResponse } from '@/services/paymentApi';
import { loadRazorpayScript } from '@/utils/loadRazorpay';

function formatDisplayDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PaymentCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const mainDashboardPath = user
    ? user.role === 'owner'
      ? '/owner'
      : user.role === 'admin'
      ? '/admin'
      : '/customer'
    : '/';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBooking(id)
      .then((res) => {
        setBooking(res.data.booking);
        if (res.data.booking.status !== 'pending_payment') return null;
        return createOrder(id);
      })
      .then((res) => {
        if (res) setOrder(res.data);
      })
      .catch((err) => {
        const anyErr = err as { response?: { data?: { message?: string } } };
        setError(anyErr?.response?.data?.message || 'Could not start checkout for this booking.');
      });
  }, [id]);

  const finishWithVerification = async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => {
    try {
      await verifyPayment(payload);
      navigate(`/bookings/${id}`, { state: { justBooked: true } });
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message || 'Payment verification failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const onPayMock = async () => {
    if (!order) return;
    setIsPaying(true);
    setError(null);
    await finishWithVerification({ razorpayOrderId: order.payment.razorpayOrderId });
  };

  const onPayLive = async () => {
    if (!order || !order.keyId) return;
    setIsPaying(true);
    setError(null);

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setError('Could not load the payment gateway. Check your connection and try again.');
      setIsPaying(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: Math.round(order.payment.amount * 100),
      currency: order.payment.currency,
      order_id: order.payment.razorpayOrderId,
      name: 'DriveHub',
      description: `Booking ${booking?.bookingCode}`,
      prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      theme: { color: '#ea580c' },
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        finishWithVerification({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          setIsPaying(false);
        },
      },
    });

    if (razorpay.on) {
      razorpay.on('payment.failed', (response: any) => {
        const desc = response?.error?.description || 'Payment was declined or failed. Please try again.';
        setError(desc);
        setIsPaying(false);
      });
    }

    razorpay.open();
  };

  const days = useMemo(() => {
    if (!booking) return 1;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(1, diff);
  }, [booking]);

  const vehicleImage = useMemo(() => {
    if (!booking?.vehicle?.images) return '';
    const primary = booking.vehicle.images.find((img) => img.isPrimary);
    return primary?.url || booking.vehicle.images[0]?.url || '';
  }, [booking]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4fa] via-[#faefe0] to-[#eee8f2] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">Checkout Notice</h2>
          <p className="mt-2 text-sm text-slate leading-relaxed">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/customer/bookings"
              className="w-full rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f56a3d] py-3 text-sm font-bold text-white shadow-md hover:scale-[1.01] transition-transform"
            >
              Go to Your Bookings
            </Link>
            <button
              onClick={() => navigate(mainDashboardPath)}
              className="w-full py-2.5 text-xs font-semibold text-slate hover:text-ink transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4fa] via-[#faefe0] to-[#eee8f2] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-4 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-ink/10" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-ink/10" />
          <div className="h-44 w-full animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-ink/10" />
        </div>
      </div>
    );
  }

  if (booking.status !== 'pending_payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4fa] via-[#faefe0] to-[#eee8f2] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">Already Completed</h2>
          <p className="mt-2 text-sm text-slate">
            This reservation is already marked as <strong>{booking.status.replace('_', ' ')}</strong>.
          </p>
          <Link
            to={`/bookings/${booking._id}`}
            className="mt-6 inline-block w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
          >
            View Reservation Details →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4fa] via-[#faefe0] to-[#eee8f2] text-[#2d163d]">
      {/* ================= STICKY TOP NAV ================= */}
      <header className="sticky top-0 z-30 border-b border-[#8b4d9b]/15 bg-white/85 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <button
            type="button"
            onClick={() => navigate(mainDashboardPath)}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-[#8b4d9b]/20 bg-white/90 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#5b2c6f] hover:bg-white hover:border-[#8b4d9b]/35 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-[#ea580c]" />
            <span className="hidden sm:inline">Back to Main Page</span>
            <span className="sm:hidden">Back</span>
          </button>

          <Link to={mainDashboardPath} className="flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffc45d] via-[#ff9f2d] to-[#f56a3d] shadow-md shadow-orange-950/20">
              <img src="/drivehub-logo.png" alt="DriveHub" className="h-5 sm:h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="font-display text-base sm:text-xl font-extrabold tracking-wide text-[#2d163d] leading-none">
                Drive<span className="text-[#f56a3d]">Hub</span>
              </span>
              <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.2em] text-[#7c3f8c] mt-0.5">
                Secure Checkout
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Progress Stepper Banner */}
        <div className="mb-8 rounded-3xl border border-white/60 bg-gradient-to-r from-[#240e34] via-[#3a1850] to-[#1c0829] p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#ffb020]/20 border border-[#ffb020]/40 px-2.5 py-0.5 text-xs font-bold text-[#ffc45d]">
                  Booking Reference
                </span>
                <span className="font-mono text-xs font-semibold text-purple-200">
                  {booking.bookingCode}
                </span>
              </div>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-white">
                Complete Your Payment
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-purple-200">
                Confirm your reservation details and complete checkout securely with Razorpay.
              </p>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>
                <span>Vehicle</span>
              </span>
              <span className="text-purple-400">➔</span>
              <span className="flex items-center gap-1.5 text-[#ffc45d]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ea580c] text-white text-xs animate-pulse">2</span>
                <span>Payment</span>
              </span>
              <span className="text-purple-400">➔</span>
              <span className="flex items-center gap-1.5 text-purple-400 opacity-60">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">3</span>
                <span>Trip Ready</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Vehicle Details & Trip Breakdown (7 Cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Vehicle Preview Card */}
            <div className="overflow-hidden rounded-3xl border border-paper-line bg-white shadow-xs">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  {vehicleImage ? (
                    <div className="h-32 w-full sm:w-44 shrink-0 overflow-hidden rounded-2xl bg-ink/5">
                      <img src={vehicleImage} alt={booking.vehicle?.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-32 w-full sm:w-44 shrink-0 items-center justify-center rounded-2xl bg-ink/5 text-xs text-slate">
                      No Photo Available
                    </div>
                  )}

                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{booking.vehicle?.location?.city || 'Verified City'}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Instant Booking
                        </span>
                      </div>
                      <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink">
                        {booking.vehicle?.title || 'Selected Vehicle'}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate">
                        Listed by {booking.owner?.name || 'Verified Owner'}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#5b2c6f]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#ea580c]" />
                        {days} Day{days > 1 ? 's' : ''} Rental
                      </span>
                      <span>·</span>
                      <span>₹{(booking.pricing.baseAmount / days).toLocaleString('en-IN')}/day base</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Schedule & Location Timeline */}
              <div className="border-t border-paper-line bg-paper-soft/60 p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate mb-4">
                  Trip Schedule & Addresses
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pickup */}
                  <div className="rounded-2xl border border-paper-line bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#ea580c]">
                      <Calendar className="h-4 w-4" />
                      <span>PICKUP DATE</span>
                    </div>
                    <p className="mt-1 font-display text-sm font-bold text-ink">
                      {formatDisplayDate(booking.startDate)}
                    </p>
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate">
                      <MapPin className="h-3.5 w-3.5 text-slate shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{booking.pickupLocation?.address || 'Pickup point'}</p>
                    </div>
                  </div>

                  {/* Drop-off */}
                  <div className="rounded-2xl border border-paper-line bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#8b4d9b]">
                      <Calendar className="h-4 w-4" />
                      <span>DROP-OFF DATE</span>
                    </div>
                    <p className="mt-1 font-display text-sm font-bold text-ink">
                      {formatDisplayDate(booking.endDate)}
                    </p>
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate">
                      <MapPin className="h-3.5 w-3.5 text-slate shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{booking.dropLocation?.address || 'Return point'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Included Guarantees */}
            <div className="rounded-3xl border border-paper-line bg-white p-6 shadow-xs">
              <h3 className="font-display text-sm font-bold text-ink mb-3">
                Every DriveHub Booking Includes:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2.5 rounded-xl bg-paper-soft p-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate">100% Refundable Security Deposit</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-paper-soft p-3">
                  <Sparkles className="h-5 w-5 text-[#ffb020] shrink-0" />
                  <span className="font-medium text-slate">24/7 Roadside Emergency Assistance</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-paper-soft p-3">
                  <CheckCircle2 className="h-5 w-5 text-[#ea580c] shrink-0" />
                  <span className="font-medium text-slate">Clean, Sanitized & Verified Fleet</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Fare Breakdown & Razorpay Gateway CTA (5 Cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="sticky top-24 rounded-3xl border-2 border-[#ea580c]/30 bg-white p-6 sm:p-7 shadow-xl shadow-orange-950/10">
              <div className="flex items-center justify-between border-b border-paper-line pb-4">
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink">Fare Breakdown</h3>
                  <p className="text-xs text-slate">All inclusive transparent pricing</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  GST Compliant
                </span>
              </div>

              {/* Price Line Items */}
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate">
                  <span>Base Rental Fare ({days} Day{days > 1 ? 's' : ''})</span>
                  <span className="font-semibold text-ink">
                    ₹{booking.pricing.baseAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate">
                  <div className="flex items-center gap-1.5">
                    <span>Refundable Deposit</span>
                    <span className="rounded-sm bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                      Refundable
                    </span>
                  </div>
                  <span className="font-semibold text-ink">
                    ₹{booking.pricing.securityDeposit.toLocaleString('en-IN')}
                  </span>
                </div>

                {booking.pricing.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-slate">
                    <span>Taxes & GST (18%)</span>
                    <span className="font-semibold text-ink">
                      ₹{booking.pricing.taxAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {booking.pricing.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{booking.pricing.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Total Line */}
                <div className="border-t border-paper-line pt-4 mt-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-display text-sm font-bold uppercase tracking-wider text-slate">
                        Total Amount Due
                      </span>
                      <p className="text-[11px] text-slate">Including security deposit & taxes</p>
                    </div>
                    <span className="font-display text-3xl font-black text-[#ea580c]">
                      ₹{booking.pricing.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Box */}
              <div className="mt-6 rounded-2xl border border-paper-line bg-paper-soft p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#ea580c]" />
                    <span className="text-xs font-bold text-ink">Razorpay Secure Payment</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#8b4d9b]">UPI / Cards / NetBanking</span>
                </div>

                {/* Payment Methods Visual Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate">
                  <span className="rounded-md bg-white border border-paper-line px-2 py-0.5">Google Pay</span>
                  <span className="rounded-md bg-white border border-paper-line px-2 py-0.5">PhonePe</span>
                  <span className="rounded-md bg-white border border-paper-line px-2 py-0.5">Paytm</span>
                  <span className="rounded-md bg-white border border-paper-line px-2 py-0.5">Credit/Debit Card</span>
                  <span className="rounded-md bg-white border border-paper-line px-2 py-0.5">Net Banking</span>
                </div>
              </div>

              {order?.mode === 'mock' && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-bold">⚡ Sandbox Demo Mode</p>
                  <p className="mt-0.5 text-[11px]">
                    No real charge will be made. Clicking below will instantly simulate a verified transaction.
                  </p>
                </div>
              )}

              {/* Call to Action Button */}
              <button
                type="button"
                disabled={isPaying || !order}
                onClick={order?.mode === 'live' ? onPayLive : onPayMock}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ea580c] via-[#f56a3d] to-[#ff9f2d] py-4 px-6 font-display text-base font-extrabold text-white shadow-xl shadow-orange-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {isPaying
                    ? 'Processing Payment...'
                    : order?.mode === 'live'
                    ? `Pay ₹${booking.pricing.totalAmount.toLocaleString('en-IN')} with Razorpay`
                    : `Simulate Payment of ₹${booking.pricing.totalAmount.toLocaleString('en-IN')}`}
                </span>
              </button>

              <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-slate font-medium">
                <Lock className="h-3 w-3 text-emerald-600" />
                <span>Encrypted 256-bit connection · PCI-DSS Compliant</span>
              </div>
            </div>

            {/* Support Note */}
            <div className="rounded-2xl border border-paper-line bg-white/70 p-4 text-xs text-slate text-center">
              <p className="font-semibold text-ink">Need assistance with your booking?</p>
              <p className="mt-0.5">
                Contact DriveHub Concierge Desk at <span className="font-bold text-[#ea580c]">sourabhshukla8318@gmail.com</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
