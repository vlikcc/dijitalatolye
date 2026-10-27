FROM node:24.21.0-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV COREPACK_HOME=/pnpm/corepack
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
FROM base AS dependencies
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
FROM dependencies AS build
ARG GAME_BASE_DOMAIN=games.localhost
ENV GAME_BASE_DOMAIN=$GAME_BASE_DOMAIN
COPY src ./src
COPY public ./public
COPY next.config.ts next-env.d.ts tsconfig.json postcss.config.mjs ./
COPY scripts/prepare-standalone.mjs ./scripts/prepare-standalone.mjs
RUN pnpm build
FROM base AS worker
RUN apt-get update && apt-get install -y --no-install-recommends yara ca-certificates fontconfig && rm -rf /var/lib/apt/lists/*
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json tsconfig.json vitest.config.ts vitest.integration.config.ts ./
COPY --chown=node:node assets ./assets
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node deploy/security.yar ./deploy/security.yar
COPY --chown=node:node tests ./tests
COPY --chown=node:node fixtures ./fixtures
RUN mkdir -p /data/quarantine /data/ready /data/published /data/work /data/thumbnails /data/curriculum-sources /data/cover-inputs && chown -R node:node /data
ENV DATA_DIR=/data
USER node
CMD ["pnpm","worker"]
FROM node:24.21.0-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATA_DIR=/data
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
RUN mkdir -p /data/quarantine /data/ready /data/published /data/work /data/thumbnails /data/curriculum-sources /data/cover-inputs && chown -R node:node /data
USER node
EXPOSE 3000
CMD ["node","server.js"]
