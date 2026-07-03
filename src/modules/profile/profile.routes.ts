import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { UserRepository } from '../user/user.repository.js';
import { ContentRepository } from '../content/content.repository.js';
import { PortfolioRepository } from '../portfolio/portfolio.repository.js';
import { ReputationRepository } from '../reputation/reputation.repository.js';
import { ProfileController } from './profile.controller.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileService } from './profile.service.js';
import { profileUsernameParamSchema } from './profile.validator.js';

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const service = new ProfileService(
    new ProfileRepository(app.db),
    new UserRepository(app.db),
    new ContentRepository(app.db),
    new PortfolioRepository(app.db),
    new ReputationRepository(app.db),
  );
  const controller = new ProfileController(service);
  const router = typedRouter(app);

  router.get(
    '/profile/me',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['profile'], summary: 'Aggregated profile screen for the caller' },
    },
    controller.getMe,
  );

  router.get(
    '/profile/:username',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['profile'],
        summary: 'Aggregated profile screen for a user by username',
        params: profileUsernameParamSchema,
      },
    },
    controller.getByUsername,
  );
}
