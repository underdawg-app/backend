import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../../utils/errors.js';

/**
 * Service-scoped guard: ensures the authenticated user matches the `:id` route
 * param (self-only mutation). `app.authenticate` must run first.
 */
export function requireSelf(paramKey = 'id') {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const params = req.params as Record<string, string>;
    if (params[paramKey] !== req.user.id) {
      throw new UnauthorizedError('Cannot act on behalf of another user');
    }
  };
}
