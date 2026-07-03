import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { BadRequestError, UnauthorizedError } from '../../utils/errors.js';
import type { MediaService } from './media.service.js';
import type { MediaIdParam } from './media.types.js';

export class MediaController {
  constructor(private readonly service: MediaService) {}

  upload = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const file = await req.file();
    if (!file) throw new BadRequestError('No file provided');

    const result = await this.service.upload(req.user.id, {
      stream: file.file,
      filename: file.filename,
    });
    reply.status(HTTP.CREATED).send(result);
  };

  list = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    reply.send({ data: await this.service.list(req.user.id) });
  };

  remove = async (req: FastifyRequest<{ Params: MediaIdParam }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.remove(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };
}
