import type { z } from 'zod';
import type {
  createChallengeBodySchema,
  updateChallengeBodySchema,
  challengeParamSchema,
  entryParamSchema,
  listChallengesQuerySchema,
  createEntryBodySchema,
  createResultBodySchema,
} from './challenge.validator.js';

import type {
  Challenge,
  NewChallenge,
  ChallengeEntry,
  NewChallengeEntry,
  ChallengeVote,
  ChallengeResult,
} from '../../schema/index.js';

export type {
  Challenge,
  NewChallenge,
  ChallengeEntry,
  NewChallengeEntry,
  ChallengeVote,
  ChallengeResult,
};

export type CreateChallengeBody = z.infer<typeof createChallengeBodySchema>;
export type UpdateChallengeBody = z.infer<typeof updateChallengeBodySchema>;
export type ChallengeParam = z.infer<typeof challengeParamSchema>;
export type EntryParam = z.infer<typeof entryParamSchema>;
export type ListChallengesQuery = z.infer<typeof listChallengesQuerySchema>;
export type CreateEntryBody = z.infer<typeof createEntryBodySchema>;
export type CreateResultBody = z.infer<typeof createResultBodySchema>;

export interface LeaderboardRow {
  entry: ChallengeEntry;
  votes: number;
}
