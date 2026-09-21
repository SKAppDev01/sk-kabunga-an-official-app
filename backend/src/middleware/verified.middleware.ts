import { FastifyReply, FastifyRequest } from 'fastify';
import { userRepository } from '../repositories/user.repository.js';

/**
 * Requires the authenticated account to still exist, be active, and be verified.
 * This performs a database check so revocation/verification changes take effect
 * immediately instead of waiting for an access token to expire.
 */
export async function requireVerifiedUser(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.userPayload?.userId;

  if (!userId) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  const user = await userRepository.findById(userId);

  if (!user || !user.isActive) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'ACCOUNT_DISABLED',
        message: 'Account is unavailable or disabled',
      },
    });
  }

  if (!user.isVerified) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_VERIFIED',
        message: 'Account verification is required for this resource',
      },
    });
  }
}
