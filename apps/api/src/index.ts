import { config } from './config';
import { logger } from './shared/utils/logger';
import { connectDatabase, disconnectDatabase } from './shared/database/prisma';
import { buildApp } from './app';

let fastify: Awaited<ReturnType<typeof buildApp>> | undefined;

async function start() {
  try {
    await connectDatabase();
    fastify = await buildApp();

    await fastify.listen({
      host: config.HOST,
      port: config.PORT,
    });

    logger.info(`Server listening on http://${config.HOST}:${config.PORT}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down gracefully...');
  if (fastify) {
    await fastify.close();
  }
  await disconnectDatabase();
  process.exit(0);
}

function handleShutdown() {
  void shutdown().catch((error: unknown) => {
    logger.error(error);
    process.exit(1);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

void start();
