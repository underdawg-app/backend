import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioRepository } from './portfolio.repository.js';
import { PortfolioService } from './portfolio.service.js';
import {
  addPieceBodySchema,
  updatePieceBodySchema,
  publicConfigBodySchema,
  openToBodySchema,
  addRateBodySchema,
  addPastClientBodySchema,
  pieceIdParamSchema,
  userIdParamSchema,
  rateIdParamSchema,
  pastClientIdParamSchema,
} from './portfolio.validator.js';

export async function portfolioRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PortfolioRepository(app.db);
  const controller = new PortfolioController(new PortfolioService(repo));
  const router = typedRouter(app);

  // ----- my portfolio -----
  router.get(
    '/portfolios/me',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['portfolio'], summary: 'Get or create my portfolio with pieces' },
    },
    controller.getMyPortfolio,
  );

  // ----- pieces -----
  router.post(
    '/portfolios/me/pieces',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Add a piece to my portfolio',
        body: addPieceBodySchema,
      },
    },
    controller.addPiece,
  );

  router.patch(
    '/portfolios/me/pieces/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Update a portfolio piece',
        params: pieceIdParamSchema,
        body: updatePieceBodySchema,
      },
    },
    controller.updatePiece,
  );

  router.delete(
    '/portfolios/me/pieces/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Delete a portfolio piece',
        params: pieceIdParamSchema,
      },
    },
    controller.deletePiece,
  );

  // ----- public portfolio -----
  router.get(
    '/portfolios/:userId',
    {
      schema: {
        tags: ['portfolio'],
        summary: "Get a user's public portfolio with pieces",
        params: userIdParamSchema,
      },
    },
    controller.getPublicPortfolio,
  );

  // ----- public page config -----
  router.get(
    '/portfolios/me/public-config',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['portfolio'], summary: 'Get or create my public page config' },
    },
    controller.getPublicConfig,
  );

  router.put(
    '/portfolios/me/public-config',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Upsert my public page config',
        body: publicConfigBodySchema,
      },
    },
    controller.upsertPublicConfig,
  );

  // ----- open_to -----
  router.get(
    '/portfolios/me/open-to',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['portfolio'], summary: 'List my open-to settings' },
    },
    controller.listOpenTo,
  );

  router.put(
    '/portfolios/me/open-to',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Replace my open-to settings',
        body: openToBodySchema,
      },
    },
    controller.replaceOpenTo,
  );

  // ----- rates -----
  router.get(
    '/portfolios/:userId/rates',
    {
      schema: {
        tags: ['portfolio'],
        summary: "List a user's public rates",
        params: userIdParamSchema,
      },
    },
    controller.listPublicRates,
  );

  router.post(
    '/portfolios/me/rates',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Add a rate',
        body: addRateBodySchema,
      },
    },
    controller.addRate,
  );

  router.delete(
    '/portfolios/me/rates/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Delete a rate',
        params: rateIdParamSchema,
      },
    },
    controller.deleteRate,
  );

  // ----- past clients -----
  router.get(
    '/portfolios/:userId/past-clients',
    {
      schema: {
        tags: ['portfolio'],
        summary: "List a user's past clients",
        params: userIdParamSchema,
      },
    },
    controller.listPastClients,
  );

  router.post(
    '/portfolios/me/past-clients',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Add a past client',
        body: addPastClientBodySchema,
      },
    },
    controller.addPastClient,
  );

  router.delete(
    '/portfolios/me/past-clients/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['portfolio'],
        summary: 'Delete a past client',
        params: pastClientIdParamSchema,
      },
    },
    controller.deletePastClient,
  );
}
