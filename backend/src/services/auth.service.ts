import { AuditAction, Role } from '@prisma/client';
import crypto from 'crypto';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { auditService } from './audit.service.js';

export class AuthService {
  async register(input: RegisterInput, ipAddress?: string) {
    const existingUsername = await userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw { statusCode: 409, code: 'USERNAME_EXISTS', message: 'Username is already taken' };
    }

    if (input.email) {
      const existingEmail = await userRepository.findByEmail(input.email);
      if (existingEmail) {
        throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'Email address is already registered' };
      }
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      // Public registration can never self-assign an elevated role.
      role: Role.AUTHORIZED_USER,
      deviceId: input.deviceId,
    });

    await auditService.record({
      userId: newUser.id,
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: newUser.id,
      deviceId: input.deviceId,
      details: { username: newUser.username, role: newUser.role },
      ipAddress,
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(input: LoginInput, ipAddress?: string) {
    const user = await userRepository.findByUsernameOrEmail(input.usernameOrEmail);
    if (!user) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_DISABLED', message: 'Account has been deactivated' };
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password' };
    }

    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      deviceId: input.deviceId,
    };

    const familyId = crypto.randomUUID();
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt,
      deviceId: input.deviceId,
    });

    await userRepository.updateLastLogin(user.id);

    await auditService.record({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      deviceId: input.deviceId,
      ipAddress,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string, ipAddress?: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw { statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' };
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await refreshTokenRepository.findByHash(tokenHash);

    if (!storedToken) {
      throw { statusCode: 401, code: 'REFRESH_TOKEN_NOT_FOUND', message: 'Refresh token not recognized' };
    }

    if (!storedToken.user || !storedToken.user.isActive || storedToken.user.deletedAt) {
      throw { statusCode: 403, code: 'ACCOUNT_DISABLED', message: 'Account has been deactivated or disabled' };
    }

    if (storedToken.isRevoked) {
      // Security protection: token reuse detected! Revoke whole family!
      await refreshTokenRepository.revokeFamily(storedToken.familyId);
      throw {
        statusCode: 401,
        code: 'TOKEN_REUSE_DETECTED',
        message: 'Security warning: Refresh token reuse detected. All sessions in this family have been revoked.',
      };
    }

    if (new Date() > storedToken.expiresAt) {
      await refreshTokenRepository.revoke(storedToken.id);
      throw { statusCode: 401, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token has expired' };
    }

    // Revoke old token
    await refreshTokenRepository.revoke(storedToken.id);

    // Issue new tokens maintaining token family
    const tokenPayload = {
      userId: storedToken.user.id,
      username: storedToken.user.username,
      email: storedToken.user.email,
      role: storedToken.user.role,
      deviceId: storedToken.deviceId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await refreshTokenRepository.create({
      userId: storedToken.user.id,
      tokenHash: newRefreshTokenHash,
      familyId: storedToken.familyId,
      expiresAt,
      deviceId: storedToken.deviceId,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, userId?: string, ipAddress?: string) {
    try {
      const tokenHash = hashToken(refreshToken);
      const storedToken = await refreshTokenRepository.findByHash(tokenHash);

      if (storedToken) {
        await refreshTokenRepository.revoke(storedToken.id);
      }
    } catch {
      // Ignore token parsing errors during logout
    }

    if (userId) {
      await auditService.record({
        userId,
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: userId,
        ipAddress,
      });
    }
  }

  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
