import { z } from 'zod';

// ---------- enums ----------
const postVisibility = z.enum(['public', 'followers', 'private']);
const postStatus = z.enum(['draft', 'scheduled', 'published', 'archived']);
const mediaType = z.enum(['image', 'video', 'audio']);
const tagType = z.enum(['craft', 'hashtag', 'topic']);
const shareTarget = z.enum(['dm', 'group']);

// ---------- shared sub-schemas ----------
const mediaItemSchema = z.object({
  type: mediaType,
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  position: z.number().int().nonnegative().optional(),
});

// ---------- posts ----------
export const createPostBodySchema = z.object({
  caption: z.string().max(2200).optional(),
  visibility: postVisibility.optional(),
  location: z.string().max(255).optional(),
  commentsEnabled: z.boolean().optional(),
  sharingEnabled: z.boolean().optional(),
  downloadEnabled: z.boolean().optional(),
  ageRestricted: z.boolean().optional(),
  status: postStatus.optional(),
  scheduledAt: z.string().datetime().optional(),
  media: z.array(mediaItemSchema).max(10).optional(),
  tagIds: z.array(z.string().uuid()).max(30).optional(),
  mentionUserIds: z.array(z.string().uuid()).max(50).optional(),
});

export const updatePostBodySchema = z
  .object({
    caption: z.string().max(2200).nullable(),
    visibility: postVisibility,
    location: z.string().max(255).nullable(),
    commentsEnabled: z.boolean(),
    sharingEnabled: z.boolean(),
    downloadEnabled: z.boolean(),
    ageRestricted: z.boolean(),
    status: postStatus,
    scheduledAt: z.string().datetime().nullable(),
  })
  .partial();

// ---------- feed ----------
// `cursor` is a published-at ISO timestamp for for_you/following, and a numeric
// offset for rising (engagement ranking can't use a stable time cursor).
export const feedQuerySchema = z.object({
  section: z.enum(['for_you', 'following', 'rising']).default('for_you'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  craft: z.string().min(1).max(100).optional(),
});

// ---------- comments ----------
export const createCommentBodySchema = z.object({
  body: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

export const listCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// ---------- tags ----------
export const createTagBodySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  type: tagType.optional(),
});

export const listTagsQuerySchema = z.object({
  type: tagType.optional(),
});

// ---------- shares ----------
export const sharePostBodySchema = z.object({
  targetType: shareTarget,
  firebaseThreadId: z.string().optional(),
});

// ---------- params ----------
export const postIdParamSchema = z.object({ id: z.string().uuid() });
export const commentIdParamSchema = z.object({ id: z.string().uuid() });
export const userIdParamSchema = z.object({ userId: z.string().uuid() });
