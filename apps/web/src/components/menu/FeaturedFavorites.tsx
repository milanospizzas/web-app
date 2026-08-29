import { menuItems } from '@/content/menu';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';

export function FeaturedFavorites() {
  const production = process.env.SITE_ENV === 'production';
  const photoApprovedItems = menuItems.filter((item) => item.featured && item.available && item.image);
  const visibleItems = production ? photoApprovedItems.slice(0, 8) : menuItems.slice(0, 4);

  // A production favorites grid needs at least four real, item-specific approved photos.
  if (production && visibleItems.length < 4) return null;

  return (
    <section className="content-section featured-favorites-section">
      <div className="site-container">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">From the Milano's menu</p>
            <h2>Popular Milano's Favorites</h2>
          </div>
          <p>
            Featured dish photography is item-specific. Neutral placeholders appear only in the
            non-indexed staging build until real Milano's photos are approved.
          </p>
        </div>
        <div className="featured-favorites-grid">
          {visibleItems.map((item) => (
            <article className="featured-favorite-card" key={item.slug}>
              {item.image ? (
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  loading="lazy"
                />
              ) : (
                <div className="dish-photo-placeholder" aria-hidden="true">
                  <span>Milano's</span>
                </div>
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
