import { eq, and, desc, count } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  challenges,
  challengeEntries,
  challengeVotes,
  challengeResults,
  type Challenge,
  type NewChallenge,
  type ChallengeEntry,
  type NewChallengeEntry,
  type ChallengeVote,
  type ChallengeResult,
} from '../../schema/index.js';
import type { LeaderboardRow } from './challenge.types.js';

export class ChallengeRepository {
  constructor(private readonly db: DB) {}

  // ----- challenges -----

  async create(data: NewChallenge): Promise<Challenge> {
    const [row] = await this.db.insert(challenges).values(data).returning();
    return row;
  }

  async findAll(status?: Challenge['status']): Promise<Challenge[]> {
    if (status) {
      return this.db.select().from(challenges).where(eq(challenges.status, status));
    }
    return this.db.select().from(challenges);
  }

  async findById(id: string): Promise<Challenge | undefined> {
    const [row] = await this.db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    return row;
  }

  async update(id: string, data: Partial<NewChallenge>): Promise<Challenge | undefined> {
    const [row] = await this.db.update(challenges).set(data).where(eq(challenges.id, id)).returning();
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(challenges).where(eq(challenges.id, id));
  }

  // ----- entries -----

  async createEntry(data: NewChallengeEntry): Promise<ChallengeEntry> {
    const [row] = await this.db.insert(challengeEntries).values(data).returning();
    return row;
  }

  async findEntriesByChallenge(challengeId: string): Promise<ChallengeEntry[]> {
    return this.db
      .select()
      .from(challengeEntries)
      .where(eq(challengeEntries.challengeId, challengeId));
  }

  async findEntryById(id: string): Promise<ChallengeEntry | undefined> {
    const [row] = await this.db
      .select()
      .from(challengeEntries)
      .where(eq(challengeEntries.id, id))
      .limit(1);
    return row;
  }

  async findEntryByCreator(challengeId: string, creatorId: string): Promise<ChallengeEntry | undefined> {
    const [row] = await this.db
      .select()
      .from(challengeEntries)
      .where(and(eq(challengeEntries.challengeId, challengeId), eq(challengeEntries.creatorId, creatorId)))
      .limit(1);
    return row;
  }

  async updateEntryStatus(id: string, status: ChallengeEntry['status']): Promise<void> {
    await this.db.update(challengeEntries).set({ status }).where(eq(challengeEntries.id, id));
  }

  // ----- votes -----

  async createVote(entryId: string, voterId: string): Promise<ChallengeVote> {
    const [row] = await this.db
      .insert(challengeVotes)
      .values({ entryId, voterId })
      .returning();
    return row;
  }

  async findVote(entryId: string, voterId: string): Promise<ChallengeVote | undefined> {
    const [row] = await this.db
      .select()
      .from(challengeVotes)
      .where(and(eq(challengeVotes.entryId, entryId), eq(challengeVotes.voterId, voterId)))
      .limit(1);
    return row;
  }

  // ----- leaderboard -----

  async getLeaderboard(challengeId: string): Promise<LeaderboardRow[]> {
    const rows = await this.db
      .select({
        entry: challengeEntries,
        votes: count(challengeVotes.id),
      })
      .from(challengeEntries)
      .leftJoin(challengeVotes, eq(challengeVotes.entryId, challengeEntries.id))
      .where(eq(challengeEntries.challengeId, challengeId))
      .groupBy(challengeEntries.id)
      .orderBy(desc(count(challengeVotes.id)));

    return rows.map((r) => ({ entry: r.entry, votes: Number(r.votes) }));
  }

  // ----- results -----

  async createResult(data: {
    challengeId: string;
    winnerEntryId: string;
    placement: number;
    prize?: string | null;
  }): Promise<ChallengeResult> {
    const [row] = await this.db.insert(challengeResults).values(data).returning();
    return row;
  }

  async findResultsByChallenge(challengeId: string): Promise<ChallengeResult[]> {
    return this.db
      .select()
      .from(challengeResults)
      .where(eq(challengeResults.challengeId, challengeId))
      .orderBy(challengeResults.placement);
  }
}
