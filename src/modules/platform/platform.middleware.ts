import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import type { PlatformRepository } from './platform.repository.js';

/**
 * Route guard: loads the platform connection by `:id` param and verifies
 * it belongs to the authenticated user. Throws NotFound if the row does not
 * exist, Forbidden if it belongs to another user. `app.authenticate` must
 * run before this handler.
 */
export function requireConnectionOwner(repo: PlatformRepository) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();

    const params = req.params as Record<string, string>;
    const id = params['id'];

    const connection = await repo.findById(id);
    if (!connection) throw new NotFoundError('Platform connection not found');
    if (connection.userId !== req.user.id) throw new ForbiddenError();
  };
}
