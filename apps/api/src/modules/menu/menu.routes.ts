import { FastifyInstance } from 'fastify';
import { menuService } from './menu.service';
import { adminMiddleware, authMiddleware } from '../../shared/middleware/auth.middleware';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { createMenuItemSchema, updateMenuItemSchema } from '@milanos/shared';

export async function menuRoutes(fastify: FastifyInstance) {
  // Get menus for a location
  fastify.get('/locations/:locationId/menus', async (request, reply) => {
    try {
      const { locationId } = request.params as { locationId: string };
      const menus = await menuService.getMenusByLocation(locationId);
      return successResponse(reply, menus);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'MENU_ERROR', 'Failed to fetch menus', 500);
    }
  });

  // Get menu item details
  fastify.get('/items/:itemId', async (request, reply) => {
    try {
      const { itemId } = request.params as { itemId: string };
      const item = await menuService.getMenuItem(itemId);

      if (!item) {
        return errorResponse(reply, 'RESOURCE_NOT_FOUND', 'Menu item not found', 404);
      }

      return successResponse(reply, item);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'MENU_ERROR', 'Failed to fetch menu item', 500);
    }
  });

  // Search menu items
  fastify.get('/locations/:locationId/search', async (request, reply) => {
    try {
      const { locationId } = request.params as { locationId: string };
      const { q } = request.query as { q: string };

      if (!q || q.length < 2) {
        return errorResponse(reply, 'VALIDATION_ERROR', 'Search query too short', 400);
      }

      const items = await menuService.searchMenuItems(locationId, q);
      return successResponse(reply, items);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'MENU_ERROR', 'Search failed', 500);
    }
  });

  // Admin: Create menu item
  fastify.post(
    '/items',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const body = createMenuItemSchema.parse(request.body);
        const item = await menuService.createMenuItem(body);
        return successResponse(reply, item, 201);
      } catch (error) {
        request.log.error(error);
        return errorResponse(reply, 'MENU_ERROR', 'Failed to create menu item', 500);
      }
    }
  );

  // Admin: Update menu item
  fastify.patch(
    '/items/:itemId',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const { itemId } = request.params as { itemId: string };
        const body = updateMenuItemSchema.parse(request.body);
        const item = await menuService.updateMenuItem(itemId, body);
        return successResponse(reply, item);
      } catch (error) {
        request.log.error(error);
        return errorResponse(reply, 'MENU_ERROR', 'Failed to update menu item', 500);
      }
    }
  );

  // Admin: Toggle 86 status
  fastify.patch(
    '/items/:itemId/86',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const { itemId } = request.params as { itemId: string };
        const { is86ed } = request.body as { is86ed: boolean };
        const item = await menuService.toggle86Item(itemId, is86ed);
        return successResponse(reply, item);
      } catch (error) {
        request.log.error(error);
        return errorResponse(reply, 'MENU_ERROR', 'Failed to toggle 86 status', 500);
      }
    }
  );
}
