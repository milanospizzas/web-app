interface RestaurantInteriorProps {
  className?: string;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}

export function RestaurantInterior({
  className,
  loading = 'lazy',
  sizes = '(min-width: 760px) 46vw, 92vw',
}: RestaurantInteriorProps) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/images/location/milanos-davie-interior-960.avif 960w, /images/location/milanos-davie-interior-1600.avif 1600w"
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet="/images/location/milanos-davie-interior-960.webp 960w, /images/location/milanos-davie-interior-1600.webp 1600w"
        sizes={sizes}
      />
      <img
        src="/images/location/milanos-davie-interior-960.webp"
        width="960"
        height="720"
        loading={loading}
        alt="Dining room and service counter inside Milano's Pizzas in Davie"
        className={className}
      />
    </picture>
  );
}
