import { z } from 'zod';

const socialPlatform = z.enum([
  'instagram',
  'youtube',
  'tiktok',
  'twitter',
  'spotify',
  'soundcloud',
  'twitch',
  'linkedin',
  'pinterest',
  'behance',
  'dribbble',
]);

const connectionStatus = z.enum(['connected', 'disconnected', 'error']);

// ---------- request bodies / params ----------
export const createConnectionBodySchema = z.object({
  platform: socialPlatform,
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const updateConnectionBodySchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    status: connectionStatus,
  })
  .partial();

export const connectionIdParamSchema = z.object({ id: z.string().uuid() });
