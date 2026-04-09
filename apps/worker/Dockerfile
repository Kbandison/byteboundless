FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Cache bust - forces fresh build
ARG CACHEBUST=1

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Context is apps/worker/ — use relative paths
COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["node", "dist/index.js"]
