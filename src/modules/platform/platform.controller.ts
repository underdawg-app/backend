import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { PlatformService } from './platform.service.js';
import type { CreateConnectionBody, UpdateConnectionBody } from './platform.types.js';

export class PlatformController {
  constructor(private readonly service: PlatformService) {}

  listConnections = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const data = await this.service.listConnections(req.user.id);
    reply.send({ data });
  };

  createConnection = async (
    req: FastifyRequest<{ Body: CreateConnectionBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const connection = await this.service.createConnection(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(connection);
  };

  getConnection = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const connection = await this.service.getConnection(req.params.id, req.user.id);
    reply.send(connection);
  };

  updateConnection = async (
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateConnectionBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const connection = await this.service.updateConnection(req.params.id, req.user.id, req.body);
    reply.send(connection);
  };

  deleteConnection = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deleteConnection(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  syncConnection = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const connection = await this.service.syncConnection(req.params.id, req.user.id);
    reply.send(connection);
  };
}
