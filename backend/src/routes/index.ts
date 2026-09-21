import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { healthRoutes } from './health.routes.js';
import { youthRoutes } from './youth.routes.js';

export async function appRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(youthRoutes, { prefix: '/api/youth' });
}
