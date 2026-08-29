import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RestaurantJsonLd />
      <Header />
      <main id="main-content" className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
