import { Prisma, User } from '@prisma/client';
import { prisma } from '../config/database.js';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { username, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async softDelete(id: string, updatedBy?: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy,
      },
    });
  }
}

export const userRepository = new UserRepository();
