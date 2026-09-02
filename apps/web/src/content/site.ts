export const site = {
  name: "Milano's Pizzas",
  shortName: "Milano's",
  url: 'https://www.milanospizzas.com',
  description:
    "Explore Milano's Pizzas in Davie, Florida, browse the menu, and start an online order.",
  address: {
    street: '7613 Davie Road Extension',
    city: 'Davie',
    region: 'FL',
    postalCode: '33024',
    country: 'US',
  },
  phoneDisplay: '(954) 404-9143',
  phoneHref: 'tel:+19544049143',
  email: 'davie@milanospizzas.com',
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=Milano%27s%20Pizzas%207613%20Davie%20Road%20Extension%20Davie%20FL%2033024',
  mapEmbedUrl:
    'https://www.google.com/maps?q=7613+Davie+Road+Extension+Davie+FL+33024&output=embed',
  hours: [
    {
      days: 'Sunday–Thursday',
      hours: '11:00 AM–9:00 PM',
      schemaDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '11:00',
      closes: '21:00',
    },
    {
      days: 'Friday–Saturday',
      hours: '11:00 AM–10:00 PM',
      schemaDays: ['Friday', 'Saturday'],
      opens: '11:00',
      closes: '22:00',
    },
  ],
  social: {
    instagram: 'https://www.instagram.com/MilanosPizzas/',
    facebook: 'https://www.facebook.com/EatMilanosPizzas/',
    x: 'https://twitter.com/MilanosPizzas',
  },
} as const;

export function absoluteUrl(path = '/') {
  return new URL(path, site.url).toString();
}
