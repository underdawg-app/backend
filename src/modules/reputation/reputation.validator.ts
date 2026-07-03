import { z } from 'zod';

// ---------- params ----------
export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

// ---------- request bodies ----------
/**
 * Optional factors map for stub recompute endpoint.
 * Values should be numbers; the service will sum them and clamp to 0-100.
 */
export const recomputeBodySchema = z.object({
  factors: z.record(z.string(), z.number()).optional(),
});
