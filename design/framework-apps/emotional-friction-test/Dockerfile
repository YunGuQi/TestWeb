FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV production
ENV PORT 80
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy env files so they are available at runtime
COPY --from=builder --chown=nextjs:nodejs /app/.env* ./
# Copy prisma files and the sqlite db
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Copy static JSON configs
COPY --from=builder --chown=nextjs:nodejs /app/src/config ./src/config
EXPOSE 80
CMD ["node", "server.js"]
