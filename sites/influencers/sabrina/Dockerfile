# Build context: repository root (pnpm workspace).
FROM node:26.12.0-slim AS base
RUN npm install -g pnpm@10.33.0
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/cms/package.json apps/cms/
COPY packages/cms-client/package.json packages/cms-client/
COPY sites/influencers/sabrina/package.json sites/influencers/sabrina/
RUN pnpm install --frozen-lockfile --filter "@axs/sabrina..."

FROM deps AS builder
# The home page is prerendered at build time, so the CMS must be reachable here.
ARG CMS_URL
ENV CMS_URL=${CMS_URL} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
COPY tsconfig.base.json ./
COPY packages/cms-client packages/cms-client
COPY sites/influencers/sabrina sites/influencers/sabrina
RUN pnpm --filter @axs/sabrina build

FROM node:26.12.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /repo/sites/influencers/sabrina/.next/standalone ./
COPY --from=builder --chown=node:node /repo/sites/influencers/sabrina/.next/static ./sites/influencers/sabrina/.next/static
COPY --from=builder --chown=node:node /repo/sites/influencers/sabrina/public ./sites/influencers/sabrina/public
USER node
WORKDIR /app/sites/influencers/sabrina
EXPOSE 3000
CMD ["node", "server.js"]
