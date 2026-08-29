# Development dependencies and generated Prisma client
FROM node:20-alpine AS development

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @milanos/api db:generate

EXPOSE 3001
CMD ["pnpm", "--filter", "@milanos/api", "dev"]

# Build the dormant API without relying on host-generated artifacts.
FROM development AS builder
RUN pnpm --filter @milanos/shared build
RUN pnpm --filter @milanos/api build

# The API remains default-off for custom ordering/payment through runtime flags.
FROM builder AS production
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
