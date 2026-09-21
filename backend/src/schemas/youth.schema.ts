import { CivilStatus, EducationalBackground, Sex, WorkStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from './common.schema.js';

export const createYouthSchema = z.object({
  voterId: z.string().optional().nullable(),
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  extName: z.string().max(20).optional().nullable(),
  birthDate: z.coerce.date({ invalid_type_error: 'Invalid birth date' }),
  age: z.number().int().min(0).max(120).optional(),
  sex: z.nativeEnum(Sex, { required_error: 'Sex is required' }),
  civilStatus: z.nativeEnum(CivilStatus).optional().default(CivilStatus.SINGLE),
  address: z.string().min(1, 'Address is required'),
  purok: z.string().min(1, 'Purok is required'),
  barangay: z.string().optional().default('Kabunga-an'),
  contactNumber: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  educationalBackground: z
    .nativeEnum(EducationalBackground)
    .optional()
    .default(EducationalBackground.NONE),
  workStatus: z.nativeEnum(WorkStatus).optional().default(WorkStatus.STUDENT),
  isRegisteredVoter: z.boolean().optional().default(false),
  isSkVoter: z.boolean().optional().default(true),
  remarks: z.string().optional().nullable(),
  deviceId: z.string().optional().nullable(),
});

export const updateYouthSchema = createYouthSchema.partial();

export const youthQuerySchema = paginationQuerySchema.extend({
  purok: z.string().optional(),
  sex: z.nativeEnum(Sex).optional(),
  civilStatus: z.nativeEnum(CivilStatus).optional(),
  educationalBackground: z.nativeEnum(EducationalBackground).optional(),
  workStatus: z.nativeEnum(WorkStatus).optional(),
  isRegisteredVoter: z.coerce.boolean().optional(),
  isSkVoter: z.coerce.boolean().optional(),
  minAge: z.coerce.number().int().optional(),
  maxAge: z.coerce.number().int().optional(),
});

export type CreateYouthInput = z.infer<typeof createYouthSchema>;
export type UpdateYouthInput = z.infer<typeof updateYouthSchema>;
export type YouthQueryInput = z.infer<typeof youthQuerySchema>;
