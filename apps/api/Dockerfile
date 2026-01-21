# Development Dockerfile for API
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev", "--workspace=@milanos/api"]

# Production Dockerfile
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies
RUN npm ci --only=production

# Copy built files
COPY --from=development /app/apps/api/dist ./apps/api/dist
COPY --from=development /app/packages/shared/dist ./packages/shared/dist
COPY --from=development /app/apps/api/prisma ./apps/api/prisma

# Generate Prisma client
RUN cd apps/api && npx prisma generate

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
