/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  transpilePackages: ['@milanos/shared'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
