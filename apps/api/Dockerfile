FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN npm ci --ignore-scripts

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN npx turbo build --filter=@agentspark/api

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built output and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/packages/shared/dist ./node_modules/@agentspark/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@agentspark/shared/package.json

EXPOSE 4000

CMD ["node", "dist/index.js"]
