import { z } from 'zod';

// ---------- request bodies / params ----------
export const createEventBodySchema = z.object({
  type: z.string().min(1).max(128),
  targetType: z.string().min(1).max(128).optional(),
  targetId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const listEventsQuerySchema = z.object({
  type: z.string().min(1).max(128).optional(),
  targetType: z.string().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const summaryQuerySchema = z.object({
  targetType: z.string().min(1).max(128).optional(),
  targetId: z.string().uuid().optional(),
  sinceDays: z.coerce.number().int().min(1).max(365).optional(),
});
