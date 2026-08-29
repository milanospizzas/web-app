interface BrandLogoProps {
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function BrandLogo({ className, loading = 'lazy' }: BrandLogoProps) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/images/brand/milanos-logo-160.avif 160w, /images/brand/milanos-logo-320.avif 320w"
      />
      <source
        type="image/webp"
        srcSet="/images/brand/milanos-logo-160.webp 160w, /images/brand/milanos-logo-320.webp 320w"
      />
      <img
        src="/images/brand/milanos-logo-160.webp"
        width="160"
        height="122"
        loading={loading}
        alt="Milano's Pizzas logo"
        className={className}
      />
    </picture>
  );
}
