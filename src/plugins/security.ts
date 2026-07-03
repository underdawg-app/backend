import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';

export default fp(async (app) => {
  await app.register(helmet, { global: true });
  await app.register(sensible);
});
