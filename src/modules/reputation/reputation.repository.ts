import { eq } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  reputationScores,
  type ReputationScore,
  type NewReputationScore,
} from '../../schema/index.js';

export class ReputationRepository {
  constructor(private readonly db: DB) {}

  async findByUserId(userId: string): Promise<ReputationScore | undefined> {
    const [row] = await this.db
      .select()
      .from(reputationScores)
      .where(eq(reputationScores.userId, userId))
      .limit(1);
    return row;
  }

  /**
   * Upsert a reputation row by userId (unique constraint).
   * On conflict the score, tier, factors, and updatedAt are updated.
   */
  async upsert(data: NewReputationScore): Promise<ReputationScore> {
    const [row] = await this.db
      .insert(reputationScores)
      .values(data)
      .onConflictDoUpdate({
        target: reputationScores.userId,
        set: {
          score: data.score,
          tier: data.tier,
          factors: data.factors,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }
}
