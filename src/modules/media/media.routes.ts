import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { MediaController } from './media.controller.js';
import { MediaRepository } from './media.repository.js';
import { MediaService } from './media.service.js';
import { mediaIdParamSchema } from './media.validator.js';

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  const controller = new MediaController(new MediaService(new MediaRepository(app.db)));
  const router = typedRouter(app);

  router.post(
    '/media/upload',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['media'],
        summary: 'Upload a media file (multipart/form-data) → Cloudinary',
        consumes: ['multipart/form-data'],
      },
    },
    controller.upload,
  );

  router.get(
    '/media',
    { preHandler: [app.authenticate], schema: { tags: ['media'], summary: "List the caller's uploads" } },
    controller.list,
  );

  router.delete(
    '/media/:id',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['media'], summary: 'Delete an upload (owner only)', params: mediaIdParamSchema },
    },
    controller.remove,
  );
}
