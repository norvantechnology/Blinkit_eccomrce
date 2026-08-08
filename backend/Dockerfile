# ── Stage 1: install deps + generate Prisma client ──────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema=src/database/prisma/schema.prisma

# ── Stage 2: production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache openssl wget \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 blinkit

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY src ./src
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && chown -R blinkit:nodejs /app

USER blinkit

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
