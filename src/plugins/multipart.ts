import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';

// Multipart parsing for the media upload endpoint. The file is streamed
// straight to Cloudinary, so we keep a generous per-file size cap for video.
export default fp(async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
      files: 1,
    },
  });
});
