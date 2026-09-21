import { FastifyReply, FastifyRequest } from 'fastify';
import { uuidParamSchema } from '../schemas/common.schema.js';
import { createYouthSchema, updateYouthSchema, youthQuerySchema } from '../schemas/youth.schema.js';
import { youthService } from '../services/youth.service.js';

export class YouthController {
  async getYouthList(request: FastifyRequest, reply: FastifyReply) {
    const query = youthQuerySchema.parse(request.query);
    const result = await youthService.getYouthList(query);

    return reply.status(200).send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getYouthById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = uuidParamSchema.parse(request.params);
    const youth = await youthService.getYouthById(id);

    return reply.status(200).send({
      success: true,
      data: youth,
    });
  }

  async createYouth(request: FastifyRequest, reply: FastifyReply) {
    const body = createYouthSchema.parse(request.body);
    const userId = request.userPayload?.userId;
    const ipAddress = request.ip;

    const record = await youthService.createYouth(body, userId, ipAddress);

    return reply.status(201).send({
      success: true,
      data: record,
      message: 'Youth record created successfully',
    });
  }

  async updateYouth(request: FastifyRequest, reply: FastifyReply) {
    const { id } = uuidParamSchema.parse(request.params);
    const body = createYouthSchema.parse(request.body); // Full update for PUT
    const userId = request.userPayload?.userId;
    const ipAddress = request.ip;

    const record = await youthService.updateYouth(id, body, userId, ipAddress);

    return reply.status(200).send({
      success: true,
      data: record,
      message: 'Youth record updated successfully',
    });
  }

  async patchYouth(request: FastifyRequest, reply: FastifyReply) {
    const { id } = uuidParamSchema.parse(request.params);
    const body = updateYouthSchema.parse(request.body); // Partial update for PATCH
    const userId = request.userPayload?.userId;
    const ipAddress = request.ip;

    const record = await youthService.updateYouth(id, body, userId, ipAddress);

    return reply.status(200).send({
      success: true,
      data: record,
      message: 'Youth record updated successfully',
    });
  }

  async deleteYouth(request: FastifyRequest, reply: FastifyReply) {
    const { id } = uuidParamSchema.parse(request.params);
    const userId = request.userPayload?.userId;
    const ipAddress = request.ip;

    const record = await youthService.deleteYouth(id, userId, ipAddress);

    return reply.status(200).send({
      success: true,
      data: { id: record.id, deletedAt: record.deletedAt },
      message: 'Youth record deleted successfully',
    });
  }
}

export const youthController = new YouthController();
