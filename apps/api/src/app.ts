import Fastify, { type FastifyInstance, type FastifyPluginCallback } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from './config';
import { errorHandler } from './shared/middleware/error.middleware';

type AuthRouteModule = {
  authRoutes: FastifyPluginCallback;
};

type MenuRouteModule = {
  menuRoutes: FastifyPluginCallback;
};

type OrdersRouteModule = {
  ordersRoutes: FastifyPluginCallback;
};

type PosRouteModule = {
  posRoutes: FastifyPluginCallback;
};

export interface BuildAppOptions {
  customOrderingEnabled?: boolean;
  customPaymentEnabled?: boolean;
  accountsEnabled?: boolean;
  loadAuthRoutes?: () => Promise<AuthRouteModule>;
  loadMenuRoutes?: () => Promise<MenuRouteModule>;
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

  const customOrderingEnabled =
    options.customOrderingEnabled ?? config.CUSTOM_ORDERING_ENABLED;
  const customPaymentEnabled = options.customPaymentEnabled ?? config.CUSTOM_PAYMENT_ENABLED;
  const accountsEnabled = options.accountsEnabled ?? config.ACCOUNTS_ENABLED;

  if (customOrderingEnabled) {
    const loadMenuRoutes = options.loadMenuRoutes ?? (() => import('./modules/menu/menu.routes'));
    const loadPosRoutes = options.loadPosRoutes ?? (() => import('./modules/pos/pos.routes'));
    const [{ menuRoutes }, { posRoutes }] = await Promise.all([
      loadMenuRoutes(),
      loadPosRoutes(),
    ]);

    await app.register(menuRoutes, { prefix: '/api/menu' });
    await app.register(posRoutes, { prefix: '/api/pos' });
  }

  if (customOrderingEnabled && accountsEnabled) {
    const loadAuthRoutes = options.loadAuthRoutes ?? (() => import('./modules/auth/auth.routes'));
    const { authRoutes } = await loadAuthRoutes();
    await app.register(authRoutes, { prefix: '/api/auth' });
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
