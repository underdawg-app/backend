import { z } from 'zod';

const challengeStatus = z.enum(['draft', 'active', 'voting', 'judging', 'ended']);
const challengeEntryStatus = z.enum(['submitted', 'shortlisted', 'winner', 'disqualified']);

// ---------- params ----------
export const challengeParamSchema = z.object({ id: z.string().uuid() });
export const entryParamSchema = z.object({ id: z.string().uuid() });

// ---------- querystring ----------
export const listChallengesQuerySchema = z.object({
  status: challengeStatus.optional(),
});

// ---------- request bodies ----------
export const createChallengeBodySchema = z.object({
  theme: z.string().min(1).max(500),
  hashtagTagId: z.string().uuid().optional(),
  rules: z.string().optional(),
  eligibility: z.string().optional(),
  prizes: z.string().optional(),
  timeline: z.string().optional(),
  judgingCriteria: z.string().optional(),
  category: z.string().optional(),
  status: challengeStatus.optional(),
});

export const updateChallengeBodySchema = z
  .object({
    theme: z.string().min(1).max(500),
    hashtagTagId: z.string().uuid().nullable(),
    rules: z.string().nullable(),
    eligibility: z.string().nullable(),
    prizes: z.string().nullable(),
    timeline: z.string().nullable(),
    judgingCriteria: z.string().nullable(),
    category: z.string().nullable(),
    status: challengeStatus,
  })
  .partial();

export const createEntryBodySchema = z.object({
  postId: z.string().uuid().optional(),
});

export const createResultBodySchema = z.object({
  winnerEntryId: z.string().uuid(),
  placement: z.number().int().positive().optional(),
  prize: z.string().optional(),
});

// re-export enum type for internal use
export { challengeEntryStatus };
