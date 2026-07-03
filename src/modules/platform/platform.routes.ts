import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { PlatformController } from './platform.controller.js';
import { PlatformRepository } from './platform.repository.js';
import { PlatformService } from './platform.service.js';
import { requireConnectionOwner } from './platform.middleware.js';
import {
  createConnectionBodySchema,
  updateConnectionBodySchema,
  connectionIdParamSchema,
} from './platform.validator.js';

export async function platformRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PlatformRepository(app.db);
  const controller = new PlatformController(new PlatformService(repo));
  const router = typedRouter(app);

  // ----- list / create -----
  router.get(
    '/platform-connections',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['platform'], summary: 'List own platform connections' },
    },
    controller.listConnections,
  );

  router.post(
    '/platform-connections',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['platform'],
        summary: 'Connect a social platform',
        body: createConnectionBodySchema,
      },
    },
    controller.createConnection,
  );

  // ----- single-resource routes -----
  router.get(
    '/platform-connections/:id',
    {
      preHandler: [app.authenticate, requireConnectionOwner(repo)],
      schema: {
        tags: ['platform'],
        summary: 'Get a platform connection',
        params: connectionIdParamSchema,
      },
    },
    controller.getConnection,
  );

  router.patch(
    '/platform-connections/:id',
    {
      preHandler: [app.authenticate, requireConnectionOwner(repo)],
      schema: {
        tags: ['platform'],
        summary: 'Update a platform connection',
        params: connectionIdParamSchema,
        body: updateConnectionBodySchema,
      },
    },
    controller.updateConnection,
  );

  router.delete(
    '/platform-connections/:id',
    {
      preHandler: [app.authenticate, requireConnectionOwner(repo)],
      schema: {
        tags: ['platform'],
        summary: 'Delete a platform connection',
        params: connectionIdParamSchema,
      },
    },
    controller.deleteConnection,
  );

  // ----- sync -----
  router.post(
    '/platform-connections/:id/sync',
    {
      preHandler: [app.authenticate, requireConnectionOwner(repo)],
      schema: {
        tags: ['platform'],
        summary: 'Sync a platform connection (stub)',
        params: connectionIdParamSchema,
      },
    },
    controller.syncConnection,
  );
}
