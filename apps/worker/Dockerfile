FROM mcr.microsoft.com/playwright:v1.55.1-noble

# Cache bust - forces fresh build. Bump this whenever the base
# image version above changes — Railway sometimes caches the
# previous image layer and ships a worker with old browser binaries.
ARG CACHEBUST=3

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Context is apps/worker/ — use relative paths
COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["node", "dist/index.js"]
