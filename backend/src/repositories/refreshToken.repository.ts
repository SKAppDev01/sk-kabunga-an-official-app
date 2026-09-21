import { Prisma, RefreshToken } from '@prisma/client';
import { prisma } from '../config/database.js';

export type RefreshTokenWithUser = Prisma.RefreshTokenGetPayload<{
  include: { user: true };
}>;

export class RefreshTokenRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    deviceId?: string | null;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
        deviceId: data.deviceId,
      },
    });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revoke(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
