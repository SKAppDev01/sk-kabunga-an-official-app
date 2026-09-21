import { Role } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { youthController } from '../controllers/youth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';

export async function youthRoutes(fastify: FastifyInstance) {
  // All youth endpoints require authentication
  fastify.addHook('preHandler', authenticate);

  // List youth records
  fastify.get('/', youthController.getYouthList.bind(youthController));

  // Get single youth record
  fastify.get('/:id', youthController.getYouthById.bind(youthController));

  // Create youth record
  fastify.post(
    '/',
    {
      preHandler: [
        requireRoles([
          Role.SUPER_ADMIN,
          Role.SK_CHAIRPERSON,
          Role.SK_SECRETARY,
          Role.SK_OFFICIAL,
          Role.AUTHORIZED_USER,
        ]),
      ],
    },
    youthController.createYouth.bind(youthController)
  );

  // Full update youth record (PUT)
  fastify.put(
    '/:id',
    {
      preHandler: [
        requireRoles([
          Role.SUPER_ADMIN,
          Role.SK_CHAIRPERSON,
          Role.SK_SECRETARY,
          Role.SK_OFFICIAL,
        ]),
      ],
    },
    youthController.updateYouth.bind(youthController)
  );

  // Partial update youth record (PATCH)
  fastify.patch(
    '/:id',
    {
      preHandler: [
        requireRoles([
          Role.SUPER_ADMIN,
          Role.SK_CHAIRPERSON,
          Role.SK_SECRETARY,
          Role.SK_OFFICIAL,
        ]),
      ],
    },
    youthController.patchYouth.bind(youthController)
  );

  // Delete youth record (DELETE - soft delete)
  fastify.delete(
    '/:id',
    {
      preHandler: [
        requireRoles([Role.SUPER_ADMIN, Role.SK_CHAIRPERSON, Role.SK_SECRETARY]),
      ],
    },
    youthController.deleteYouth.bind(youthController)
  );
}
