import { FastifyInstance } from 'fastify';
import { authService } from './auth.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { successResponse, errorResponse } from '../../shared/utils/response';
import {
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  updateProfileSchema,
} from '@milanos/shared';

export async function authRoutes(fastify: FastifyInstance) {
  // Send magic link
  fastify.post('/magic-link', async (request, reply) => {
    try {
      const body = magicLinkRequestSchema.parse(request.body);
      await authService.sendMagicLink(body.email, body.redirectUrl);
      return successResponse(reply, { message: 'Magic link sent to your email' });
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'AUTH_ERROR', 'Failed to send magic link', 500);
    }
  });

  // Verify magic link and create session
  fastify.post('/verify', async (request, reply) => {
    try {
      const body = magicLinkVerifySchema.parse(request.body);
      const result = await authService.verifyMagicLink(
        body.token,
        request.ip,
        request.headers['user-agent']
      );

      // Set session cookie
      reply.setCookie('session_token', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(result.session.expiresAt),
      });

      return successResponse(reply, {
        user: result.user,
        session: result.session,
      });
    } catch (error: any) {
      request.log.error(error);
      return errorResponse(reply, 'AUTH_ERROR', error.message || 'Verification failed', 400);
    }
  });

  // Logout
  fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const token = request.cookies.session_token;
      if (token) {
        await authService.logout(token);
        reply.clearCookie('session_token');
      }
      return successResponse(reply, { message: 'Logged out successfully' });
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'AUTH_ERROR', 'Logout failed', 500);
    }
  });

  // Get current user
  fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const user = await authService.getCurrentUser(request.user!.id);
      return successResponse(reply, user);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'AUTH_ERROR', 'Failed to get user', 500);
    }
  });

  // Update profile
  fastify.patch('/profile', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const body = updateProfileSchema.parse(request.body);
      const user = await authService.updateProfile(request.user!.id, body);
      return successResponse(reply, user);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'AUTH_ERROR', 'Failed to update profile', 500);
    }
  });
}
