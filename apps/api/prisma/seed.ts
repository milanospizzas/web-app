import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create location
  const location = await prisma.location.upsert({
    where: { slug: 'main' },
    update: {},
    create: {
      name: "Milano's Pizza - Main Location",
      slug: 'main',
      address1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '(555) 123-4567',
      email: 'main@milanos.pizza',
      timezone: 'America/New_York',
      isActive: true,
      acceptsOrders: true,
      acceptsDelivery: true,
      acceptsPickup: true,
      posSystemType: 'mock',
    },
  });

  console.log('✅ Created location:', location.name);

  // Create menu
  const menu = await prisma.menu.upsert({
    where: { id: location.id + '-main-menu' },
    update: {},
    create: {
      id: location.id + '-main-menu',
      locationId: location.id,
      name: 'Main Menu',
      description: 'Our full menu of delicious pizzas and more',
      isActive: true,
      displayOrder: 1,
    },
  });

  console.log('✅ Created menu:', menu.name);

  // Create categories
  const pizzaCategory = await prisma.menuCategory.create({
    data: {
      menuId: menu.id,
      name: 'Pizzas',
      description: 'Hand-tossed pizzas made with the finest ingredients',
      isActive: true,
      displayOrder: 1,
    },
  });

  const appetizerCategory = await prisma.menuCategory.create({
    data: {
      menuId: menu.id,
      name: 'Appetizers',
      description: 'Start your meal with one of our delicious appetizers',
      isActive: true,
      displayOrder: 2,
    },
  });

  console.log('✅ Created categories');

  // Create modifier groups
  const sizeGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Size',
      description: 'Choose your size',
      minSelection: 1,
      maxSelection: 1,
      isRequired: true,
      displayOrder: 1,
    },
  });

  const toppingsGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Additional Toppings',
      description: 'Add extra toppings',
      minSelection: 0,
      maxSelection: 10,
      isRequired: false,
      displayOrder: 2,
    },
  });

  console.log('✅ Created modifier groups');

  // Create modifiers
  const sizes = await Promise.all([
    prisma.modifier.create({
      data: {
        groupId: sizeGroup.id,
        name: 'Small (10")',
        price: 0,
        displayOrder: 1,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: sizeGroup.id,
        name: 'Medium (12")',
        price: 3,
        displayOrder: 2,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: sizeGroup.id,
        name: 'Large (14")',
        price: 5,
        displayOrder: 3,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: sizeGroup.id,
        name: 'Extra Large (16")',
        price: 7,
        displayOrder: 4,
      },
    }),
  ]);

  const toppings = await Promise.all([
    prisma.modifier.create({
      data: {
        groupId: toppingsGroup.id,
        name: 'Pepperoni',
        price: 2,
        displayOrder: 1,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: toppingsGroup.id,
        name: 'Mushrooms',
        price: 1.5,
        displayOrder: 2,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: toppingsGroup.id,
        name: 'Extra Cheese',
        price: 2,
        displayOrder: 3,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: toppingsGroup.id,
        name: 'Sausage',
        price: 2,
        displayOrder: 4,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: toppingsGroup.id,
        name: 'Black Olives',
        price: 1.5,
        displayOrder: 5,
      },
    }),
  ]);

  console.log('✅ Created modifiers');

  // Create menu items
  const margherita = await prisma.menuItem.create({
    data: {
      categoryId: pizzaCategory.id,
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, basil, and our signature tomato sauce',
      price: 12.99,
      calories: 800,
      isActive: true,
      isAvailable: true,
      displayOrder: 1,
      tags: ['vegetarian', 'classic'],
      allergens: ['dairy', 'gluten'],
    },
  });

  const pepperoni = await prisma.menuItem.create({
    data: {
      categoryId: pizzaCategory.id,
      name: 'Pepperoni Pizza',
      description: 'Classic pepperoni with mozzarella cheese',
      price: 14.99,
      calories: 950,
      isActive: true,
      isAvailable: true,
      displayOrder: 2,
      tags: ['classic', 'popular'],
      allergens: ['dairy', 'gluten'],
    },
  });

  const meatLovers = await prisma.menuItem.create({
    data: {
      categoryId: pizzaCategory.id,
      name: 'Meat Lovers Pizza',
      description: 'Pepperoni, sausage, bacon, and ham',
      price: 16.99,
      calories: 1200,
      isActive: true,
      isAvailable: true,
      displayOrder: 3,
      tags: ['popular'],
      allergens: ['dairy', 'gluten'],
    },
  });

  const garlicBread = await prisma.menuItem.create({
    data: {
      categoryId: appetizerCategory.id,
      name: 'Garlic Bread',
      description: 'Toasted bread with garlic butter and herbs',
      price: 5.99,
      calories: 350,
      isActive: true,
      isAvailable: true,
      displayOrder: 1,
      tags: ['vegetarian'],
      allergens: ['dairy', 'gluten'],
    },
  });

  console.log('✅ Created menu items');

  // Link modifiers to menu items
  await Promise.all([
    prisma.menuItemModifierGroup.create({
      data: {
        menuItemId: margherita.id,
        modifierGroupId: sizeGroup.id,
        displayOrder: 1,
      },
    }),
    prisma.menuItemModifierGroup.create({
      data: {
        menuItemId: margherita.id,
        modifierGroupId: toppingsGroup.id,
        displayOrder: 2,
      },
    }),
    prisma.menuItemModifierGroup.create({
      data: {
        menuItemId: pepperoni.id,
        modifierGroupId: sizeGroup.id,
        displayOrder: 1,
      },
    }),
    prisma.menuItemModifierGroup.create({
      data: {
        menuItemId: pepperoni.id,
        modifierGroupId: toppingsGroup.id,
        displayOrder: 2,
      },
    }),
    prisma.menuItemModifierGroup.create({
      data: {
        menuItemId: meatLovers.id,
        modifierGroupId: sizeGroup.id,
        displayOrder: 1,
      },
    }),
  ]);

  console.log('✅ Linked modifiers to menu items');

  // Create delivery zones
  await Promise.all([
    prisma.deliveryZone.create({
      data: {
        locationId: location.id,
        name: 'Zone 1 - Downtown',
        zipCodes: ['10001', '10002', '10003'],
        deliveryFee: 2.99,
        minimumOrder: 15,
        estimatedTime: 30,
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        locationId: location.id,
        name: 'Zone 2 - Midtown',
        zipCodes: ['10004', '10005', '10006'],
        deliveryFee: 3.99,
        minimumOrder: 20,
        estimatedTime: 40,
        isActive: true,
        displayOrder: 2,
      },
    }),
  ]);

  console.log('✅ Created delivery zones');

  // Create operating hours
  const hours = [
    { day: 0, open: '11:00', close: '22:00' }, // Sunday
    { day: 1, open: '11:00', close: '23:00' }, // Monday
    { day: 2, open: '11:00', close: '23:00' }, // Tuesday
    { day: 3, open: '11:00', close: '23:00' }, // Wednesday
    { day: 4, open: '11:00', close: '23:00' }, // Thursday
    { day: 5, open: '11:00', close: '00:00' }, // Friday
    { day: 6, open: '11:00', close: '00:00' }, // Saturday
  ];

  await Promise.all(
    hours.map((h) =>
      prisma.operatingHours.create({
        data: {
          locationId: location.id,
          dayOfWeek: h.day,
          openTime: h.open,
          closeTime: h.close,
          isClosed: false,
        },
      })
    )
  );

  console.log('✅ Created operating hours');

  // Create FAQs
  await Promise.all([
    prisma.fAQ.create({
      data: {
        category: 'ordering',
        question: 'What are your delivery hours?',
        answer: 'We deliver from 11 AM to 11 PM every day.',
        displayOrder: 1,
        isPublished: true,
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'ordering',
        question: 'Do you offer gluten-free options?',
        answer: 'Yes! We offer gluten-free pizza crusts. Please let us know when ordering.',
        displayOrder: 2,
        isPublished: true,
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'payments',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, debit cards, and online payments.',
        displayOrder: 1,
        isPublished: true,
      },
    }),
  ]);

  console.log('✅ Created FAQs');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
