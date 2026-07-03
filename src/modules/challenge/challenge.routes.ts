import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { ChallengeController } from './challenge.controller.js';
import { ChallengeRepository } from './challenge.repository.js';
import { ChallengeService } from './challenge.service.js';
import { requireChallengeHost } from './challenge.middleware.js';
import {
  createChallengeBodySchema,
  updateChallengeBodySchema,
  challengeParamSchema,
  entryParamSchema,
  listChallengesQuerySchema,
  createEntryBodySchema,
  createResultBodySchema,
} from './challenge.validator.js';

export async function challengeRoutes(app: FastifyInstance): Promise<void> {
  const repo = new ChallengeRepository(app.db);
  const controller = new ChallengeController(new ChallengeService(repo));
  const hostGuard = requireChallengeHost(repo);
  const router = typedRouter(app);

  // ----- challenges CRUD -----

  router.post(
    '/challenges',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['challenges'],
        summary: 'Create a challenge',
        body: createChallengeBodySchema,
      },
    },
    controller.create,
  );

  router.get(
    '/challenges',
    {
      schema: {
        tags: ['challenges'],
        summary: 'List challenges',
        querystring: listChallengesQuerySchema,
      },
    },
    controller.list,
  );

  router.get(
    '/challenges/:id',
    {
      schema: {
        tags: ['challenges'],
        summary: 'Get challenge by id',
        params: challengeParamSchema,
      },
    },
    controller.getById,
  );

  router.patch(
    '/challenges/:id',
    {
      preHandler: [app.authenticate, hostGuard],
      schema: {
        tags: ['challenges'],
        summary: 'Update a challenge (host only)',
        params: challengeParamSchema,
        body: updateChallengeBodySchema,
      },
    },
    controller.update,
  );

  router.delete(
    '/challenges/:id',
    {
      preHandler: [app.authenticate, hostGuard],
      schema: {
        tags: ['challenges'],
        summary: 'Delete a challenge (host only)',
        params: challengeParamSchema,
      },
    },
    controller.delete,
  );

  // ----- entries -----

  router.post(
    '/challenges/:id/entries',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['challenges'],
        summary: 'Submit an entry to a challenge',
        params: challengeParamSchema,
        body: createEntryBodySchema,
      },
    },
    controller.createEntry,
  );

  router.get(
    '/challenges/:id/entries',
    {
      schema: {
        tags: ['challenges'],
        summary: 'List entries for a challenge',
        params: challengeParamSchema,
      },
    },
    controller.listEntries,
  );

  // ----- votes -----

  router.post(
    '/entries/:id/vote',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['challenges'],
        summary: 'Vote for a challenge entry',
        params: entryParamSchema,
      },
    },
    controller.vote,
  );

  // ----- leaderboard -----

  router.get(
    '/challenges/:id/leaderboard',
    {
      schema: {
        tags: ['challenges'],
        summary: 'Get leaderboard for a challenge',
        params: challengeParamSchema,
      },
    },
    controller.getLeaderboard,
  );

  // ----- results -----

  router.post(
    '/challenges/:id/results',
    {
      preHandler: [app.authenticate, hostGuard],
      schema: {
        tags: ['challenges'],
        summary: 'Publish a result for a challenge (host only)',
        params: challengeParamSchema,
        body: createResultBodySchema,
      },
    },
    controller.createResult,
  );

  router.get(
    '/challenges/:id/results',
    {
      schema: {
        tags: ['challenges'],
        summary: 'Get results for a challenge',
        params: challengeParamSchema,
      },
    },
    controller.listResults,
  );
}
