FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Railway runs Docker from the root directory setting (apps/worker)
# but sometimes uses repo root as context. Handle both:
COPY apps/worker/package.json* package.json* ./
RUN ls package.json && npm install || true

COPY apps/worker/tsconfig.json* tsconfig.json* ./
COPY apps/worker/src/ src/
RUN npm run build

CMD ["npm", "run", "start"]
