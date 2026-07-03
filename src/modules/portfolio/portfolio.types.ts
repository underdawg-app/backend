import type { z } from 'zod';
import type {
  Portfolio,
  PortfolioPiece,
} from '../../schema/index.js';
import type {
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

export type {
  Portfolio,
  NewPortfolio,
  PortfolioPiece,
  NewPortfolioPiece,
  PublicPageConfig,
  NewPublicPageConfig,
  OpenTo,
  NewOpenTo,
  Rate,
  NewRate,
  PastClient,
  NewPastClient,
} from '../../schema/index.js';

export type AddPieceBody = z.infer<typeof addPieceBodySchema>;
export type UpdatePieceBody = z.infer<typeof updatePieceBodySchema>;
export type PublicConfigBody = z.infer<typeof publicConfigBodySchema>;
export type OpenToBody = z.infer<typeof openToBodySchema>;
export type AddRateBody = z.infer<typeof addRateBodySchema>;
export type AddPastClientBody = z.infer<typeof addPastClientBodySchema>;

export type PieceIdParam = z.infer<typeof pieceIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type RateIdParam = z.infer<typeof rateIdParamSchema>;
export type PastClientIdParam = z.infer<typeof pastClientIdParamSchema>;

export interface PortfolioWithPieces {
  portfolio: Portfolio;
  pieces: PortfolioPiece[];
}
