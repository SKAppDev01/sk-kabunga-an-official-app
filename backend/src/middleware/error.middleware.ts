import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(error: FastifyError | any, request: FastifyRequest, reply: FastifyReply) {
  logger.error(`[ErrorHandler] Path: ${request.url} - Error:`, error);

  // Zod Validation Error
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters or payload',
        details: formattedErrors,
      },
    });
  }

  // Custom Application Error with statusCode
  if (error.statusCode && error.code) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message || 'An error occurred',
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  // Fastify standard errors (e.g. 404, rate limit)
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code || 'BAD_REQUEST',
        message: error.message,
      },
    });
  }

  // Internal Server Error (500) - Never expose details in production!
  const isProd = env.NODE_ENV === 'production';
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProd ? 'An unexpected server error occurred' : error.message || 'Internal Server Error',
    },
  });
}
