import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
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

      {banner && (
        <p
          className={`mt-6 rounded-lg px-3 py-2 text-sm ${
            banner.tone === 'success' ? 'bg-signal/10 text-signal-dim' : 'bg-alert/10 text-alert'
          }`}
        >
          {banner.text}
        </p>
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
        <div className="mt-10">
          <Button onClick={onSubmitVerification} disabled={!readyToSubmit} isLoading={isSubmitting}>
            Submit for verification
          </Button>
          {!readyToSubmit && (
            <p className="mt-2 text-xs text-slate">Add at least one photo and both documents to continue.</p>
          )}
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
