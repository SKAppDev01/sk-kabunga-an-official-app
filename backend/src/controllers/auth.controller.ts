import { FastifyReply, FastifyRequest } from 'fastify';
import { loginSchema, refreshTokenSchema, registerSchema } from '../schemas/auth.schema.js';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = registerSchema.parse(request.body);
    const ipAddress = request.ip;
    const user = await authService.register(body, ipAddress);

    return reply.status(201).send({
      success: true,
      data: user,
      message: 'Account created successfully',
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    const ipAddress = request.ip;
    const result = await authService.login(body, ipAddress);

    return reply.status(200).send({
      success: true,
      data: result,
      message: 'Login successful',
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const body = refreshTokenSchema.parse(request.body);
    const ipAddress = request.ip;
    const tokens = await authService.refreshTokens(body.refreshToken, ipAddress);

    return reply.status(200).send({
      success: true,
      data: tokens,
      message: 'Token refreshed successfully',
    });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const body = refreshTokenSchema.parse(request.body);
    const userId = request.userPayload?.userId;
    const ipAddress = request.ip;

    await authService.logout(body.refreshToken, userId, ipAddress);

    return reply.status(200).send({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.userPayload?.userId;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' },
      });
    }

    const profile = await authService.getUserProfile(userId);

    return reply.status(200).send({
      success: true,
      data: profile,
    });
  }
}

export const authController = new AuthController();
