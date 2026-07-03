import { NotFoundError } from '../../utils/errors.js';
import { tierForScore } from './reputation.middleware.js';
import type { ReputationRepository } from './reputation.repository.js';
import type { RecomputeBody, ReputationScore } from './reputation.types.js';

export class ReputationService {
  constructor(private readonly repo: ReputationRepository) {}

  async getByUserId(userId: string): Promise<ReputationScore> {
    const row = await this.repo.findByUserId(userId);
    if (!row) throw new NotFoundError('Reputation score not found');
    return row;
  }

  /**
   * Returns the caller's reputation row, creating a default emerging/0 row
   * if none exists yet.
   */
  async getOrCreateMine(userId: string): Promise<ReputationScore> {
    const existing = await this.repo.findByUserId(userId);
    if (existing) return existing;

    return this.repo.upsert({
      userId,
      score: 0,
      tier: 'emerging',
      factors: null,
    });
  }

  /**
   * STUB recompute: sums all numeric factor values provided by the caller,
   * clamps the result to [0, 100], derives the tier, and upserts the row.
   *
   * This is a placeholder — replace with real signal aggregation later.
   */
  async recompute(userId: string, input: RecomputeBody): Promise<ReputationScore> {
    const factors = input.factors ?? {};

    const rawSum = Object.values(factors).reduce<number>((acc, v) => acc + v, 0);
    const score = Math.max(0, Math.min(100, Math.round(rawSum)));
    const tier = tierForScore(score);

    return this.repo.upsert({
      userId,
      score,
      tier,
      factors: Object.keys(factors).length > 0 ? factors : null,
    });
  }
}
