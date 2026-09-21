import { Prisma, YouthRecord } from '@prisma/client';
import { prisma } from '../config/database.js';
import { YouthQueryInput } from '../schemas/youth.schema.js';

export class YouthRepository {
  async findById(id: string, includeDeleted = false): Promise<YouthRecord | null> {
    return prisma.youthRecord.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findByVoterId(voterId: string): Promise<YouthRecord | null> {
    return prisma.youthRecord.findFirst({
      where: { voterId, deletedAt: null },
    });
  }

  async findAll(query: YouthQueryInput) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      purok,
      sex,
      civilStatus,
      educationalBackground,
      workStatus,
      isRegisteredVoter,
      isSkVoter,
      minAge,
      maxAge,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.YouthRecordWhereInput = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(purok ? { purok: { equals: purok, mode: 'insensitive' } } : {}),
      ...(sex ? { sex } : {}),
      ...(civilStatus ? { civilStatus } : {}),
      ...(educationalBackground ? { educationalBackground } : {}),
      ...(workStatus ? { workStatus } : {}),
      ...(isRegisteredVoter !== undefined ? { isRegisteredVoter } : {}),
      ...(isSkVoter !== undefined ? { isSkVoter } : {}),
      ...(minAge !== undefined || maxAge !== undefined
        ? {
            age: {
              ...(minAge !== undefined ? { gte: minAge } : {}),
              ...(maxAge !== undefined ? { lte: maxAge } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
              { purok: { contains: search, mode: 'insensitive' } },
              { voterId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const validSortFields = ['createdAt', 'updatedAt', 'lastName', 'firstName', 'age', 'purok'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      prisma.youthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
      }),
      prisma.youthRecord.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: Prisma.YouthRecordCreateInput): Promise<YouthRecord> {
    return prisma.youthRecord.create({ data });
  }

  async update(id: string, data: Prisma.YouthRecordUpdateInput): Promise<YouthRecord> {
    return prisma.youthRecord.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string, updatedBy?: string): Promise<YouthRecord> {
    return prisma.youthRecord.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
        version: { increment: 1 },
      },
    });
  }
}

export const youthRepository = new YouthRepository();
