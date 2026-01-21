import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl md:text-6xl font-bold text-balance">
              Authentic Italian Pizza Delivered to Your Door
            </h1>
            <p className="mb-8 text-xl text-primary-100">
              Made with love, fresh ingredients, and family recipes passed down through generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/menu">
                <Button size="lg" variant="secondary" className="text-primary-700">
                  Order Now
                </Button>
              </Link>
              <Link href="/menu">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-center mb-12 text-3xl md:text-4xl font-bold">Why Choose Milano's?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="text-center">
                <div className="mb-4 text-4xl">🍕</div>
                <CardTitle className="mb-2">Fresh Ingredients</CardTitle>
                <CardDescription>
                  We use only the finest, freshest ingredients sourced daily from local suppliers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center">
                <div className="mb-4 text-4xl">⚡</div>
                <CardTitle className="mb-2">Fast Delivery</CardTitle>
                <CardDescription>
                  Hot, fresh pizza delivered to your door in 30 minutes or less, guaranteed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center">
                <div className="mb-4 text-4xl">❤️</div>
                <CardTitle className="mb-2">Family Recipes</CardTitle>
                <CardDescription>
                  Traditional Italian recipes passed down through three generations of pizza makers.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Items */}
      <section className="py-20 bg-neutral-50">
        <div className="container">
          <h2 className="text-center mb-12 text-3xl md:text-4xl font-bold">Popular Pizzas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Margherita',
                description: 'Fresh mozzarella, basil, and tomato sauce',
                price: '$12.99',
              },
              {
                name: 'Pepperoni',
                description: 'Classic pepperoni with mozzarella cheese',
                price: '$14.99',
              },
              {
                name: 'Meat Lovers',
                description: 'Pepperoni, sausage, bacon, and ham',
                price: '$16.99',
              },
            ].map((pizza) => (
              <Card key={pizza.name} hover>
                <CardContent>
                  <div className="aspect-square bg-neutral-200 rounded-lg mb-4" />
                  <CardTitle className="mb-2">{pizza.name}</CardTitle>
                  <CardDescription className="mb-4">{pizza.description}</CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-700">{pizza.price}</span>
                    <Link href="/menu">
                      <Button size="sm">Order Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-700 text-white">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">Ready to Order?</h2>
          <p className="mb-8 text-xl text-primary-100">
            Get your favorite pizza delivered in 30 minutes or less.
          </p>
          <Link href="/menu">
            <Button size="lg" variant="secondary" className="text-primary-700">
              Order Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
