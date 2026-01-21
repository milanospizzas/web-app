import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../database/prisma';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.session_token;

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Invalid session token',
        },
      });
    }

    if (new Date(session.expiresAt) < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Session expired',
        },
      });
    }

    if (!session.user.isActive) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Account is inactive',
        },
      });
    }

    // Update last active time
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    request.user = {
      id: session.user.id,
      email: session.user.email,
      isAdmin: session.user.isAdmin,
    };
  } catch (error) {
    request.log.error(error, 'Auth middleware error');
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.isAdmin) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Admin access required',
      },
    });
  }
}
