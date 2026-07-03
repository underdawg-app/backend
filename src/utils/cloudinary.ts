import type { Readable } from 'node:stream';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '../config/env.js';

let configured = false;

/**
 * Returns the configured Cloudinary SDK, or `null` when credentials are absent
 * (so the dev server can boot without them — endpoints surface a clear error).
 */
export function getCloudinary(): typeof cloudinary | null {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return null;
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/** Pipe a readable file stream to Cloudinary, resolving with the upload result. */
export function uploadStreamToCloudinary(
  stream: Readable,
  filename: string,
): Promise<UploadApiResponse> {
  const cld = getCloudinary();
  if (!cld) return Promise.reject(new Error('Cloudinary is not configured'));

  return new Promise((resolve, reject) => {
    const upload = cld.uploader.upload_stream(
      { resource_type: 'auto', use_filename: true, unique_filename: true, filename_override: filename },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary returned no result'));
        resolve(result);
      },
    );
    // Surface source errors (e.g. multipart file-size limit) so the promise
    // rejects instead of hanging, and abort the Cloudinary upload.
    stream.on('error', (err) => {
      upload.destroy();
      reject(err);
    });
    stream.pipe(upload);
  });
}
