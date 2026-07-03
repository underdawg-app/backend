import type { z } from 'zod';
import type { mediaIdParamSchema } from './media.validator.js';

export type { Upload, NewUpload } from '../../schema/index.js';

export type MediaIdParam = z.infer<typeof mediaIdParamSchema>;

/** Resource buckets Cloudinary classifies an asset into. */
export type UploadResourceType = 'image' | 'video' | 'raw';
