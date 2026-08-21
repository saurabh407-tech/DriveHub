import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TripMap } from '@/components/maps/TripMap';
import { LiveTrackingPanel } from '@/components/bookings/LiveTrackingPanel';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { getOrCreateConversation } from '@/services/chatApi';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getBooking, cancelBooking, startTrip, completeTrip } from '@/services/bookingApi';
import type { Booking } from '@/services/bookingApi';
import { getPaymentForBooking } from '@/services/paymentApi';
import type { PaymentRecord } from '@/services/paymentApi';
import { BOOKING_STATUS_TONE, BOOKING_STATUS_LABEL } from '@/utils/bookingStatus';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CANCELLABLE: Booking['status'][] = ['pending_payment', 'confirmed'];

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChangingTripState, setIsChangingTripState] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!id) return;
    getBooking(id)
      .then((res) => setBooking(res.data.booking))
      .catch(() => setError('This booking could not be found.'));
    getPaymentForBooking(id)
      .then((res) => setPayment(res.data.payment))
      .catch(() => setPayment(null));
    getOrCreateConversation(id)
      .then((res) => setConversationId(res.data.conversation._id))
      .catch(() => setConversationId(null));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onCancel = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      await cancelBooking(id);
      refresh();
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message || 'Could not cancel this booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const onStartTrip = async () => {
    if (!id) return;
    setIsChangingTripState(true);
    try {
      await startTrip(id);
      refresh();
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message || 'Could not start the trip.');
    } finally {
      setIsChangingTripState(false);
    }
  };

  const onCompleteTrip = async () => {
    if (!id) return;
    setIsChangingTripState(true);
    try {
      await completeTrip(id);
      refresh();
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message || 'Could not complete the trip.');
    } finally {
      setIsChangingTripState(false);
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-sm text-alert">{error}</p>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
      </DashboardLayout>
    );
  }

  const viewerRole = user?.role === 'owner' ? 'owner' : 'customer';

  const mapPoints = [
    booking.pickupLocation.lat != null && booking.pickupLocation.lng != null
      ? { lat: booking.pickupLocation.lat, lng: booking.pickupLocation.lng, label: 'Pickup', color: '#1fb6a6' }
      : null,
    booking.dropLocation.lat != null && booking.dropLocation.lng != null
      ? { lat: booking.dropLocation.lat, lng: booking.dropLocation.lng, label: 'Drop-off', color: '#ffb020' }
      : null,
  ].filter((p): p is { lat: number; lng: number; label: string; color: string } => p !== null);

  return (
    <DashboardLayout>
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate hover:text-ink">
        ← Back
      </button>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{booking.vehicle.title}</h1>
          <p className="mt-1 text-sm text-slate">{booking.bookingCode}</p>
        </div>
        <Badge tone={BOOKING_STATUS_TONE[booking.status]}>{BOOKING_STATUS_LABEL[booking.status]}</Badge>
      </div>

      {booking.status === 'pending_payment' && viewerRole === 'customer' && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-route/10 px-4 py-3">
          <p className="text-sm text-route-dim">Payment hasn't been completed for this booking yet.</p>
          <Link to={`/bookings/${booking._id}/pay`}>
            <Button size="sm">Pay now</Button>
          </Link>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-signal/10 px-4 py-3">
          <p className="text-sm text-signal-dim">Ready for pickup? Mark the trip as started once the vehicle is handed over.</p>
          <Button size="sm" variant="secondary" onClick={onStartTrip} isLoading={isChangingTripState}>
            Start trip
          </Button>
        </div>
      )}

      {booking.status === 'ongoing' && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-signal/10 px-4 py-3">
          <p className="text-sm text-signal-dim">Trip in progress since {booking.tripStartedAt ? formatDate(booking.tripStartedAt) : '—'}.</p>
          <Button size="sm" variant="secondary" onClick={onCompleteTrip} isLoading={isChangingTripState}>
            Mark completed
          </Button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-2xl border border-paper-line bg-paper-soft p-5">
            <h2 className="font-display text-base font-semibold text-ink">Trip details</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-slate">Pickup</dt>
              <dd className="text-ink">{formatDate(booking.startDate)}</dd>
              <dt className="text-slate">Drop-off</dt>
              <dd className="text-ink">{formatDate(booking.endDate)}</dd>
              <dt className="text-slate">Pickup address</dt>
              <dd className="text-ink">{booking.pickupLocation.address}</dd>
              <dt className="text-slate">Drop address</dt>
              <dd className="text-ink">{booking.dropLocation.address}</dd>
            </dl>
            <div className="mt-4">
              <TripMap points={mapPoints} />
            </div>
          </div>

          {booking.status === 'ongoing' && <LiveTrackingPanel bookingId={booking._id} />}

          <div>
            <h2 className="font-display text-base font-semibold text-ink mb-2">
              Message {viewerRole === 'customer' ? 'owner' : 'customer'}
            </h2>
            {conversationId ? (
              <ChatWindow conversationId={conversationId} />
            ) : (
              <div className="h-28 animate-pulse rounded-2xl bg-ink/5" />
            )}
          </div>

          <div className="rounded-2xl border border-paper-line bg-paper-soft p-5">
            <h2 className="font-display text-base font-semibold text-ink">
              {viewerRole === 'customer' ? 'Vehicle owner' : 'Customer'}
            </h2>
            <p className="mt-2 text-sm text-ink">
              {(viewerRole === 'customer' ? booking.owner : booking.customer).name}
            </p>
            <p className="text-sm text-slate">
              {(viewerRole === 'customer' ? booking.owner : booking.customer).email}
            </p>
          </div>

          {booking.cancellation && (
            <div className="rounded-2xl border border-alert/30 bg-alert/5 p-5">
              <h2 className="font-display text-base font-semibold text-alert">Cancellation</h2>
              <p className="mt-2 text-sm text-ink">{booking.cancellation.reason}</p>
              {typeof booking.cancellation.refundAmount === 'number' && (
                <p className="mt-1 text-sm text-slate">
                  Refund amount: ₹{booking.cancellation.refundAmount.toLocaleString('en-IN')}
                  {payment?.status === 'refunded' || payment?.status === 'partially_refunded'
                    ? ' · processed'
                    : ''}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="rounded-2xl border border-paper-line bg-paper-soft p-5">
            <h2 className="font-display text-base font-semibold text-ink">Price breakdown</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <Row label="Base fare" value={booking.pricing.baseAmount} />
              {booking.pricing.discountAmount > 0 && (
                <Row
                  label={`Discount${booking.pricing.couponCode ? ` (${booking.pricing.couponCode})` : ''}`}
                  value={-booking.pricing.discountAmount}
                />
              )}
              <Row label="Taxes (GST)" value={booking.pricing.taxAmount} />
              <Row label="Security deposit (refundable)" value={booking.pricing.securityDeposit} />
              <div className="mt-2 flex items-center justify-between border-t border-paper-line pt-2 font-semibold text-ink">
                <span>Total</span>
                <span>₹{booking.pricing.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </dl>

            {payment?.status === 'captured' && payment.invoiceUrl && (
              <a
                href={payment.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-lg bg-ink/5 px-3 py-2 text-center text-xs font-medium text-ink hover:bg-ink/10"
              >
                Download invoice {payment.invoiceNumber ? `(${payment.invoiceNumber})` : ''}
              </a>
              
            )}
          </div>

          {CANCELLABLE.includes(booking.status) && (
            <Button variant="danger" fullWidth className="mt-4" onClick={onCancel} isLoading={isCancelling}>
              Cancel booking
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-slate">
      <span>{label}</span>
      <span className="text-ink">
        {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
      </span>
    </div>
  );
}
