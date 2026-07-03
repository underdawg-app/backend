import type { FastifyInstance } from 'fastify';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { healthResponseSchema, readyResponseSchema } from './health.schema.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const controller = new HealthController(new HealthService(app.db));
  const router = app;

  router.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Liveness probe',
        response: { 200: healthResponseSchema },
      },
    },
    controller.health,
  );

  router.get(
    '/ready',
    {
      schema: {
        tags: ['health'],
        summary: 'Readiness probe',
        response: { 200: readyResponseSchema, 503: readyResponseSchema },
      },
    },
    controller.ready,
  );
}
