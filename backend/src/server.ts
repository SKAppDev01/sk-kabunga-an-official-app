import { buildApp } from './app.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = buildApp();

async function startServer() {
  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`🚀 SK Kabunga-an Official Backend running at ${address}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful Shutdown
const closeGracefully = async (signal: string) => {
  logger.info(`Received signal ${signal}. Shutting down gracefully...`);
  try {
    await app.close();
    await prisma.$disconnect();
    logger.info('Server closed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

startServer();
