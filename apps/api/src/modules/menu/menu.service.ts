import { prisma } from '../../shared/database/prisma';

export class MenuService {
  async getMenusByLocation(locationId: string) {
    const menus = await prisma.menu.findMany({
      where: {
        locationId,
        isActive: true,
      },
      include: {
        categories: {
          where: { isActive: true },
          include: {
            items: {
              where: {
                isActive: true,
                isAvailable: true,
                is86ed: false,
              },
              include: {
                modifierGroups: {
                  include: {
                    modifierGroup: {
                      include: {
                        modifiers: {
                          where: { isAvailable: true },
                          orderBy: { displayOrder: 'asc' },
                        },
                      },
                    },
                  },
                  orderBy: { displayOrder: 'asc' },
                },
              },
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return menus;
  }

  async getMenuItem(itemId: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            menu: true,
          },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isAvailable: true },
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return item;
  }

  async searchMenuItems(locationId: string, query: string) {
    const items = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        is86ed: false,
        category: {
          menu: {
            locationId,
            isActive: true,
          },
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      include: {
        category: true,
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
      take: 20,
    });

    return items;
  }

  async toggle86Item(itemId: string, is86ed: boolean) {
    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: { is86ed },
    });

    return item;
  }

  // Admin functions
  async createMenuItem(data: any) {
    const item = await prisma.menuItem.create({
      data: {
        ...data,
        tags: data.tags || [],
        allergens: data.allergens || [],
      },
    });

    return item;
  }

  async updateMenuItem(itemId: string, data: any) {
    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data,
    });

    return item;
  }

  async deleteMenuItem(itemId: string) {
    await prisma.menuItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  async createModifier(data: any) {
    const modifier = await prisma.modifier.create({
      data,
    });

    return modifier;
  }

  async updateModifier(modifierId: string, data: any) {
    const modifier = await prisma.modifier.update({
      where: { id: modifierId },
      data,
    });

    return modifier;
  }
}

export const menuService = new MenuService();
