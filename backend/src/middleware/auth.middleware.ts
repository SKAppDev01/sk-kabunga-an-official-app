import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token missing or invalid',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    request.userPayload = payload;
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
      },
    });
  }
}
