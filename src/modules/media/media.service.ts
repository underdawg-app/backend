import type { Readable } from 'node:stream';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { getCloudinary, uploadStreamToCloudinary } from '../../utils/cloudinary.js';
import type { MediaRepository } from './media.repository.js';
import type { Upload, UploadResourceType } from './media.types.js';

interface UploadInput {
  stream: Readable;
  filename: string;
}

const RESOURCE_TYPES: readonly UploadResourceType[] = ['image', 'video', 'raw'];

function toResourceType(value: string): UploadResourceType {
  return (RESOURCE_TYPES as readonly string[]).includes(value)
    ? (value as UploadResourceType)
    : 'raw';
}

export class MediaService {
  constructor(private readonly repo: MediaRepository) {}

  /** Stream a file to Cloudinary and persist its metadata in the uploads library. */
  async upload(ownerId: string, input: UploadInput): Promise<Upload> {
    if (!getCloudinary()) throw new BadRequestError('Media uploads are not configured');

    const result = await uploadStreamToCloudinary(input.stream, input.filename);
    return this.repo.create({
      ownerId,
      resourceType: toResourceType(result.resource_type),
      cloudinaryPublicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format ?? null,
      bytes: result.bytes ?? null,
      width: result.width ?? null,
      height: result.height ?? null,
      durationSec: result.duration != null ? Math.round(result.duration) : null,
      originalFilename: input.filename,
    });
  }

  list(ownerId: string): Promise<Upload[]> {
    return this.repo.listByOwner(ownerId);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const upload = await this.repo.findById(id);
    if (!upload) throw new NotFoundError('Upload not found');
    if (upload.ownerId !== ownerId) throw new ForbiddenError('Not the upload owner');

    const cld = getCloudinary();
    if (cld) {
      await cld.uploader.destroy(upload.cloudinaryPublicId, { resource_type: upload.resourceType });
    }
    await this.repo.delete(id);
  }
}
