import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../../utils/errors.js';
import type { ReputationTier } from './reputation.types.js';

/**
 * Derives the reputation tier from a numeric score.
 *
 * Thresholds:
 *   0–30   → emerging
 *   31–50  → bronze
 *   51–70  → silver
 *   71–85  → gold
 *   86–100 → platinum
 */
export function tierForScore(score: number): ReputationTier {
  if (score <= 30) return 'emerging';
  if (score <= 50) return 'bronze';
  if (score <= 70) return 'silver';
  if (score <= 85) return 'gold';
  return 'platinum';
}

/**
 * Route guard: ensures the authenticated user matches the `:userId` route param.
 * `app.authenticate` must run before this handler.
 */
export function requireReputationSelf(paramKey = 'userId') {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const params = req.params as Record<string, string>;
    if (params[paramKey] !== req.user.id) {
      throw new UnauthorizedError('Cannot act on behalf of another user');
    }
  };
}
