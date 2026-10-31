# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

# Install curl for healthcheck & pnpm
RUN apk add --no-cache curl python3 make g++ && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install production and development dependencies
RUN pnpm install --frozen-lockfile

# Copy required application files
COPY circuits/ ./circuits/
COPY contracts/deployed-addresses.json ./contracts/deployed-addresses.json
COPY packages/ ./packages/
COPY scripts/ ./scripts/
COPY server/ ./server/
COPY tsconfig.json ./

# Environment defaults
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/healthz || exit 1

CMD ["pnpm", "run", "server"]

