import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  username: string;
  email?: string | null;
  role: Role;
  deviceId?: string | null;
  type: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    userPayload?: JwtPayload;
  }
}
