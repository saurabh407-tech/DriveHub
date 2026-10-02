import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const isCloudinaryConfigured = !!(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
} else {
  logger.warn('Cloudinary not configured — file uploads will be stored locally under /uploads');
}

const LOCAL_UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a buffer to Cloudinary if credentials are set, otherwise writes it
 * to local disk and returns a URL served by express.static. The returned
 * shape is identical either way, so callers (and the DB schema) never need
 * to know which backend is in use.
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  originalName: string
): Promise<UploadResult> {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const extension = path.extname(originalName).toLowerCase();
    const isPdf = extension === '.pdf';
    const baseName = path.basename(originalName, extension);
    const publicId = isPdf
      ? `${baseName}-${crypto.randomBytes(4).toString('hex')}.pdf`
      : `${baseName}-${crypto.randomBytes(4).toString('hex')}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `drivehub/${folder}`,
        resource_type: isPdf ? 'raw' : 'image',
        public_id: publicId,
        format: isPdf ? 'pdf' : undefined,
      },
      (err, result) => {
        if (err || !result) {
          return reject(err || new Error('Cloudinary upload failed'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
      stream.end(buffer);
    });
  }

  const ext = path.extname(originalName) || '.bin';
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(LOCAL_UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  const publicId = `${folder}/${filename}`; // relative path acts as the "publicId" for local files
  return { url: `${env.serverUrl}/uploads/${publicId}`, publicId };
}

export async function deleteAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  if (isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.warn(`Failed to delete Cloudinary asset ${publicId}`, err);
    }
    return;
  }
  try {
    await fs.unlink(path.join(LOCAL_UPLOAD_ROOT, publicId));
  } catch {
    // asset already gone — not an error worth surfacing to the caller
  }
}

export { LOCAL_UPLOAD_ROOT };
