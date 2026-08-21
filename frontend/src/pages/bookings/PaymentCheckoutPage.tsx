import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getBooking } from '@/services/bookingApi';
import type { Booking } from '@/services/bookingApi';
import { createOrder, verifyPayment } from '@/services/paymentApi';
import type { OrderResponse } from '@/services/paymentApi';
import { loadRazorpayScript } from '@/utils/loadRazorpay';

export default function PaymentCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

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
      navigate('/customer/bookings', { state: { justBooked: true } });
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
      prefill: { name: user?.name, email: user?.email },
      theme: { color: '#ffb020' },
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        finishWithVerification({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: { ondismiss: () => setIsPaying(false) },
    });
    razorpay.open();
  };

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-alert">{error}</p>
        <Link to="/customer/bookings" className="mt-4 inline-block text-sm font-medium text-route-dim hover:underline">
          Go to your bookings
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
      </div>
    );
  }

  if (booking.status !== 'pending_payment') {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-slate">This booking is already {booking.status.replace('_', ' ')}.</p>
        <Link to={`/bookings/${booking._id}`} className="mt-4 inline-block text-sm font-medium text-route-dim hover:underline">
          View booking
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="font-display text-lg font-bold tracking-tight text-ink">
        DriveHub
      </Link>
      <h1 className="mt-6 font-display text-2xl font-semibold text-ink">Complete your payment</h1>
      <p className="mt-1 text-sm text-slate">{booking.bookingCode}</p>

      <div className="mt-6 rounded-2xl border border-paper-line bg-paper-soft p-5">
        <div className="flex items-center justify-between text-sm text-slate">
          <span>Amount due</span>
          <span className="font-display text-xl font-semibold text-ink">
            ₹{booking.pricing.totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {order?.mode === 'mock' && (
          <p className="mt-4 rounded-lg bg-route/10 px-3 py-2 text-xs text-route-dim">
            Running in mock payment mode — no real Razorpay account is configured, so this simulates a successful
            charge with no money moving.
          </p>
        )}

        <Button
          fullWidth
          className="mt-4"
          isLoading={isPaying}
          disabled={!order}
          onClick={order?.mode === 'live' ? onPayLive : onPayMock}
        >
          {order?.mode === 'live' ? 'Pay with Razorpay' : 'Simulate payment'}
        </Button>
      </div>
    </div>
  );
}
