import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors.js';
import type { ChallengeRepository } from './challenge.repository.js';
import type {
  Challenge,
  NewChallenge,
  ChallengeEntry,
  ChallengeResult,
  CreateChallengeBody,
  UpdateChallengeBody,
  CreateEntryBody,
  CreateResultBody,
  LeaderboardRow,
} from './challenge.types.js';

export class ChallengeService {
  constructor(private readonly repo: ChallengeRepository) {}

  async create(input: CreateChallengeBody, hostUserId: string): Promise<Challenge> {
    const data: NewChallenge = {
      theme: input.theme,
      hostUserId,
      hashtagTagId: input.hashtagTagId ?? null,
      rules: input.rules ?? null,
      eligibility: input.eligibility ?? null,
      prizes: input.prizes ?? null,
      timeline: input.timeline ?? null,
      judgingCriteria: input.judgingCriteria ?? null,
      category: input.category ?? null,
      status: input.status ?? 'draft',
    };
    return this.repo.create(data);
  }

  async list(status?: Challenge['status']): Promise<Challenge[]> {
    return this.repo.findAll(status);
  }

  async getById(id: string): Promise<Challenge> {
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new NotFoundError('Challenge not found');
    return challenge;
  }

  async update(id: string, input: UpdateChallengeBody): Promise<Challenge> {
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('Challenge not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async createEntry(challengeId: string, input: CreateEntryBody, creatorId: string): Promise<ChallengeEntry> {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');

    const existing = await this.repo.findEntryByCreator(challengeId, creatorId);
    if (existing) throw new ConflictError('You have already entered this challenge');

    return this.repo.createEntry({
      challengeId,
      creatorId,
      postId: input.postId ?? null,
      status: 'submitted',
    });
  }

  async listEntries(challengeId: string): Promise<ChallengeEntry[]> {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');
    return this.repo.findEntriesByChallenge(challengeId);
  }

  async vote(entryId: string, voterId: string): Promise<void> {
    const entry = await this.repo.findEntryById(entryId);
    if (!entry) throw new NotFoundError('Entry not found');

    const existing = await this.repo.findVote(entryId, voterId);
    if (existing) throw new ConflictError('You have already voted for this entry');

    await this.repo.createVote(entryId, voterId);
  }

  async getLeaderboard(challengeId: string): Promise<LeaderboardRow[]> {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');
    return this.repo.getLeaderboard(challengeId);
  }

  async createResult(
    challengeId: string,
    input: CreateResultBody,
    requesterId: string,
  ): Promise<ChallengeResult> {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');
    if (challenge.hostUserId !== requesterId) throw new ForbiddenError('Only the host can publish results');

    const entry = await this.repo.findEntryById(input.winnerEntryId);
    if (!entry) throw new NotFoundError('Entry not found');
    if (entry.challengeId !== challengeId) throw new ForbiddenError('Entry does not belong to this challenge');

    const result = await this.repo.createResult({
      challengeId,
      winnerEntryId: input.winnerEntryId,
      placement: input.placement ?? 1,
      prize: input.prize ?? null,
    });

    await this.repo.updateEntryStatus(input.winnerEntryId, 'winner');

    return result;
  }

  async listResults(challengeId: string): Promise<ChallengeResult[]> {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');
    return this.repo.findResultsByChallenge(challengeId);
  }
}
