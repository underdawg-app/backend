import type { FastifyInstance } from 'fastify';
import securityPlugin from './security.js';
import corsPlugin from './cors.js';
import swaggerPlugin from './swagger.js';
import dbPlugin from './db.js';
import authPlugin from './auth.js';
import multipartPlugin from './multipart.js';
import firebasePlugin from './firebase.js';

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  await app.register(securityPlugin);
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(multipartPlugin);
  await app.register(firebasePlugin);
}
