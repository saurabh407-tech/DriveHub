import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  getVehicle,
  uploadVehicleImages,
  uploadVehicleDocument,
  submitForVerification,
} from '@/services/vehicleApi';

type Vehicle = Awaited<ReturnType<typeof getVehicle>>['data']['vehicle'];

const DOC_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  not_submitted: 'neutral',
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
};

export default function ManageVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<'rc' | 'insurance' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    if (!id) return;
    getVehicle(id).then((res) => setVehicle(res.data.vehicle));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!vehicle || !id) {
    return (
      <DashboardLayout>
        <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
      </DashboardLayout>
    );
  }

  const onImagesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    setBanner(null);
    try {
      await uploadVehicleImages(id, Array.from(files));
      refresh();
    } catch {
      setBanner({ tone: 'error', text: 'Could not upload one or more images. Try smaller JPEG/PNG/WebP files.' });
    } finally {
      setIsUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const onDocSelected = async (docType: 'rc' | 'insurance', files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingDoc(docType);
    setBanner(null);
    try {
      await uploadVehicleDocument(id, docType, files[0]);
      refresh();
    } catch {
      setBanner({ tone: 'error', text: `Could not upload the ${docType.toUpperCase()}. Try a JPEG, PNG, or PDF under 8MB.` });
    } finally {
      setUploadingDoc(null);
    }
  };

  const onSubmitVerification = async () => {
    setIsSubmitting(true);
    setBanner(null);
    try {
      await submitForVerification(id);
      setBanner({ tone: 'success', text: 'Submitted for admin verification. This usually takes 24-48 hours.' });
      refresh();
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setBanner({ tone: 'error', text: anyErr?.response?.data?.message || 'Could not submit for verification.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const readyToSubmit =
    vehicle.images.length > 0 &&
    vehicle.documents.rc.status !== 'not_submitted' &&
    vehicle.documents.insurance.status !== 'not_submitted' &&
    vehicle.status === 'draft';

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{vehicle.title}</h1>
          <p className="mt-1 text-sm text-slate">
            {vehicle.make} {vehicle.vehicleModel} · {vehicle.year} · {vehicle.location.city}
          </p>
        </div>
        <Badge tone={vehicle.status === 'active' ? 'success' : vehicle.status === 'rejected' ? 'danger' : 'warning'}>
          {vehicle.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Prominent Floating Banner on Action */}
      {banner && (
        <div
          className={`mt-6 overflow-hidden rounded-2xl border-2 p-5 shadow-xl transition-all ${
            banner.tone === 'success'
              ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent text-ink shadow-emerald-500/10'
              : 'border-alert/50 bg-gradient-to-r from-alert/20 via-alert/10 to-transparent text-ink shadow-alert/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${
                banner.tone === 'success' ? 'bg-emerald-500 text-white' : 'bg-alert text-white'
              }`}
            >
              {banner.tone === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <h4 className="text-base font-bold text-ink">
                {banner.tone === 'success' ? '✓ Submitted for Verification!' : 'Submission Notice'}
              </h4>
              <p className="mt-0.5 text-sm text-slate font-medium">
                {banner.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Highlighted Status Cards */}
      {vehicle.status === 'pending_verification' && (
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 p-5 sm:p-6 shadow-xl shadow-amber-500/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-black shadow-lg shadow-amber-500/30">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-ink">
                    Submitted for Admin Verification
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/25 px-3 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-500/40">
                    <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
                    Under Review
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate leading-relaxed">
                  Your vehicle listing, RC, and insurance documents are currently under review by the DriveHub admin team. Review typically takes <strong>24–48 hours</strong>. You will receive an email once approved.
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-amber-500/20 pt-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold">✓</span>
              <span>1. Vehicle & Docs Uploaded</span>
            </div>
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black text-[11px] font-bold">2</span>
              <span>2. Admin Verification (Current)</span>
            </div>
            <div className="flex items-center gap-2 text-slate opacity-60">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate/20 text-slate text-[11px]">3</span>
              <span>3. Live for Customer Bookings</span>
            </div>
          </div>
        </div>
      )}

      {vehicle.status === 'active' && (
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent p-5 sm:p-6 shadow-xl shadow-emerald-500/10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-ink">
                  Vehicle Verified & Published Live! 🚗
                </h3>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                  Active
                </span>
              </div>
              <p className="mt-1 text-sm text-slate">
                Your vehicle has passed verification and is now active for customer bookings across all search results.
              </p>
            </div>
          </div>
        </div>
      )}

      {vehicle.status === 'rejected' && (
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-rose-500/50 bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent p-5 sm:p-6 shadow-xl shadow-rose-500/10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-ink">
                  Verification Not Approved
                </h3>
                <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-500/40">
                  Needs Revision
                </span>
              </div>
              <p className="mt-1 text-sm text-slate">
                {vehicle.rejectionReason || 'The admin requested updates to your documents or vehicle details. Please review and re-submit.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photos */}
      <section className="mt-8">
        <h2 className="font-display text-base font-semibold text-ink">Photos</h2>
        <p className="mt-1 text-sm text-slate">Up to 10 images. The first photo is used as the cover.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {vehicle.images.map((img) => (
            <div key={img.publicId} className="aspect-square overflow-hidden rounded-lg bg-ink/5">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImages || vehicle.images.length >= 10}
            className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-paper-line text-xs text-slate hover:border-ink/30 disabled:opacity-50"
          >
            {isUploadingImages ? 'Uploading…' : '+ Add photos'}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => onImagesSelected(e.target.files)}
          />
        </div>
      </section>

      {/* Documents */}
      <section className="mt-10">
        <h2 className="font-display text-base font-semibold text-ink">Documents</h2>
        <p className="mt-1 text-sm text-slate">Required before a vehicle can be verified and go live.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentUploader
            label="Registration Certificate (RC)"
            status={vehicle.documents.rc.status}
            isUploading={uploadingDoc === 'rc'}
            onClick={() => rcInputRef.current?.click()}
          />
          <input
            ref={rcInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => onDocSelected('rc', e.target.files)}
          />

          <DocumentUploader
            label="Insurance certificate"
            status={vehicle.documents.insurance.status}
            isUploading={uploadingDoc === 'insurance'}
            onClick={() => insuranceInputRef.current?.click()}
          />
          <input
            ref={insuranceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => onDocSelected('insurance', e.target.files)}
          />
        </div>
      </section>

      {vehicle.status === 'draft' && (
        <div className="mt-10 rounded-2xl border border-paper-line bg-paper-soft p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Ready to get your vehicle on the road?</h3>
              <p className="mt-1 text-xs text-slate">
                Add at least one photo, your RC document, and Insurance certificate to submit for admin review.
              </p>
            </div>
            <Button onClick={onSubmitVerification} disabled={!readyToSubmit} isLoading={isSubmitting} size="lg">
              Submit for Verification →
            </Button>
          </div>
          {!readyToSubmit && (
            <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Incomplete requirements: Ensure you have uploaded at least 1 photo and both documents above.
            </p>
          )}
        </div>
      )}

      {vehicle.status === 'pending_verification' && (
        <div className="mt-10 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 text-center">
          <p className="text-base font-bold text-amber-700 dark:text-amber-300">
            ⏳ Verification In Progress
          </p>
          <p className="mt-1 text-xs text-slate">
            The DriveHub administration desk has been notified. No further action is required from you at this time.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

function DocumentUploader({
  label,
  status,
  isUploading,
  onClick,
}: {
  label: string;
  status: string;
  isUploading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-paper-line bg-paper-soft p-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <Badge tone={DOC_TONE[status] || 'neutral'}>{status.replace('_', ' ')}</Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={onClick} isLoading={isUploading}>
        {status === 'not_submitted' ? 'Upload' : 'Replace'}
      </Button>
    </div>
  );
}
