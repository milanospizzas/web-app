interface BrandLogoProps {
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function BrandLogo({ className, loading = 'lazy' }: BrandLogoProps) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/images/brand/milanos-semicircle-logo-160.avif 160w, /images/brand/milanos-semicircle-logo-320.avif 320w"
        sizes="90px"
      />
      <source
        type="image/webp"
        srcSet="/images/brand/milanos-semicircle-logo-160.webp 160w, /images/brand/milanos-semicircle-logo-320.webp 320w"
        sizes="90px"
      />
      <img
        src="/images/brand/milanos-semicircle-logo-160.webp"
        width="160"
        height="95"
        loading={loading}
        alt="Milano's Pizzas logo"
        className={className}
      />
    </picture>
  );
}
