import { eq, ne, and, desc, inArray, sql, count } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  users,
  posts,
  mediaAssets,
  tags,
  postTags,
  postMentions,
  comments,
  reactions,
  saves,
  reshares,
  postShares,
  follows,
  type Post,
  type NewPost,
  type MediaAsset,
  type NewMediaAsset,
  type Tag,
  type NewTag,
  type Comment,
  type NewComment,
  type Reaction,
  type NewReaction,
  type Reshare,
  type PostShare,
  type NewPostShare,
  type Follow,
  type NewFollow,
} from '../../schema/index.js';
import type { EnrichedPost, FeedAuthor, FeedMention, FeedTag } from './content.types.js';

export class ContentRepository {
  constructor(private readonly db: DB) {}

  // ----- posts -----

  async createPost(
    data: NewPost,
    media: NewMediaAsset[],
    tagIds: string[],
    mentionUserIds: string[],
  ): Promise<Post> {
    return this.db.transaction(async (tx) => {
      const [post] = await tx.insert(posts).values(data).returning();

      if (media.length > 0) {
        await tx.insert(mediaAssets).values(media.map((m) => ({ ...m, postId: post.id })));
      }

      if (tagIds.length > 0) {
        await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: post.id, tagId })));
      }

      if (mentionUserIds.length > 0) {
        await tx
          .insert(postMentions)
          .values(mentionUserIds.map((mentionedUserId) => ({ postId: post.id, mentionedUserId })));
      }

      return post;
    });
  }

  async findPostById(id: string): Promise<Post | undefined> {
    const [row] = await this.db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return row;
  }

  async findPostWithMedia(id: string): Promise<{ post: Post; media: MediaAsset[] } | undefined> {
    const [row] = await this.db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!row) return undefined;
    const media = await this.db.select().from(mediaAssets).where(eq(mediaAssets.postId, id));
    return { post: row, media };
  }

  async updatePost(id: string, data: Partial<NewPost>): Promise<Post | undefined> {
    const [row] = await this.db.update(posts).set(data).where(eq(posts.id, id)).returning();
    return row;
  }

  async deletePost(id: string): Promise<void> {
    await this.db.delete(posts).where(eq(posts.id, id));
  }

  async publishPost(id: string): Promise<Post | undefined> {
    const [row] = await this.db
      .update(posts)
      .set({ status: 'published', publishedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return row;
  }

  // ----- feed -----

  /** Subquery of post ids carrying a given (craft) tag slug, for feed filtering. */
  private craftPostIds(slug: string) {
    return this.db
      .select({ id: postTags.postId })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(eq(tags.slug, slug));
  }

  /**
   * for_you — recency-ranked public posts excluding the caller's own.
   * Placeholder ranking until a real interest/affinity model lands.
   */
  async getFeedForYou(callerId: string, limit: number, cursor?: string, craft?: string): Promise<Post[]> {
    const conds = [eq(posts.status, 'published'), ne(posts.authorId, callerId)];
    if (cursor) conds.push(sql`${posts.createdAt} < ${cursor}`);
    if (craft) conds.push(inArray(posts.id, this.craftPostIds(craft)));

    return this.db
      .select()
      .from(posts)
      .where(and(...conds))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getFeedFollowing(callerId: string, limit: number, cursor?: string, craft?: string): Promise<Post[]> {
    const followedIds = this.db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, callerId));

    const conds = [inArray(posts.authorId, followedIds), eq(posts.status, 'published')];
    if (cursor) conds.push(sql`${posts.createdAt} < ${cursor}`);
    if (craft) conds.push(inArray(posts.id, this.craftPostIds(craft)));

    return this.db
      .select()
      .from(posts)
      .where(and(...conds))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  /**
   * rising — published in the last 7 days, ranked by engagement
   * (likes + comments + reshares). Uses limit/offset since the score is not a
   * stable time cursor.
   */
  async getFeedRising(limit: number, offset: number, craft?: string): Promise<Post[]> {
    const score = sql<number>`(
      (select count(*) from ${reactions} where ${reactions.targetType} = 'post' and ${reactions.targetId} = ${posts.id})
      + (select count(*) from ${comments} where ${comments.postId} = ${posts.id})
      + (select count(*) from ${reshares} where ${reshares.postId} = ${posts.id})
    )`;

    const conds = [
      eq(posts.status, 'published'),
      sql`${posts.createdAt} > now() - interval '7 days'`,
    ];
    if (craft) conds.push(inArray(posts.id, this.craftPostIds(craft)));

    return this.db
      .select()
      .from(posts)
      .where(and(...conds))
      .orderBy(desc(score), desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Batch-enrich a page of posts with author, media, tags, mentions, engagement
   * counts and caller-relative flags (liked/saved/following). All lookups are
   * keyed on the page's ids so this stays O(1) queries regardless of page size.
   */
  async enrichPosts(callerId: string, postRows: Post[]): Promise<EnrichedPost[]> {
    if (postRows.length === 0) return [];
    const postIds = postRows.map((p) => p.id);
    const authorIds = [...new Set(postRows.map((p) => p.authorId))];

    const [
      authorRows,
      mediaRows,
      tagRows,
      mentionRows,
      likeRows,
      commentRows,
      reshareRows,
      saveRows,
      likedRows,
      savedRows,
      followingRows,
    ] = await Promise.all([
      this.db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          photoUrl: users.photoUrl,
          locationCity: users.locationCity,
        })
        .from(users)
        .where(inArray(users.id, authorIds)),
      this.db.select().from(mediaAssets).where(inArray(mediaAssets.postId, postIds)),
      this.db
        .select({
          postId: postTags.postId,
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          type: tags.type,
        })
        .from(postTags)
        .innerJoin(tags, eq(tags.id, postTags.tagId))
        .where(inArray(postTags.postId, postIds)),
      this.db
        .select({
          postId: postMentions.postId,
          id: users.id,
          username: users.username,
          displayName: users.displayName,
        })
        .from(postMentions)
        .innerJoin(users, eq(users.id, postMentions.mentionedUserId))
        .where(inArray(postMentions.postId, postIds)),
      this.db
        .select({ key: reactions.targetId, value: count() })
        .from(reactions)
        .where(and(eq(reactions.targetType, 'post'), inArray(reactions.targetId, postIds)))
        .groupBy(reactions.targetId),
      this.db
        .select({ key: comments.postId, value: count() })
        .from(comments)
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.postId),
      this.db
        .select({ key: reshares.postId, value: count() })
        .from(reshares)
        .where(inArray(reshares.postId, postIds))
        .groupBy(reshares.postId),
      this.db
        .select({ key: saves.postId, value: count() })
        .from(saves)
        .where(inArray(saves.postId, postIds))
        .groupBy(saves.postId),
      this.db
        .select({ id: reactions.targetId })
        .from(reactions)
        .where(
          and(
            eq(reactions.userId, callerId),
            eq(reactions.targetType, 'post'),
            inArray(reactions.targetId, postIds),
          ),
        ),
      this.db
        .select({ id: saves.postId })
        .from(saves)
        .where(and(eq(saves.userId, callerId), inArray(saves.postId, postIds))),
      this.db
        .select({ id: follows.followingId })
        .from(follows)
        .where(and(eq(follows.followerId, callerId), inArray(follows.followingId, authorIds))),
    ]);

    const authorById = new Map<string, FeedAuthor>(authorRows.map((a) => [a.id, a]));

    const mediaByPost = new Map<string, MediaAsset[]>();
    for (const m of mediaRows) {
      if (!m.postId) continue;
      (mediaByPost.get(m.postId) ?? mediaByPost.set(m.postId, []).get(m.postId)!).push(m);
    }

    const tagsByPost = new Map<string, FeedTag[]>();
    for (const row of tagRows) {
      const tag: FeedTag = { id: row.id, name: row.name, slug: row.slug, type: row.type };
      (tagsByPost.get(row.postId) ?? tagsByPost.set(row.postId, []).get(row.postId)!).push(tag);
    }

    const mentionsByPost = new Map<string, FeedMention[]>();
    for (const row of mentionRows) {
      const mention: FeedMention = { id: row.id, username: row.username, displayName: row.displayName };
      (mentionsByPost.get(row.postId) ?? mentionsByPost.set(row.postId, []).get(row.postId)!).push(mention);
    }

    const toCountMap = (rows: { key: string; value: number }[]): Map<string, number> =>
      new Map(rows.map((r) => [r.key, r.value]));
    const likeMap = toCountMap(likeRows);
    const commentMap = toCountMap(commentRows);
    const reshareMap = toCountMap(reshareRows);
    const saveMap = toCountMap(saveRows);

    const likedSet = new Set(likedRows.map((r) => r.id));
    const savedSet = new Set(savedRows.map((r) => r.id));
    const followingSet = new Set(followingRows.map((r) => r.id));

    return postRows.map((post) => ({
      post,
      author:
        authorById.get(post.authorId) ??
        { id: post.authorId, username: null, displayName: null, photoUrl: null, locationCity: null },
      media: (mediaByPost.get(post.id) ?? []).sort((a, b) => a.position - b.position),
      tags: tagsByPost.get(post.id) ?? [],
      mentions: mentionsByPost.get(post.id) ?? [],
      counts: {
        likes: likeMap.get(post.id) ?? 0,
        comments: commentMap.get(post.id) ?? 0,
        reshares: reshareMap.get(post.id) ?? 0,
        saves: saveMap.get(post.id) ?? 0,
      },
      isLiked: likedSet.has(post.id),
      isSaved: savedSet.has(post.id),
      isFollowingAuthor: followingSet.has(post.authorId),
    }));
  }

  // ----- comments -----

  async createComment(data: NewComment): Promise<Comment> {
    const [row] = await this.db.insert(comments).values(data).returning();
    return row;
  }

  async listComments(postId: string, limit: number, offset: number): Promise<Comment[]> {
    return this.db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findCommentById(id: string): Promise<Comment | undefined> {
    const [row] = await this.db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return row;
  }

  async deleteComment(id: string): Promise<void> {
    await this.db.delete(comments).where(eq(comments.id, id));
  }

  // ----- reactions (likes) -----

  async addReaction(data: NewReaction): Promise<Reaction> {
    const [row] = await this.db
      .insert(reactions)
      .values(data)
      .onConflictDoNothing()
      .returning();
    // If conflict (already liked), fetch existing row
    if (!row) {
      const [existing] = await this.db
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.userId, data.userId),
            eq(reactions.targetType, data.targetType),
            eq(reactions.targetId, data.targetId),
          ),
        )
        .limit(1);
      return existing;
    }
    return row;
  }

  async removeReaction(userId: string, targetType: 'post' | 'comment', targetId: string): Promise<void> {
    await this.db
      .delete(reactions)
      .where(
        and(
          eq(reactions.userId, userId),
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
        ),
      );
  }

  // ----- saves -----

  async savePost(userId: string, postId: string): Promise<void> {
    await this.db.insert(saves).values({ userId, postId }).onConflictDoNothing();
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    await this.db.delete(saves).where(and(eq(saves.userId, userId), eq(saves.postId, postId)));
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const rows = await this.db
      .select({ post: posts })
      .from(saves)
      .innerJoin(posts, eq(posts.id, saves.postId))
      .where(eq(saves.userId, userId))
      .orderBy(desc(saves.createdAt));
    return rows.map((r) => r.post);
  }

  // ----- reshares -----

  async createReshare(userId: string, postId: string): Promise<Reshare> {
    const [row] = await this.db.insert(reshares).values({ userId, postId }).returning();
    return row;
  }

  // ----- post shares (send) -----

  async createPostShare(data: NewPostShare): Promise<PostShare> {
    const [row] = await this.db.insert(postShares).values(data).returning();
    return row;
  }

  // ----- follows -----

  async followUser(data: NewFollow): Promise<void> {
    await this.db.insert(follows).values(data).onConflictDoNothing();
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getFollowers(userId: string): Promise<{ count: number; data: Follow[] }> {
    const data = await this.db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt));
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return { count: value, data };
  }

  async getFollowing(userId: string): Promise<{ count: number; data: Follow[] }> {
    const data = await this.db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return { count: value, data };
  }

  // ----- tags -----

  async listTags(type?: 'craft' | 'hashtag' | 'topic'): Promise<Tag[]> {
    if (type) {
      return this.db.select().from(tags).where(eq(tags.type, type));
    }
    return this.db.select().from(tags);
  }

  async findTagBySlug(slug: string): Promise<Tag | undefined> {
    const [row] = await this.db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
    return row;
  }

  async createTag(data: NewTag): Promise<Tag> {
    const [row] = await this.db.insert(tags).values(data).returning();
    return row;
  }
}
