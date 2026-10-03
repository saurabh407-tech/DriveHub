import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Download,
  KeyRound,
  Car,
  Calendar,
  MapPin,
  Copy,
  Check,
  Clock,
  FileText,
  Lock,
  Sparkles,
  AlertTriangle,
  User as UserIcon,
  ChevronRight,
  Receipt,
} from 'lucide-react';
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
import { getPaymentForBooking, downloadInvoicePdf } from '@/services/paymentApi';
import type { PaymentRecord } from '@/services/paymentApi';
import { BOOKING_STATUS_TONE, BOOKING_STATUS_LABEL } from '@/utils/bookingStatus';

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDurationBadge(start: string, end: string) {
  if (!start || !end) return '';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const totalHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (totalHours < 24) return `${totalHours} hrs`;
  const days = Math.ceil(totalHours / 24);
  return `${days} Day${days > 1 ? 's' : ''} (${totalHours} hrs)`;
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPdf = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadInvoicePdf(id, true);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `Invoice-${booking?.bookingCode || 'receipt'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch {
      if (payment?.invoiceUrl) {
        window.open(payment.invoiceUrl, '_blank');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleViewPdf = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    try {
      const blob = await downloadInvoicePdf(id, false);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      window.open(objectUrl, '_blank');
    } catch {
      if (payment?.invoiceUrl) {
        window.open(payment.invoiceUrl, '_blank');
      }
    }
  };

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
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
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
        <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-red-950">Unable to load booking</h2>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
          <div className="h-44 animate-pulse rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 animate-pulse rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
            <div className="h-72 animate-pulse rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const viewerRole = user?.role === 'owner' ? 'owner' : 'customer';

  const mapPoints = [
    booking.pickupLocation?.lat != null && booking.pickupLocation?.lng != null
      ? { lat: booking.pickupLocation.lat, lng: booking.pickupLocation.lng, label: 'Pickup', color: '#1fb6a6' }
      : null,
    booking.dropLocation?.lat != null && booking.dropLocation?.lng != null
      ? { lat: booking.dropLocation.lat, lng: booking.dropLocation.lng, label: 'Drop-off', color: '#ffb020' }
      : null,
  ].filter((p): p is { lat: number; lng: number; label: string; color: string } => p !== null);

  const primaryImage =
    booking.vehicle?.images?.find((img) => img.isPrimary)?.url ||
    booking.vehicle?.images?.[0]?.url;

  const durationBadge = getDurationBadge(booking.startDate, booking.endDate);

  return (
    <DashboardLayout>
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Bookings</span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
          <span>DriveHub</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-slate-900">Reservation #{booking.bookingCode}</span>
        </div>
      </div>

      {/* Main Vehicle & Status Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={booking.vehicle?.title || 'Vehicle'}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-slate-200 shadow-inner flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Car className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {booking.vehicle?.title || 'Vehicle'}
                </h1>
                {booking.vehicle?.location?.city && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    {booking.vehicle.location.city}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200">
                  {booking.bookingCode}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(booking.bookingCode, 'bookingCode')}
                    title="Copy Booking ID"
                    className="text-slate-400 hover:text-slate-700 transition-colors ml-0.5 cursor-pointer"
                  >
                    {copiedKey === 'bookingCode' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
                {copiedKey === 'bookingCode' && (
                  <span className="text-[11px] font-semibold text-emerald-600">Copied!</span>
                )}
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">
                  Booked on {formatDate(booking.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <Badge tone={BOOKING_STATUS_TONE[booking.status]}>
              {BOOKING_STATUS_LABEL[booking.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* 🟢 HIGH-CONTRAST LUXURY PAYMENT SUCCESS CARD */}
      {payment?.status === 'captured' && (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-50/40 to-white p-5 sm:p-6 shadow-md shadow-emerald-950/5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
                <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Payment Confirmed & Verified
                  </h2>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    ₹{booking.pricing?.totalAmount?.toLocaleString('en-IN')} Paid
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700">
                  {payment.razorpayPaymentId && (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                      <span className="text-slate-500">Transaction:</span>
                      <span className="font-mono font-semibold text-slate-900 bg-white/90 px-2 py-0.5 rounded border border-emerald-200">
                        {payment.razorpayPaymentId}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(payment.razorpayPaymentId!, 'txId')}
                        className="text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Copy Transaction ID"
                      >
                        {copiedKey === 'txId' ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {payment.invoiceNumber && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-slate-500">Invoice:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {payment.invoiceNumber}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-slate-500">
                    <Lock className="h-3 w-3 text-emerald-700" />
                    <span>100% Secured by Razorpay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt & PDF Download Action Buttons */}
            {payment.invoiceUrl && (
              <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t border-emerald-200/60 lg:border-t-0">
                <button
                  type="button"
                  onClick={handleViewPdf}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-emerald-700" />
                  <span>View Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-4 w-4 text-white" />
                  <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⏳ PENDING PAYMENT ALERT CARD */}
      {booking.status === 'pending_payment' && viewerRole === 'customer' && (
        <div className="mt-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-50 to-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Pending for Confirmation</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Complete the payment of ₹{booking.pricing.totalAmount?.toLocaleString('en-IN')} to lock in your reservation and confirm with the owner.
                </p>
              </div>
            </div>
            <Link to={`/bookings/${booking._id}/pay`}>
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Pay Now (₹{booking.pricing.totalAmount?.toLocaleString('en-IN')})</span>
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* 🔑 HIGH-CONTRAST READY FOR PICKUP / HANDOVER CARD */}
      {booking.status === 'confirmed' && (
        <div className="mt-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-white to-amber-500/5 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Ready for pickup? Vehicle Handover Pending
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wide">
                    Next Step
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 max-w-xl leading-relaxed">
                  Meet at the pickup location. Once the vehicle keys and inspection are completed, mark the trip as started to initiate your rental duration and GPS tracking.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={onStartTrip}
              isLoading={isChangingTripState}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold border-0 shadow-md hover:shadow-lg transition-all rounded-xl px-5 py-2.5 cursor-pointer whitespace-nowrap"
            >
              <KeyRound className="h-4 w-4 mr-1.5" />
              Start trip
            </Button>
          </div>
        </div>
      )}

      {/* 🚗 LIVE TRIP ONGOING CARD */}
      {booking.status === 'ongoing' && (
        <div className="mt-4 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-white to-emerald-500/5 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/30">
                <Car className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Trip In Progress</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    Live
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Trip started on{' '}
                  <span className="font-semibold text-slate-900">
                    {booking.tripStartedAt ? formatDate(booking.tripStartedAt) : '—'}
                  </span>
                  . Have a safe drive! Once you return the vehicle to the drop location, click below to complete.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={onCompleteTrip}
              isLoading={isChangingTripState}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-5 py-2.5 shadow-md cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Mark completed
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Trip Schedule & Fare Breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 🌟 ENHANCED TRIP SCHEDULE & LOCATIONS CARD */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-2xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Trip Schedule & Locations
                  </h2>
                  <p className="text-xs text-slate-500">Pick-up and drop-off timeline</p>
                </div>
              </div>

              {durationBadge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Duration: {durationBadge}</span>
                </span>
              )}
            </div>

            {/* Pickup & Drop-Off Split View */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pick-Up Card */}
              <div className="rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-500/[0.08] via-teal-50/20 to-white p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-600 text-white shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      PICK-UP
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800 bg-white/80 px-2 py-0.5 rounded border border-teal-200/60">
                      Journey Start
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="font-display text-lg font-bold text-slate-900">
                      {formatDate(booking.startDate)}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-teal-900 bg-white px-2.5 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                      <Clock className="h-3 w-3 text-teal-600" />
                      {formatTime(booking.startDate) || 'Standard Time'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-teal-200/60">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">Pickup Address:</span>
                    {booking.pickupLocation?.address && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(booking.pickupLocation.address, 'pickupAddr')}
                        className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer flex items-center gap-1"
                        title="Copy address"
                      >
                        {copiedKey === 'pickupAddr' ? (
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {booking.pickupLocation?.address || 'Pickup address not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drop-Off Card */}
              <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-amber-50/20 to-white p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-600 text-white shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      DROP-OFF
                    </span>
                    <span className="text-[11px] font-semibold text-amber-800 bg-white/80 px-2 py-0.5 rounded border border-amber-200/60">
                      Vehicle Return
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="font-display text-lg font-bold text-slate-900">
                      {formatDate(booking.endDate)}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-white px-2.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                      <Clock className="h-3 w-3 text-amber-600" />
                      {formatTime(booking.endDate) || 'Standard Time'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-amber-200/60">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">Drop Address:</span>
                    {booking.dropLocation?.address && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(booking.dropLocation.address, 'dropAddr')}
                        className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer flex items-center gap-1"
                        title="Copy address"
                      >
                        {copiedKey === 'dropAddr' ? (
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {booking.dropLocation?.address || 'Drop-off address not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Canvas with refined border & styling */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <TripMap points={mapPoints} />
            </div>
          </div>

          {/* Live Telematics GPS Tracking */}
          <LiveTrackingPanel bookingId={booking._id} />

          {/* Chat Window */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <h2 className="font-display text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>Message {viewerRole === 'customer' ? 'Owner' : 'Customer'}</span>
            </h2>
            {conversationId ? (
              <ChatWindow conversationId={conversationId} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 text-center">
                Chat is unavailable for this booking.
              </div>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {viewerRole === 'customer' ? 'Vehicle Host / Owner' : 'Rental Customer'}
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {(viewerRole === 'customer' ? booking.owner : booking.customer)?.name || 'User unavailable'}
                </p>
                <p className="text-xs text-slate-500">
                  {(viewerRole === 'customer' ? booking.owner : booking.customer)?.email || 'Not available'}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {viewerRole === 'customer' ? 'Host' : 'Renter'}
            </span>
          </div>

          {/* Cancellation Info (if cancelled) */}
          {booking.cancellation && (
            <div className="rounded-2xl border-2 border-red-500/30 bg-red-50/60 p-5">
              <h2 className="font-display text-base font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Booking Cancelled</span>
              </h2>
              <p className="mt-2 text-sm text-slate-800">
                Reason: <span className="font-medium">{booking.cancellation.reason}</span>
              </p>
              {typeof booking.cancellation.refundAmount === 'number' && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-red-200 text-xs font-semibold text-slate-900">
                  <span>Refund Amount:</span>
                  <span className="font-bold text-emerald-600">
                    ₹{booking.cancellation.refundAmount.toLocaleString('en-IN')}
                  </span>
                  {payment?.status === 'refunded' || payment?.status === 'partially_refunded' ? (
                    <span className="text-emerald-700 font-bold ml-1">(Processed)</span>
                  ) : (
                    <span className="text-slate-500 ml-1">(Initiated)</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🌟 ENHANCED FARE & PAYMENT BREAKDOWN (RIGHT COLUMN) */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-500" />
                <span>Fare & Payment Breakdown</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                Tax Invoice
              </span>
            </div>

            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <Row label="Base Rental Fare" value={booking.pricing.baseAmount} />
              {booking.pricing.discountAmount > 0 && (
                <Row
                  label={`Discount${booking.pricing.couponCode ? ` (${booking.pricing.couponCode})` : ''}`}
                  value={-booking.pricing.discountAmount}
                />
              )}
              <Row label="Taxes (GST 18%)" value={booking.pricing.taxAmount} />
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-700">Security deposit</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Refundable
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  ₹{booking.pricing.securityDeposit.toLocaleString('en-IN')}
                </span>
              </div>
            </dl>

            {/* Luxury Total Amount Container */}
            <div className="mt-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 text-white shadow-md border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Amount
                  </span>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">All inclusive</p>
                </div>
                <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  ₹{booking.pricing.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment status badge with verified checkmark */}
            <div className="mt-3.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">Payment Status</p>
                  <p className="text-[10px] text-emerald-700 font-medium">Secured by Razorpay</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                <Check className="h-3 w-3 text-emerald-600" /> Paid & Verified
              </span>
            </div>

            {/* Download PDF Invoice CTA */}
            {payment?.status === 'captured' && payment.invoiceUrl && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>
                  {isDownloadingPdf
                    ? 'Downloading PDF...'
                    : `Download Invoice (${payment.invoiceNumber || 'PDF'})`}
                </span>
              </button>
            )}

            {CANCELLABLE.includes(booking.status) && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelling}
                className="mt-3.5 w-full rounded-xl border border-red-200 bg-white py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-bold text-slate-900">
        {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
      </span>
    </div>
  );
}
