import { menuItems } from '@/content/menu';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';

export function FeaturedFavorites() {
  const visibleItems = menuItems
    .filter((item) => item.featured && item.available)
    .slice(0, 4);

  return (
    <section className="content-section featured-favorites-section">
      <div className="site-container">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">From the Milano's menu</p>
            <h2>A Taste of Milano's Menu</h2>
          </div>
        </div>
        <div className="featured-favorites-grid">
          {visibleItems.map((item) => (
            <article className="featured-favorite-card" key={item.slug}>
              {item.image && (
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  loading="lazy"
                />
              )}
              <div>
                <h3>{item.name}</h3>
                <p>{item.shortDescription}</p>
                <TrackedOrderLink source={`featured-${item.slug}`} menuItem className="text-link">
                  Order Online <span aria-hidden="true">→</span>
                </TrackedOrderLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
