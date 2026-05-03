# Multi-stage build for Colyseus game server
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy all workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/game-logic/ ./packages/game-logic/
COPY apps/server/ ./apps/server/
COPY apps/client/package.json ./apps/client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build in dependency order
RUN pnpm --filter @board-game/shared build && \
    pnpm --filter @board-game/game-logic build && \
    pnpm --filter @board-game/server build

# Use pnpm deploy to create standalone production bundle
RUN pnpm --filter @board-game/server deploy /app/deploy --prod

# Production image
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the deployed standalone bundle
COPY --from=builder /app/deploy ./

EXPOSE 10000

CMD ["node", "dist/index.js"]
