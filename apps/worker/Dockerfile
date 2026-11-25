FROM node:22-bookworm-slim

ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/integrations/package.json packages/integrations/package.json
COPY packages/video-engine/package.json packages/video-engine/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts --include=dev
COPY apps/worker apps/worker
COPY packages/video-engine packages/video-engine
COPY packages/shared packages/shared
COPY packages/integrations packages/integrations
RUN npm run build --workspace=@content-factory/shared && npm run build --workspace=@content-factory/integrations \
  && npm run build --workspace=@content-factory/video-engine && npm run build --workspace=@content-factory/worker \
  && chown -R node:node /app
USER node
CMD ["node", "apps/worker/dist/index.js"]
