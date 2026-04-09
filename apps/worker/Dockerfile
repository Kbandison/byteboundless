FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# Skip browser download — they're already in the base image
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["npm", "run", "start"]
