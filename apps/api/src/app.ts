import Fastify, { type FastifyInstance, type FastifyPluginCallback } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from './config';
import { errorHandler } from './shared/middleware/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { menuRoutes } from './modules/menu/menu.routes';

type OrdersRouteModule = {
  ordersRoutes: FastifyPluginCallback;
};

type PosRouteModule = {
  posRoutes: FastifyPluginCallback;
};

export interface BuildAppOptions {
  customOrderingEnabled?: boolean;
  customPaymentEnabled?: boolean;
  loadOrdersRoutes?: () => Promise<OrdersRouteModule>;
  loadPosRoutes?: () => Promise<PosRouteModule>;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    trustProxy: true,
  });

  await app.register(fastifyHelmet, { contentSecurityPolicy: false });
  await app.register(fastifyCors, { origin: config.FRONTEND_URL, credentials: true });
  await app.register(fastifyCookie, { secret: config.SESSION_SECRET });
  await app.register(fastifyRateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
  });

  app.setErrorHandler(errorHandler);
  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: { database: 'connected', redis: 'connected' },
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(menuRoutes, { prefix: '/api/menu' });

  const customOrderingEnabled =
    options.customOrderingEnabled ?? config.CUSTOM_ORDERING_ENABLED;
  const customPaymentEnabled = options.customPaymentEnabled ?? config.CUSTOM_PAYMENT_ENABLED;

  if (customOrderingEnabled) {
    const loadPosRoutes = options.loadPosRoutes ?? (() => import('./modules/pos/pos.routes'));
    const { posRoutes } = await loadPosRoutes();
    await app.register(posRoutes, { prefix: '/api/pos' });
  }

  if (customOrderingEnabled && customPaymentEnabled) {
    const loadOrdersRoutes =
      options.loadOrdersRoutes ?? (() => import('./modules/orders/orders.routes'));
    const { ordersRoutes } = await loadOrdersRoutes();
    await app.register(ordersRoutes, { prefix: '/api/orders' });
  }

  await app.ready();
  return app;
}
