import { AuditAction, AuditLog } from '@prisma/client';
import { prisma } from '../config/database.js';

export class AuditRepository {
  async log(data: {
    userId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    deviceId?: string | null;
    details?: any;
    ipAddress?: string | null;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        deviceId: data.deviceId,
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : undefined,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findRecentLogs(limit = 50) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }
}

export const auditRepository = new AuditRepository();
