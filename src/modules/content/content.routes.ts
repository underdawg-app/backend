import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { ContentController } from './content.controller.js';
import { ContentRepository } from './content.repository.js';
import { ContentService } from './content.service.js';
import { requirePostAuthor } from './content.middleware.js';
import {
  createPostBodySchema,
  updatePostBodySchema,
  feedQuerySchema,
  createCommentBodySchema,
  listCommentsQuerySchema,
  createTagBodySchema,
  listTagsQuerySchema,
  sharePostBodySchema,
  postIdParamSchema,
  commentIdParamSchema,
  userIdParamSchema,
} from './content.validator.js';

export async function contentRoutes(app: FastifyInstance): Promise<void> {
  const repo = new ContentRepository(app.db);
  const controller = new ContentController(new ContentService(repo));
  const postAuthorGuard = requirePostAuthor(repo);
  const router = typedRouter(app);

  // ----- posts -----

  router.post(
    '/posts',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['posts'],
        summary: 'Create a new post',
        body: createPostBodySchema,
      },
    },
    controller.createPost,
  );

  router.get(
    '/posts/:id',
    {
      schema: {
        tags: ['posts'],
        summary: 'Get post by id',
        params: postIdParamSchema,
      },
    },
    controller.getPost,
  );

  router.patch(
    '/posts/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['posts'],
        summary: 'Update post (author only)',
        params: postIdParamSchema,
        body: updatePostBodySchema,
      },
    },
    controller.updatePost,
  );

  router.delete(
    '/posts/:id',
    {
      preHandler: [app.authenticate, postAuthorGuard],
      schema: {
        tags: ['posts'],
        summary: 'Delete post (author only)',
        params: postIdParamSchema,
      },
    },
    controller.deletePost,
  );

  router.post(
    '/posts/:id/publish',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['posts'],
        summary: 'Publish post (author only)',
        params: postIdParamSchema,
      },
    },
    controller.publishPost,
  );

  // ----- feed -----

  router.get(
    '/feed',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['feed'],
        summary: 'Get feed (for_you | following | rising)',
        querystring: feedQuerySchema,
      },
    },
    controller.getFeed,
  );

  // ----- comments -----

  router.post(
    '/posts/:id/comments',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['comments'],
        summary: 'Add a comment to a post',
        params: postIdParamSchema,
        body: createCommentBodySchema,
      },
    },
    controller.createComment,
  );

  router.get(
    '/posts/:id/comments',
    {
      schema: {
        tags: ['comments'],
        summary: 'List comments for a post',
        params: postIdParamSchema,
        querystring: listCommentsQuerySchema,
      },
    },
    controller.listComments,
  );

  router.delete(
    '/comments/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['comments'],
        summary: 'Delete comment (author only)',
        params: commentIdParamSchema,
      },
    },
    controller.deleteComment,
  );

  // ----- likes (reactions) -----

  router.post(
    '/posts/:id/like',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['likes'],
        summary: 'Like a post (idempotent)',
        params: postIdParamSchema,
      },
    },
    controller.likePost,
  );

  router.delete(
    '/posts/:id/like',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['likes'],
        summary: 'Unlike a post',
        params: postIdParamSchema,
      },
    },
    controller.unlikePost,
  );

  router.post(
    '/comments/:id/like',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['likes'],
        summary: 'Like a comment (idempotent)',
        params: commentIdParamSchema,
      },
    },
    controller.likeComment,
  );

  router.delete(
    '/comments/:id/like',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['likes'],
        summary: 'Unlike a comment',
        params: commentIdParamSchema,
      },
    },
    controller.unlikeComment,
  );

  // ----- saves -----

  router.post(
    '/posts/:id/save',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['saves'],
        summary: 'Save a post (idempotent)',
        params: postIdParamSchema,
      },
    },
    controller.savePost,
  );

  router.delete(
    '/posts/:id/save',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['saves'],
        summary: 'Unsave a post',
        params: postIdParamSchema,
      },
    },
    controller.unsavePost,
  );

  router.get(
    '/saves',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['saves'],
        summary: "Get caller's saved posts",
      },
    },
    controller.getSavedPosts,
  );

  // ----- reshares -----

  router.post(
    '/posts/:id/reshare',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['reshares'],
        summary: 'Reshare a post',
        params: postIdParamSchema,
      },
    },
    controller.resharePost,
  );

  // ----- shares (send) -----

  router.post(
    '/posts/:id/share',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['shares'],
        summary: 'Send a post to a DM or group',
        params: postIdParamSchema,
        body: sharePostBodySchema,
      },
    },
    controller.sharePost,
  );

  // ----- follows -----

  router.post(
    '/users/:userId/follow',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['follows'],
        summary: 'Follow a user (idempotent)',
        params: userIdParamSchema,
      },
    },
    controller.followUser,
  );

  router.delete(
    '/users/:userId/follow',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['follows'],
        summary: 'Unfollow a user',
        params: userIdParamSchema,
      },
    },
    controller.unfollowUser,
  );

  router.get(
    '/users/:userId/followers',
    {
      schema: {
        tags: ['follows'],
        summary: 'List followers of a user',
        params: userIdParamSchema,
      },
    },
    controller.getFollowers,
  );

  router.get(
    '/users/:userId/following',
    {
      schema: {
        tags: ['follows'],
        summary: 'List users a user is following',
        params: userIdParamSchema,
      },
    },
    controller.getFollowing,
  );

  // ----- tags -----

  router.get(
    '/tags',
    {
      schema: {
        tags: ['tags'],
        summary: 'List tags',
        querystring: listTagsQuerySchema,
      },
    },
    controller.listTags,
  );

  router.post(
    '/tags',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['tags'],
        summary: 'Create a tag',
        body: createTagBodySchema,
      },
    },
    controller.createTag,
  );
}
