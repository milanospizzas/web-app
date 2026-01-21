/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@milanos/shared'],
  images: {
    domains: ['localhost', 'milanos.pizza'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_SHIFT4_I4GO_URL:
      process.env.NEXT_PUBLIC_SHIFT4_I4GO_URL || 'https://i4go-sandbox.shift4.com/checkout',
  },
};

module.exports = nextConfig;
