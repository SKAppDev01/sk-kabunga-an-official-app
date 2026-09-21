import { AuditAction } from '@prisma/client';
import { youthRepository } from '../repositories/youth.repository.js';
import { CreateYouthInput, UpdateYouthInput, YouthQueryInput } from '../schemas/youth.schema.js';
import { auditService } from './audit.service.js';

export class YouthService {
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  }

  async getYouthList(query: YouthQueryInput) {
    return youthRepository.findAll(query);
  }

  async getYouthById(id: string, includeDeleted = false) {
    const record = await youthRepository.findById(id, includeDeleted);
    if (!record) {
      throw { statusCode: 404, code: 'YOUTH_RECORD_NOT_FOUND', message: 'Youth record not found' };
    }
    return record;
  }

  async createYouth(input: CreateYouthInput, userId?: string, ipAddress?: string) {
    if (input.voterId) {
      const existing = await youthRepository.findByVoterId(input.voterId);
      if (existing) {
        throw { statusCode: 409, code: 'VOTER_ID_EXISTS', message: 'Voter ID is already registered' };
      }
    }

    const calculatedAge = input.age ?? this.calculateAge(new Date(input.birthDate));

    const newRecord = await youthRepository.create({
      voterId: input.voterId,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      extName: input.extName,
      birthDate: new Date(input.birthDate),
      age: calculatedAge,
      sex: input.sex,
      civilStatus: input.civilStatus,
      address: input.address,
      purok: input.purok,
      barangay: input.barangay,
      contactNumber: input.contactNumber,
      email: input.email,
      educationalBackground: input.educationalBackground,
      workStatus: input.workStatus,
      isRegisteredVoter: input.isRegisteredVoter,
      isSkVoter: input.isSkVoter,
      remarks: input.remarks,
      deviceId: input.deviceId,
      createdBy: userId,
      updatedBy: userId,
    });

    await auditService.record({
      userId,
      action: AuditAction.CREATE,
      entityType: 'YouthRecord',
      entityId: newRecord.id,
      deviceId: input.deviceId,
      details: { firstName: newRecord.firstName, lastName: newRecord.lastName, purok: newRecord.purok },
      ipAddress,
    });

    return newRecord;
  }

  async updateYouth(id: string, input: UpdateYouthInput, userId?: string, ipAddress?: string) {
    const existing = await youthRepository.findById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'YOUTH_RECORD_NOT_FOUND', message: 'Youth record not found' };
    }

    if (input.voterId && input.voterId !== existing.voterId) {
      const voterIdConflict = await youthRepository.findByVoterId(input.voterId);
      if (voterIdConflict) {
        throw { statusCode: 409, code: 'VOTER_ID_EXISTS', message: 'Voter ID is already registered' };
      }
    }

    let calculatedAge = input.age;
    if (!calculatedAge && input.birthDate) {
      calculatedAge = this.calculateAge(new Date(input.birthDate));
    }

    const updatedRecord = await youthRepository.update(id, {
      ...(input.voterId !== undefined ? { voterId: input.voterId } : {}),
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.middleName !== undefined ? { middleName: input.middleName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.extName !== undefined ? { extName: input.extName } : {}),
      ...(input.birthDate ? { birthDate: new Date(input.birthDate) } : {}),
      ...(calculatedAge !== undefined ? { age: calculatedAge } : {}),
      ...(input.sex ? { sex: input.sex } : {}),
      ...(input.civilStatus ? { civilStatus: input.civilStatus } : {}),
      ...(input.address ? { address: input.address } : {}),
      ...(input.purok ? { purok: input.purok } : {}),
      ...(input.barangay ? { barangay: input.barangay } : {}),
      ...(input.contactNumber !== undefined ? { contactNumber: input.contactNumber } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.educationalBackground ? { educationalBackground: input.educationalBackground } : {}),
      ...(input.workStatus ? { workStatus: input.workStatus } : {}),
      ...(input.isRegisteredVoter !== undefined ? { isRegisteredVoter: input.isRegisteredVoter } : {}),
      ...(input.isSkVoter !== undefined ? { isSkVoter: input.isSkVoter } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.deviceId !== undefined ? { deviceId: input.deviceId } : {}),
      updatedBy: userId,
    });

    await auditService.record({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'YouthRecord',
      entityId: updatedRecord.id,
      deviceId: input.deviceId || existing.deviceId,
      details: { changes: input },
      ipAddress,
    });

    return updatedRecord;
  }

  async deleteYouth(id: string, userId?: string, ipAddress?: string) {
    const existing = await youthRepository.findById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'YOUTH_RECORD_NOT_FOUND', message: 'Youth record not found' };
    }

    const deletedRecord = await youthRepository.softDelete(id, userId);

    await auditService.record({
      userId,
      action: AuditAction.DELETE,
      entityType: 'YouthRecord',
      entityId: id,
      deviceId: existing.deviceId,
      details: { softDeleted: true },
      ipAddress,
    });

    return deletedRecord;
  }
}

export const youthService = new YouthService();
