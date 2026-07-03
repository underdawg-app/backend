import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsRepository } from './analytics.repository.js';
import { AnalyticsService } from './analytics.service.js';
import {
  createEventBodySchema,
  listEventsQuerySchema,
  summaryQuerySchema,
} from './analytics.validator.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  const controller = new AnalyticsController(new AnalyticsService(new AnalyticsRepository(app.db)));
  const router = typedRouter(app);

  router.post(
    '/analytics/events',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['analytics'],
        summary: 'Track a raw analytics event',
        body: createEventBodySchema,
      },
    },
    controller.trackEvent,
  );

  router.get(
    '/analytics/events',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['analytics'],
        summary: "List caller's own analytics events",
        querystring: listEventsQuerySchema,
      },
    },
    controller.listEvents,
  );

  router.get(
    '/analytics/summary',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['analytics'],
        summary: "Derived counts grouped by type for caller's events",
        querystring: summaryQuerySchema,
      },
    },
    controller.getSummary,
  );
}
