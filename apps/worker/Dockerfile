FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Start the worker
CMD ["npm", "run", "start"]
