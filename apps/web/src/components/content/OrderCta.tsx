import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';

interface OrderCtaProps {
  source: string;
  title?: string;
  text?: string;
}

export function OrderCta({
  source,
  title = 'Ready to order?',
  text = "Continue to Milano's online ordering storefront for the current menu and availability.",
}: OrderCtaProps) {
  return (
    <section className="order-cta">
      <div className="site-container order-cta-inner">
        <div>
          <p className="eyebrow light">Order from Milano's</p>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <TrackedOrderLink className="button button-cream button-large" source={source}>
          Order Online
        </TrackedOrderLink>
      </div>
    </section>
  );
}
