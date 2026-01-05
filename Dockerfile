# Multi-stage Dockerfile for Next.js 14 (production, standalone)

FROM node:20-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# Install OS deps sometimes needed for sharp/canvas/pdfkit etc
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libc6 \
    libstdc++6 \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
# Only copy package manifests to leverage Docker layer cache
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --omit=dev; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile --production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --prod --frozen-lockfile; \
  else npm ci --omit=dev; fi

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js in production mode
RUN npm run build

FROM base AS runner
ENV NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

# Use standalone output to minimize runtime image
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]





