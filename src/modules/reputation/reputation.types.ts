import type { z } from 'zod';
import type { recomputeBodySchema, userIdParamSchema } from './reputation.validator.js';

export type { ReputationScore, NewReputationScore } from '../../schema/index.js';

export type RecomputeBody = z.infer<typeof recomputeBodySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

/** Reputation tier values matching the DB enum. */
export type ReputationTier = 'emerging' | 'bronze' | 'silver' | 'gold' | 'platinum';
