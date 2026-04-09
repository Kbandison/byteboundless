FROM node:20-slim

WORKDIR /app

# Install system deps needed by Playwright Chromium
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install
COPY package.json ./
RUN npm install

# Install the exact Playwright browsers matching the npm package
RUN npx playwright install chromium --with-deps

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["npm", "run", "start"]
