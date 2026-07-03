import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import type { PortfolioRepository } from './portfolio.repository.js';

/**
 * Route-level guard: loads the piece by `:id` param and 403s if the caller
 * is not the owner of the portfolio the piece belongs to.
 * `app.authenticate` must run before this hook.
 */
export function requirePieceOwner(repo: PortfolioRepository) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const params = req.params as Record<string, string>;
    const pieceId = params['id'];
    if (!pieceId) throw new NotFoundError('Piece not found');

    const piece = await repo.findPieceById(pieceId);
    if (!piece) throw new NotFoundError('Piece not found');

    const portfolio = await repo.findById(piece.portfolioId);
    if (!portfolio) throw new NotFoundError('Portfolio not found');

    if (portfolio.userId !== req.user.id) throw new ForbiddenError();
  };
}
