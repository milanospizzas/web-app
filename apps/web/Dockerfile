# Development image
FROM node:20-alpine AS development

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@milanos/web", "dev"]

# Static export builder
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
ARG SITE_ENV=staging
ARG ORDER_PROVIDER=skytab
ARG ORDER_MODE=redirect
ARG SKYTAB_ORDER_URL=
ARG SKYTAB_IFRAME_ENABLED=false
ARG CUSTOM_ORDERING_ENABLED=false
ARG CUSTOM_PAYMENT_ENABLED=false
ARG ANALYTICS_ENABLED=false
ENV SITE_ENV=$SITE_ENV \
    ORDER_PROVIDER=$ORDER_PROVIDER \
    ORDER_MODE=$ORDER_MODE \
    SKYTAB_ORDER_URL=$SKYTAB_ORDER_URL \
    SKYTAB_IFRAME_ENABLED=$SKYTAB_IFRAME_ENABLED \
    CUSTOM_ORDERING_ENABLED=$CUSTOM_ORDERING_ENABLED \
    CUSTOM_PAYMENT_ENABLED=$CUSTOM_PAYMENT_ENABLED \
    ANALYTICS_ENABLED=$ANALYTICS_ENABLED
RUN pnpm --filter @milanos/shared build
RUN pnpm --filter @milanos/web build

# Static production server. Next output:'export' writes apps/web/out.
FROM nginx:1.27-alpine AS production

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/out /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
