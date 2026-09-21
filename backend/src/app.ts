import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { appRoutes } from './routes/index.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
    bodyLimit: 1048576, // 1MB limit for safety against large payloads
  });

  // Security headers
  app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  // CORS configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Rate limiting for auth & API protection
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Cookie support
  app.register(cookie);

  // Custom Error Handler
  app.setErrorHandler(errorHandler);

  // Register API Routes
  app.register(appRoutes);

  // 404 Not Found Handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  return app;
}
