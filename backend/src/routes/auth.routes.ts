import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Public auth endpoints
  fastify.post('/register', authController.register.bind(authController));
  fastify.post('/login', authController.login.bind(authController));
  fastify.post('/refresh', authController.refresh.bind(authController));
  fastify.post('/logout', authController.logout.bind(authController));

  // Protected auth endpoint
  fastify.get(
    '/me',
    { preHandler: [authenticate] },
    authController.getCurrentUser.bind(authController)
  );
}
