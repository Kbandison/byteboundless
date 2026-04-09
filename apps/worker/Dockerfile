FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Railway build context is ALWAYS repo root, regardless of root directory setting
COPY apps/worker/package.json ./
RUN npm install

COPY apps/worker/tsconfig.json ./
COPY apps/worker/src/ ./src/
RUN npm run build

CMD ["node", "dist/index.js"]
