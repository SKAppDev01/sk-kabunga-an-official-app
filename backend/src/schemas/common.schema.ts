import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
