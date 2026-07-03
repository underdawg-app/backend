import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { isProd } from '../config/env.js';

export default fp(async (app) => {
  if (isProd) return;

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Underdwag API',
        description: 'Backend API documentation',
        version: '0.1.0',
      },
      servers: [{ url: '/' }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
});
