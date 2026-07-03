import { z } from 'zod';

// ---------- communities ----------
export const createCommunityBodySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  rules: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
});

export const updateCommunityBodySchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().max(1000).nullable(),
    rules: z.string().max(2000).nullable(),
    category: z.string().max(60).nullable(),
  })
  .partial();

export const communityParamSchema = z.object({ id: z.string().uuid() });
export const communityQuerySchema = z.object({ category: z.string().optional() });

// ---------- community posts ----------
export const addPostBodySchema = z.object({
  postId: z.string().uuid(),
  flag: z.enum(['announcement', 'showcase', 'discussion', 'question']).optional(),
  pinned: z.boolean().optional(),
});

// ---------- events ----------
export const createEventBodySchema = z.object({
  kind: z.enum(['event', 'program']).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
  coverUrl: z.string().url().optional(),
});

export const eventParamSchema = z.object({ id: z.string().uuid() });

export const rsvpBodySchema = z.object({
  status: z.enum(['going', 'interested', 'declined']),
});

// ---------- polls ----------
export const createPollBodySchema = z.object({
  question: z.string().min(1).max(500),
  multiSelect: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
  options: z.array(z.string().min(1).max(200)).min(2),
});

export const pollParamSchema = z.object({ id: z.string().uuid() });

export const voteBodySchema = z.object({
  optionId: z.string().uuid(),
});

// ---------- q&a ----------
export const askQuestionBodySchema = z.object({
  body: z.string().min(1).max(1000),
  isAnonymous: z.boolean().optional(),
});

export const userParamSchema = z.object({ userId: z.string().uuid() });
export const questionParamSchema = z.object({ id: z.string().uuid() });

export const answerBodySchema = z.object({
  body: z.string().min(1).max(2000),
});
