import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { ReputationController } from './reputation.controller.js';
import { ReputationRepository } from './reputation.repository.js';
import { ReputationService } from './reputation.service.js';
import { recomputeBodySchema, userIdParamSchema } from './reputation.validator.js';

export async function reputationRoutes(app: FastifyInstance): Promise<void> {
  const controller = new ReputationController(
    new ReputationService(new ReputationRepository(app.db)),
  );
  const router = typedRouter(app);

  // ----- public -----
  router.get(
    '/users/:userId/reputation',
    {
      schema: {
        tags: ['reputation'],
        summary: "Get a user's reputation score by userId",
        params: userIdParamSchema,
      },
    },
    controller.getByUserId,
  );

  // ----- authenticated -----
  router.get(
    '/reputation/me',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['reputation'],
        summary: "Get or initialise the caller's reputation row",
      },
    },
    controller.getMe,
  );

  router.post(
    '/reputation/me/recompute',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['reputation'],
        /**
         * STUB: sums provided numeric factor values (clamped 0–100) to derive
         * score + tier, then upserts the row. Replace with real signal
         * aggregation before production.
         */
        summary: '[STUB] Recompute own reputation from provided factors',
        body: recomputeBodySchema,
      },
    },
    controller.recomputeMe,
  );
}
