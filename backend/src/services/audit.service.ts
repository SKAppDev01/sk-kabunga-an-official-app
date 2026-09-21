import { AuditAction } from '@prisma/client';
import { auditRepository } from '../repositories/audit.repository.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  async record(data: {
    userId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    deviceId?: string | null;
    details?: any;
    ipAddress?: string | null;
  }) {
    try {
      await auditRepository.log(data);
    } catch (error) {
      logger.error('Failed to record audit log:', error);
      // Non-blocking failure for audit logging
    }
  }
}

export const auditService = new AuditService();
