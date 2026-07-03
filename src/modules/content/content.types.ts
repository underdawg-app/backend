import type { z } from 'zod';
import type {
  createPostBodySchema,
  updatePostBodySchema,
  createCommentBodySchema,
  createTagBodySchema,
  feedQuerySchema,
  listCommentsQuerySchema,
  listTagsQuerySchema,
  sharePostBodySchema,
  postIdParamSchema,
  commentIdParamSchema,
  userIdParamSchema,
} from './content.validator.js';

import type {
  Post,
  NewPost,
  MediaAsset,
  NewMediaAsset,
  Tag,
  NewTag,
  Comment,
  NewComment,
  Reaction,
  NewReaction,
  Reshare,
  PostShare,
  NewPostShare,
  Follow,
  NewFollow,
} from '../../schema/index.js';

export type {
  Post,
  NewPost,
  MediaAsset,
  NewMediaAsset,
  Tag,
  NewTag,
  Comment,
  NewComment,
  Reaction,
  NewReaction,
  Reshare,
  PostShare,
  NewPostShare,
  Follow,
  NewFollow,
};

export type CreatePostBody = z.infer<typeof createPostBodySchema>;
export type UpdatePostBody = z.infer<typeof updatePostBodySchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
export type CreateTagBody = z.infer<typeof createTagBodySchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;
export type SharePostBody = z.infer<typeof sharePostBodySchema>;
export type PostIdParam = z.infer<typeof postIdParamSchema>;
export type CommentIdParam = z.infer<typeof commentIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

export interface PostWithMedia {
  post: Post;
  media: MediaAsset[];
}

export interface FollowList {
  count: number;
  data: Follow[];
}

// ---------- enriched feed cards ----------
export interface FeedAuthor {
  id: string;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
  locationCity: string | null;
}

export interface FeedTag {
  id: string;
  name: string;
  slug: string;
  type: 'craft' | 'hashtag' | 'topic';
}

export interface FeedMention {
  id: string;
  username: string | null;
  displayName: string | null;
}

export interface PostCounts {
  likes: number;
  comments: number;
  reshares: number;
  saves: number;
}

export interface EnrichedPost {
  post: Post;
  author: FeedAuthor;
  media: MediaAsset[];
  tags: FeedTag[];
  mentions: FeedMention[];
  counts: PostCounts;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingAuthor: boolean;
}

export interface FeedResult {
  data: EnrichedPost[];
  nextCursor: string | null;
}
