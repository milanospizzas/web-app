import Image from 'next/image';
import Link from 'next/link';
import {
  menuCategoryNotes,
  type MenuCategory,
  type MenuItem,
  type MenuPageDefinition,
} from '@/content/menu';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function menuCategoryAnchor(category: MenuCategory) {
  return `menu-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <article className={`menu-item${item.image ? ' menu-item-with-image' : ''}`} id={item.slug}>
      {item.image && (
        <figure className="menu-item-photo">
          <Image
            src={item.image.src}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            sizes="(min-width: 760px) 560px, calc(100vw - 2rem)"
          />
          {item.image.generated && <figcaption>AI-generated illustration. Presentation may vary.</figcaption>}
        </figure>
      )}
      <div className="menu-item-copy">
        <div className="menu-item-heading">
          <h3>{item.name}</h3>
          {item.displayedPrice !== null && (
            <span className="menu-item-price">{currency.format(item.displayedPrice)}</span>
          )}
        </div>
        {item.fullDescription && item.fullDescription !== item.name && (
          <p className="menu-item-description">{item.fullDescription}</p>
        )}
        {!!item.priceOptions?.length && (
          <dl className="menu-price-options" aria-label={`${item.name} sizes and prices`}>
            {item.priceOptions.map((option) => (
              <div key={option.label}>
                <dt>{option.label}</dt>
                <dd>{currency.format(option.price)}</dd>
              </div>
            ))}
          </dl>
        )}
        {!!item.optionGroups?.length && (
          <div className="menu-option-groups">
            {item.optionGroups.map((group) => (
              <div key={group.label}>
                <p className="menu-option-label">{group.label}</p>
                <ul>
                  {group.choices.map((choice) => (
                    <li key={choice.label}>
                      <span>{choice.label}</span>
                      {choice.price !== undefined && <span>{currency.format(choice.price)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {!!item.notes?.length && (
          <ul className="menu-item-notes">
            {item.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        )}
      </div>
    </article>
  );
}

export function MenuCatalog({
  items,
  categories,
  pageLinks,
}: {
  items: MenuItem[];
  categories: MenuCategory[];
  pageLinks?: MenuPageDefinition[];
}) {
  return (
    <div className="menu-catalog">
      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category && item.available);
        if (!categoryItems.length) return null;
        const anchor = menuCategoryAnchor(category);
        const categoryPage = pageLinks?.find((page) => page.categories.includes(category));

        return (
          <section className="menu-category" key={category} id={anchor} aria-labelledby={`${anchor}-heading`}>
            <div className="menu-category-heading">
              <div>
                <p className="eyebrow">Milano&apos;s Pizzas</p>
                <h2 id={`${anchor}-heading`}>{category}</h2>
              </div>
              {categoryPage && (
                <Link className="text-link" href={`/menu/${categoryPage.slug}`}>
                  View {category.toLowerCase()} <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
            {!!menuCategoryNotes[category]?.length && (
              <div className="menu-category-notes">
                {menuCategoryNotes[category]?.map((note) => <p key={note}>{note}</p>)}
              </div>
            )}
            <div className="menu-item-grid">
              {categoryItems.map((item) => <MenuItemCard key={item.slug} item={item} />)}
            </div>
            {pageLinks && <a className="menu-back-link" href="#menu-navigation">Back to categories ↑</a>}
          </section>
        );
      })}
    </div>
  );
}

export function MenuPrintNote() {
  return (
    <p className="menu-print-note">
      Prices and options are from our take-out menu. Check online ordering for current prices and availability.
    </p>
  );
}
