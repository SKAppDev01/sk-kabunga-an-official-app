import { Role } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export function requireRoles(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userPayload = request.userPayload;

    if (!userPayload) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!allowedRoles.includes(userPayload.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
    }
  };
}
