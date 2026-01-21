import { prisma } from '../../shared/database/prisma';

export class DeliveryService {
  async getDeliveryZoneByZipCode(locationId: string, zipCode: string) {
    const zone = await prisma.deliveryZone.findFirst({
      where: {
        locationId,
        isActive: true,
        zipCodes: {
          has: zipCode,
        },
      },
    });

    return zone;
  }

  async getAllDeliveryZones(locationId: string) {
    const zones = await prisma.deliveryZone.findMany({
      where: {
        locationId,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return zones;
  }

  async createDeliveryZone(data: any) {
    const zone = await prisma.deliveryZone.create({
      data,
    });

    return zone;
  }

  async updateDeliveryZone(zoneId: string, data: any) {
    const zone = await prisma.deliveryZone.update({
      where: { id: zoneId },
      data,
    });

    return zone;
  }

  async getAvailableTimeSlots(locationId: string, date: Date) {
    const slots = await prisma.deliveryCapacitySlot.findMany({
      where: {
        locationId,
        date: new Date(date.toISOString().split('T')[0]),
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return slots.filter((slot) => slot.currentOrders < slot.maxOrders);
  }

  async reserveTimeSlot(slotId: string) {
    const slot = await prisma.deliveryCapacitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot || slot.currentOrders >= slot.maxOrders) {
      throw new Error('Time slot not available');
    }

    await prisma.deliveryCapacitySlot.update({
      where: { id: slotId },
      data: {
        currentOrders: slot.currentOrders + 1,
      },
    });

    return slot;
  }

  async releaseTimeSlot(slotId: string) {
    const slot = await prisma.deliveryCapacitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error('Time slot not found');
    }

    await prisma.deliveryCapacitySlot.update({
      where: { id: slotId },
      data: {
        currentOrders: Math.max(0, slot.currentOrders - 1),
      },
    });

    return slot;
  }
}

export const deliveryService = new DeliveryService();
