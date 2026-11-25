# Build context: repository root (pnpm workspace).
FROM node:26.12.0-slim AS base
RUN npm install -g pnpm@10.33.0
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/cms/package.json apps/cms/
COPY packages/cms-client/package.json packages/cms-client/
COPY sites/influencers/sabrina/package.json sites/influencers/sabrina/
RUN pnpm install --frozen-lockfile --filter "@axs/cms..."

FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/cms-client packages/cms-client
COPY apps/cms apps/cms
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PAYLOAD_SECRET=build-only-placeholder \
    DATABASE_URI=postgres://build:build@localhost:5432/build
RUN pnpm --filter @axs/cms build

FROM node:26.12.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /repo/apps/cms/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/cms/.next/static ./apps/cms/.next/static
RUN mkdir -p /app/apps/cms/media && chown node:node /app/apps/cms/media
USER node
WORKDIR /app/apps/cms
EXPOSE 3001
CMD ["node", "server.js"]
