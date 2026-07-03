import { and, asc, count, eq, gte, sql } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  analyticsEvents,
  comments,
  communityMembers,
  follows,
  followerSnapshots,
  platformConnections,
  posts,
  qnaQuestions,
  reactions,
  reshares,
  type Post,
} from '../../schema/index.js';
import type { FollowerTrendPoint } from './profile.types.js';

export class ProfileRepository {
  constructor(private readonly db: DB) {}

  async countFollowers(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return row?.value ?? 0;
  }

  async countFollowing(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return row?.value ?? 0;
  }

  /** likes + comments + reshares summed across the user's published posts. */
  async engagementCounts(
    userId: string,
  ): Promise<{ likes: number; comments: number; reshares: number }> {
    const [likeRow, commentRow, reshareRow] = await Promise.all([
      this.db
        .select({ value: count() })
        .from(reactions)
        .innerJoin(posts, eq(posts.id, reactions.targetId))
        .where(and(eq(reactions.targetType, 'post'), eq(posts.authorId, userId))),
      this.db
        .select({ value: count() })
        .from(comments)
        .innerJoin(posts, eq(posts.id, comments.postId))
        .where(eq(posts.authorId, userId)),
      this.db
        .select({ value: count() })
        .from(reshares)
        .innerJoin(posts, eq(posts.id, reshares.postId))
        .where(eq(posts.authorId, userId)),
    ]);
    return {
      likes: likeRow[0]?.value ?? 0,
      comments: commentRow[0]?.value ?? 0,
      reshares: reshareRow[0]?.value ?? 0,
    };
  }

  /** Events targeting this user's profile (actor-agnostic). */
  async countProfileViews(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.targetType, 'user'), eq(analyticsEvents.targetId, userId)));
    return row?.value ?? 0;
  }

  /** Daily follower totals (summed across connected platforms) for the last `days`. */
  async followerTrend(userId: string, days: number): Promise<FollowerTrendPoint[]> {
    const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const rows = await this.db
      .select({
        date: followerSnapshots.capturedOn,
        followers: sql<number>`sum(${followerSnapshots.followerCount})`,
      })
      .from(followerSnapshots)
      .innerJoin(platformConnections, eq(platformConnections.id, followerSnapshots.platformConnectionId))
      .where(and(eq(platformConnections.userId, userId), gte(followerSnapshots.capturedOn, since)))
      .groupBy(followerSnapshots.capturedOn)
      .orderBy(asc(followerSnapshots.capturedOn));
    return rows.map((r) => ({ date: r.date, followers: Number(r.followers) }));
  }

  async communityCounts(
    userId: string,
  ): Promise<{ communitiesJoined: number; answeredQuestions: number }> {
    const [joinedRow, answeredRow] = await Promise.all([
      this.db
        .select({ value: count() })
        .from(communityMembers)
        .where(and(eq(communityMembers.userId, userId), eq(communityMembers.status, 'active'))),
      this.db
        .select({ value: count() })
        .from(qnaQuestions)
        .where(and(eq(qnaQuestions.targetUserId, userId), eq(qnaQuestions.status, 'answered'))),
    ]);
    return {
      communitiesJoined: joinedRow[0]?.value ?? 0,
      answeredQuestions: answeredRow[0]?.value ?? 0,
    };
  }

  /** Newest published posts by the user, most-recent first. */
  async listPublishedPostsByAuthor(userId: string, limit: number): Promise<Post[]> {
    return this.db
      .select()
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published')))
      .orderBy(sql`coalesce(${posts.publishedAt}, ${posts.createdAt}) desc`)
      .limit(limit);
  }
}
