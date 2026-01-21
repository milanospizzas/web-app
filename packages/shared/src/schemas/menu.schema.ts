import { z } from 'zod';

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative(),
  calories: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  sku: z.string().optional(),
  prepTime: z.number().int().positive().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createModifierSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  calories: z.number().int().nonnegative().optional(),
  isAvailable: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const updateModifierSchema = createModifierSchema.partial();

export const createModifierGroupSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  minSelection: z.number().int().nonnegative().default(0),
  maxSelection: z.number().int().positive().optional(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export const updateModifierGroupSchema = createModifierGroupSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateModifierInput = z.infer<typeof createModifierSchema>;
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;
export type CreateModifierGroupInput = z.infer<typeof createModifierGroupSchema>;
export type UpdateModifierGroupInput = z.infer<typeof updateModifierGroupSchema>;
