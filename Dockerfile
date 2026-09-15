# Multi-stage build producing a lean image around Next.js's standalone
# server output. Targets Cloud Run: listens on $PORT (defaults to 8080).

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
# node:20-slim doesn't ship the `openssl` CLI, so Prisma can't detect the
# container's actual libssl version and silently guesses — which can
# generate a query engine binary that fails to load at runtime. Installing
# it lets `prisma generate` target the right one.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Needs a syntactically valid DATABASE_URL/DIRECT_URL to generate the client
# and satisfy `next build`'s static analysis — no real DB connection happens
# at build time, this is never used to actually connect.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder-secret-not-used-at-runtime"
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next's output file tracing doesn't reliably pick up Prisma's query engine
# binary — copy the generated client explicitly (Prisma's own documented
# workaround for standalone Docker builds).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
