import { z } from 'zod';

const portfolioPieceType = z.enum(['image', 'video', 'audio', 'link', 'pdf', 'embed']);
const pageVisibility = z.enum(['public', 'private', 'unlisted']);
const openToType = z.enum(['collaboration', 'brand_deals', 'commissions', 'management']);

// ---------- params ----------
export const pieceIdParamSchema = z.object({ id: z.string().uuid() });
export const userIdParamSchema = z.object({ userId: z.string().uuid() });
export const rateIdParamSchema = z.object({ id: z.string().uuid() });
export const pastClientIdParamSchema = z.object({ id: z.string().uuid() });

// ---------- portfolio pieces ----------
export const addPieceBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  note: z.string().max(1000).optional(),
  type: portfolioPieceType,
  fileUrl: z.string().url().optional(),
  embedUrl: z.string().url().optional(),
  position: z.number().int().min(0).optional(),
});

export const updatePieceBodySchema = z
  .object({
    title: z.string().min(1).max(255).nullable(),
    note: z.string().max(1000).nullable(),
    type: portfolioPieceType,
    fileUrl: z.string().url().nullable(),
    embedUrl: z.string().url().nullable(),
    position: z.number().int().min(0),
  })
  .partial();

// ---------- public page config ----------
export const publicConfigBodySchema = z
  .object({
    visibility: pageVisibility,
    hideStats: z.boolean(),
    hideRates: z.boolean(),
  })
  .partial();

// ---------- open_to ----------
export const openToBodySchema = z.object({
  items: z.array(
    z.object({
      type: openToType,
      enabled: z.boolean(),
    }),
  ),
});

// ---------- rates ----------
export const addRateBodySchema = z.object({
  service: z.string().min(1).max(255),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'must be a valid decimal'),
  currency: z.string().min(1).max(10).optional(),
  isPublic: z.boolean().optional(),
});

// ---------- past clients ----------
export const addPastClientBodySchema = z.object({
  name: z.string().min(1).max(255),
  logoUrl: z.string().url().optional(),
});
