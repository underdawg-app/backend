import fp from 'fastify-plugin';
import { db, closeDb, type DB } from '../db/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: DB;
  }
}

export default fp(async (app) => {
  app.decorate('db', db);

  app.addHook('onClose', async () => {
    await closeDb();
  });
});
