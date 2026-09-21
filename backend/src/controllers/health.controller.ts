import { FastifyReply, FastifyRequest } from 'fastify';
import { checkDatabaseConnection } from '../config/database.js';

export class HealthController {
  async getHealth(request: FastifyRequest, reply: FastifyReply) {
    const isDbConnected = await checkDatabaseConnection();

    const responseStatus = isDbConnected ? 'ok' : 'degraded';
    const dbStatus = isDbConnected ? 'connected' : 'disconnected';
    const statusCode = isDbConnected ? 200 : 503;

    return reply.status(statusCode).send({
      status: responseStatus,
      service: 'SK Kabunga-an Backend',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

export const healthController = new HealthController();
