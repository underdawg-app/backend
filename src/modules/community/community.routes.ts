import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { CommunityController } from './community.controller.js';
import { CommunityRepository } from './community.repository.js';
import { CommunityService } from './community.service.js';
import { requireCommunityOwner } from './community.middleware.js';
import {
  createCommunityBodySchema,
  updateCommunityBodySchema,
  communityParamSchema,
  communityQuerySchema,
  addPostBodySchema,
  createEventBodySchema,
  eventParamSchema,
  rsvpBodySchema,
  createPollBodySchema,
  pollParamSchema,
  voteBodySchema,
  askQuestionBodySchema,
  userParamSchema,
  questionParamSchema,
  answerBodySchema,
} from './community.validator.js';

export async function communityRoutes(app: FastifyInstance): Promise<void> {
  const repo = new CommunityRepository(app.db);
  const controller = new CommunityController(new CommunityService(repo));
  const router = typedRouter(app);

  // ----- communities -----
  router.post(
    '/communities',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['communities'],
        summary: 'Create a community',
        body: createCommunityBodySchema,
      },
    },
    controller.createCommunity,
  );

  router.get(
    '/communities',
    {
      schema: {
        tags: ['communities'],
        summary: 'List communities',
        querystring: communityQuerySchema,
      },
    },
    controller.listCommunities,
  );

  router.get(
    '/communities/:id',
    {
      schema: {
        tags: ['communities'],
        summary: 'Get community by id',
        params: communityParamSchema,
      },
    },
    controller.getCommunity,
  );

  router.patch(
    '/communities/:id',
    {
      preHandler: [app.authenticate, requireCommunityOwner(repo)],
      schema: {
        tags: ['communities'],
        summary: 'Update community (owner only)',
        params: communityParamSchema,
        body: updateCommunityBodySchema,
      },
    },
    controller.updateCommunity,
  );

  router.delete(
    '/communities/:id',
    {
      preHandler: [app.authenticate, requireCommunityOwner(repo)],
      schema: {
        tags: ['communities'],
        summary: 'Delete community (owner only)',
        params: communityParamSchema,
      },
    },
    controller.deleteCommunity,
  );

  router.post(
    '/communities/:id/join',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['communities'],
        summary: 'Join a community',
        params: communityParamSchema,
      },
    },
    controller.joinCommunity,
  );

  router.post(
    '/communities/:id/leave',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['communities'],
        summary: 'Leave a community',
        params: communityParamSchema,
      },
    },
    controller.leaveCommunity,
  );

  router.get(
    '/communities/:id/members',
    {
      schema: {
        tags: ['communities'],
        summary: 'List community members',
        params: communityParamSchema,
      },
    },
    controller.listMembers,
  );

  // ----- community posts -----
  router.post(
    '/communities/:id/posts',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['community-posts'],
        summary: 'Add post to community (must be member)',
        params: communityParamSchema,
        body: addPostBodySchema,
      },
    },
    controller.addPost,
  );

  router.get(
    '/communities/:id/posts',
    {
      schema: {
        tags: ['community-posts'],
        summary: 'List posts in community',
        params: communityParamSchema,
      },
    },
    controller.listCommunityPosts,
  );

  // ----- events -----
  router.post(
    '/communities/:id/events',
    {
      preHandler: [app.authenticate, requireCommunityOwner(repo)],
      schema: {
        tags: ['events'],
        summary: 'Create community event (owner only)',
        params: communityParamSchema,
        body: createEventBodySchema,
      },
    },
    controller.createEvent,
  );

  router.get(
    '/communities/:id/events',
    {
      schema: {
        tags: ['events'],
        summary: 'List community events',
        params: communityParamSchema,
      },
    },
    controller.listEvents,
  );

  router.post(
    '/events/:id/rsvp',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['events'],
        summary: 'RSVP to an event',
        params: eventParamSchema,
        body: rsvpBodySchema,
      },
    },
    controller.rsvpEvent,
  );

  // ----- polls -----
  router.post(
    '/polls',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['polls'],
        summary: 'Create a poll',
        body: createPollBodySchema,
      },
    },
    controller.createPoll,
  );

  router.get(
    '/polls/:id',
    {
      schema: {
        tags: ['polls'],
        summary: 'Get poll with options and vote counts',
        params: pollParamSchema,
      },
    },
    controller.getPoll,
  );

  router.post(
    '/polls/:id/vote',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['polls'],
        summary: 'Vote on a poll',
        params: pollParamSchema,
        body: voteBodySchema,
      },
    },
    controller.vote,
  );

  router.post(
    '/polls/:id/close',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['polls'],
        summary: 'Close a poll (owner only)',
        params: pollParamSchema,
      },
    },
    controller.closePoll,
  );

  // ----- q&a -----
  router.post(
    '/users/:userId/questions',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['qna'],
        summary: 'Ask a question to a user',
        params: userParamSchema,
        body: askQuestionBodySchema,
      },
    },
    controller.askQuestion,
  );

  router.get(
    '/users/:userId/questions',
    {
      schema: {
        tags: ['qna'],
        summary: "List a user's answered questions",
        params: userParamSchema,
      },
    },
    controller.listAnsweredQuestions,
  );

  router.post(
    '/questions/:id/answer',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['qna'],
        summary: 'Answer a question (target user only)',
        params: questionParamSchema,
        body: answerBodySchema,
      },
    },
    controller.answerQuestion,
  );
}
