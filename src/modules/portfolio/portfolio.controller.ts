import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { PortfolioService } from './portfolio.service.js';
import type {
  AddPieceBody,
  UpdatePieceBody,
  PublicConfigBody,
  OpenToBody,
  AddRateBody,
  AddPastClientBody,
  PieceIdParam,
  UserIdParam,
  RateIdParam,
  PastClientIdParam,
} from './portfolio.types.js';

export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  // ----- my portfolio -----
  getMyPortfolio = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!_req.user) throw new UnauthorizedError();
    const result = await this.service.getOrCreateMyPortfolio(_req.user.id);
    reply.send(result);
  };

  // ----- pieces -----
  addPiece = async (
    req: FastifyRequest<{ Body: AddPieceBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const piece = await this.service.addPiece(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(piece);
  };

  updatePiece = async (
    req: FastifyRequest<{ Params: PieceIdParam; Body: UpdatePieceBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const piece = await this.service.updatePiece(req.user.id, req.params.id, req.body);
    reply.send(piece);
  };

  deletePiece = async (
    req: FastifyRequest<{ Params: PieceIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deletePiece(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  // ----- public portfolio -----
  getPublicPortfolio = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.getPublicPortfolio(req.params.userId);
    reply.send(result);
  };

  // ----- public page config -----
  getPublicConfig = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!_req.user) throw new UnauthorizedError();
    const config = await this.service.getOrCreatePublicConfig(_req.user.id);
    reply.send(config);
  };

  upsertPublicConfig = async (
    req: FastifyRequest<{ Body: PublicConfigBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const config = await this.service.upsertPublicConfig(req.user.id, req.body);
    reply.send(config);
  };

  // ----- open_to -----
  listOpenTo = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!_req.user) throw new UnauthorizedError();
    const items = await this.service.listOpenTo(_req.user.id);
    reply.send({ data: items });
  };

  replaceOpenTo = async (
    req: FastifyRequest<{ Body: OpenToBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const items = await this.service.replaceOpenTo(req.user.id, req.body);
    reply.send({ data: items });
  };

  // ----- rates -----
  listPublicRates = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const items = await this.service.listPublicRates(req.params.userId);
    reply.send({ data: items });
  };

  addRate = async (
    req: FastifyRequest<{ Body: AddRateBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const rate = await this.service.addRate(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(rate);
  };

  deleteRate = async (
    req: FastifyRequest<{ Params: RateIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deleteRate(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  // ----- past clients -----
  listPastClients = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const items = await this.service.listPastClients(req.params.userId);
    reply.send({ data: items });
  };

  addPastClient = async (
    req: FastifyRequest<{ Body: AddPastClientBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const client = await this.service.addPastClient(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(client);
  };

  deletePastClient = async (
    req: FastifyRequest<{ Params: PastClientIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deletePastClient(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };
}
