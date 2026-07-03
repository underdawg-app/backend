import type { FastifyInstance } from 'fastify';
import { API_PREFIX } from '../config/constants.js';
import { healthRoutes } from '../modules/health/health.routes.js';
import { userRoutes } from '../modules/user/user.routes.js';
import { mediaRoutes } from '../modules/media/media.routes.js';
import { portfolioRoutes } from '../modules/portfolio/portfolio.routes.js';
import { platformRoutes } from '../modules/platform/platform.routes.js';
import { contentRoutes } from '../modules/content/content.routes.js';
import { chatRoutes } from '../modules/chat/chat.routes.js';
import { communityRoutes } from '../modules/community/community.routes.js';
import { challengeRoutes } from '../modules/challenge/challenge.routes.js';
import { analyticsRoutes } from '../modules/analytics/analytics.routes.js';
import { reputationRoutes } from '../modules/reputation/reputation.routes.js';
import { profileRoutes } from '../modules/profile/profile.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // health/readiness — unprefixed (probes)
  await app.register(healthRoutes);

  // versioned API
  await app.register(
    async (api) => {
      await api.register(userRoutes);
      await api.register(mediaRoutes);
      await api.register(portfolioRoutes);
      await api.register(platformRoutes);
      await api.register(contentRoutes);
      await api.register(chatRoutes);
      await api.register(communityRoutes);
      await api.register(challengeRoutes);
      await api.register(analyticsRoutes);
      await api.register(reputationRoutes);
      await api.register(profileRoutes);
    },
    { prefix: API_PREFIX },
  );
}
