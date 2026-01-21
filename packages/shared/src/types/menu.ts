export interface Menu {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  imageUrl?: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  calories?: number;
  imageUrl?: string;
  isActive: boolean;
  isAvailable: boolean;
  is86ed: boolean;
  displayOrder: number;
  tags: string[];
  allergens: string[];
  modifierGroups: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  minSelection: number;
  maxSelection?: number;
  isRequired: boolean;
  displayOrder: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  calories?: number;
  isAvailable: boolean;
  displayOrder: number;
}
