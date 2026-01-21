import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './shared/utils/logger';
import { connectDatabase, disconnectDatabase } from './shared/database/prisma';
import { errorHandler } from './shared/middleware/error.middleware';

// Import routes
import { authRoutes } from './modules/auth/auth.routes';
import { menuRoutes } from './modules/menu/menu.routes';
import { ordersRoutes } from './modules/orders/orders.routes';

const fastify = Fastify({
  logger: logger,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  trustProxy: true,
});

async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Register plugins
    await fastify.register(fastifyHelmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(fastifyCors, {
      origin: config.FRONTEND_URL,
      credentials: true,
    });

    await fastify.register(fastifyCookie, {
      secret: config.SESSION_SECRET,
    });

    await fastify.register(fastifyRateLimit, {
      max: config.RATE_LIMIT_MAX,
      timeWindow: config.RATE_LIMIT_WINDOW_MS,
    });

    // Error handler
    fastify.setErrorHandler(errorHandler);

    // Health check
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: 'connected',
          redis: 'connected',
        },
      };
    });

    // API routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(menuRoutes, { prefix: '/api/menu' });
    await fastify.register(ordersRoutes, { prefix: '/api/orders' });

    // Start server
    await fastify.listen({
      host: config.HOST,
      port: config.PORT,
    });

    logger.info(`🚀 Server listening on http://${config.HOST}:${config.PORT}`);
    logger.info(`📊 Environment: ${config.NODE_ENV}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  await fastify.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
