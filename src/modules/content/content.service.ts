import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import type { ContentRepository } from './content.repository.js';
import type {
  Post,
  MediaAsset,
  Tag,
  Comment,
  Reaction,
  Reshare,
  PostShare,
  Follow,
  CreatePostBody,
  UpdatePostBody,
  CreateCommentBody,
  CreateTagBody,
  FeedQuery,
  FeedResult,
  ListCommentsQuery,
  ListTagsQuery,
  SharePostBody,
} from './content.types.js';

/** rising cursor is a numeric offset; tolerate missing/garbage as 0. */
function parseOffset(cursor?: string): number {
  const n = cursor ? Number(cursor) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Null when the page is the last one; otherwise the cursor for the next page. */
function nextCursor(section: FeedQuery['section'], rows: Post[], limit: number, cursor?: string): string | null {
  if (rows.length < limit) return null;
  if (section === 'rising') return String(parseOffset(cursor) + limit);
  return rows[rows.length - 1].createdAt.toISOString();
}

export class ContentService {
  constructor(private readonly repo: ContentRepository) {}

  // ----- posts -----

  async createPost(
    authorId: string,
    input: CreatePostBody,
  ): Promise<{ post: Post; media: MediaAsset[] }> {
    const media = (input.media ?? []).map((m, i) => ({
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl ?? null,
      position: m.position ?? i,
    }));

    const post = await this.repo.createPost(
      {
        authorId,
        caption: input.caption ?? null,
        visibility: input.visibility ?? 'public',
        location: input.location ?? null,
        commentsEnabled: input.commentsEnabled ?? true,
        sharingEnabled: input.sharingEnabled ?? true,
        downloadEnabled: input.downloadEnabled ?? false,
        ageRestricted: input.ageRestricted ?? false,
        status: input.status ?? 'draft',
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      },
      media,
      input.tagIds ?? [],
      input.mentionUserIds ?? [],
    );

    const mediaRows = await this.repo.findPostWithMedia(post.id);
    return { post, media: mediaRows?.media ?? [] };
  }

  async getPost(id: string): Promise<{ post: Post; media: MediaAsset[] }> {
    const result = await this.repo.findPostWithMedia(id);
    if (!result) throw new NotFoundError('Post not found');
    return result;
  }

  async updatePost(id: string, callerId: string, input: UpdatePostBody): Promise<Post> {
    const post = await this.repo.findPostById(id);
    if (!post) throw new NotFoundError('Post not found');
    if (post.authorId !== callerId) throw new ForbiddenError('Not the post author');

    const updates: Partial<Post> = {};
    if (input.caption !== undefined) updates.caption = input.caption;
    if (input.visibility !== undefined) updates.visibility = input.visibility;
    if (input.location !== undefined) updates.location = input.location;
    if (input.commentsEnabled !== undefined) updates.commentsEnabled = input.commentsEnabled;
    if (input.sharingEnabled !== undefined) updates.sharingEnabled = input.sharingEnabled;
    if (input.downloadEnabled !== undefined) updates.downloadEnabled = input.downloadEnabled;
    if (input.ageRestricted !== undefined) updates.ageRestricted = input.ageRestricted;
    if (input.status !== undefined) updates.status = input.status;
    if (input.scheduledAt !== undefined) {
      updates.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    }

    const updated = await this.repo.updatePost(id, updates);
    if (!updated) throw new NotFoundError('Post not found');
    return updated;
  }

  async deletePost(id: string, callerId: string): Promise<void> {
    const post = await this.repo.findPostById(id);
    if (!post) throw new NotFoundError('Post not found');
    if (post.authorId !== callerId) throw new ForbiddenError('Not the post author');
    await this.repo.deletePost(id);
  }

  async publishPost(id: string, callerId: string): Promise<Post> {
    const post = await this.repo.findPostById(id);
    if (!post) throw new NotFoundError('Post not found');
    if (post.authorId !== callerId) throw new ForbiddenError('Not the post author');
    const updated = await this.repo.publishPost(id);
    if (!updated) throw new NotFoundError('Post not found');
    return updated;
  }

  // ----- feed -----

  async getFeed(callerId: string, query: FeedQuery): Promise<FeedResult> {
    const { section, limit, cursor, craft } = query;

    let rows: Post[];
    if (section === 'following') {
      rows = await this.repo.getFeedFollowing(callerId, limit, cursor, craft);
    } else if (section === 'rising') {
      rows = await this.repo.getFeedRising(limit, parseOffset(cursor), craft);
    } else {
      rows = await this.repo.getFeedForYou(callerId, limit, cursor, craft);
    }

    const data = await this.repo.enrichPosts(callerId, rows);
    return { data, nextCursor: nextCursor(section, rows, limit, cursor) };
  }

  // ----- comments -----

  async createComment(postId: string, authorId: string, input: CreateCommentBody): Promise<Comment> {
    const post = await this.repo.findPostById(postId);
    if (!post) throw new NotFoundError('Post not found');
    if (!post.commentsEnabled) throw new BadRequestError('Comments are disabled for this post');
    return this.repo.createComment({
      postId,
      authorId,
      parentId: input.parentId ?? null,
      body: input.body,
    });
  }

  async listComments(postId: string, query: ListCommentsQuery): Promise<Comment[]> {
    return this.repo.listComments(postId, query.limit, query.offset);
  }

  async deleteComment(id: string, callerId: string): Promise<void> {
    const comment = await this.repo.findCommentById(id);
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.authorId !== callerId) throw new ForbiddenError('Not the comment author');
    await this.repo.deleteComment(id);
  }

  // ----- likes -----

  async likePost(postId: string, userId: string): Promise<Reaction> {
    const post = await this.repo.findPostById(postId);
    if (!post) throw new NotFoundError('Post not found');
    return this.repo.addReaction({ userId, targetType: 'post', targetId: postId });
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await this.repo.removeReaction(userId, 'post', postId);
  }

  async likeComment(commentId: string, userId: string): Promise<Reaction> {
    const comment = await this.repo.findCommentById(commentId);
    if (!comment) throw new NotFoundError('Comment not found');
    return this.repo.addReaction({ userId, targetType: 'comment', targetId: commentId });
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    await this.repo.removeReaction(userId, 'comment', commentId);
  }

  // ----- saves -----

  async savePost(postId: string, userId: string): Promise<void> {
    const post = await this.repo.findPostById(postId);
    if (!post) throw new NotFoundError('Post not found');
    await this.repo.savePost(userId, postId);
  }

  async unsavePost(postId: string, userId: string): Promise<void> {
    await this.repo.unsavePost(userId, postId);
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    return this.repo.getSavedPosts(userId);
  }

  // ----- reshares -----

  async resharePost(postId: string, userId: string): Promise<Reshare> {
    const post = await this.repo.findPostById(postId);
    if (!post) throw new NotFoundError('Post not found');
    return this.repo.createReshare(userId, postId);
  }

  // ----- shares (send) -----

  async sharePost(postId: string, senderId: string, input: SharePostBody): Promise<PostShare> {
    const post = await this.repo.findPostById(postId);
    if (!post) throw new NotFoundError('Post not found');
    return this.repo.createPostShare({
      postId,
      senderId,
      targetType: input.targetType,
      firebaseThreadId: input.firebaseThreadId ?? null,
    });
  }

  // ----- follows -----

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw new BadRequestError('Cannot follow yourself');
    await this.repo.followUser({ followerId, followingId });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.repo.unfollowUser(followerId, followingId);
  }

  async getFollowers(userId: string): Promise<{ count: number; data: Follow[] }> {
    return this.repo.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<{ count: number; data: Follow[] }> {
    return this.repo.getFollowing(userId);
  }

  // ----- tags -----

  async listTags(query: ListTagsQuery): Promise<Tag[]> {
    return this.repo.listTags(query.type);
  }

  async createTag(callerId: string, input: CreateTagBody): Promise<Tag> {
    if (!callerId) throw new UnauthorizedError();
    const existing = await this.repo.findTagBySlug(input.slug);
    if (existing) throw new ConflictError(`Tag with slug '${input.slug}' already exists`);
    return this.repo.createTag({
      name: input.name,
      slug: input.slug,
      type: input.type ?? 'hashtag',
    });
  }
}
