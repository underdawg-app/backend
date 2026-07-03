import type { z } from 'zod';
import type {
  createConnectionBodySchema,
  updateConnectionBodySchema,
  connectionIdParamSchema,
} from './platform.validator.js';

export type { PlatformConnection, NewPlatformConnection } from '../../schema/index.js';

export type CreateConnectionBody = z.infer<typeof createConnectionBodySchema>;
export type UpdateConnectionBody = z.infer<typeof updateConnectionBodySchema>;
export type ConnectionIdParam = z.infer<typeof connectionIdParamSchema>;
