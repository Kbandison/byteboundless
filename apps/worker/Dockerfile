FROM node:20-bookworm

WORKDIR /app

# Cache bust: 2024-04-08-v2
# Install Chromium system deps EXPLICITLY before anything else
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxcb1 libxkbcommon0 libx11-6 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2t64 libexpat1 \
    libxshmfence1 fonts-liberation xdg-utils wget \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

# Install browser binary (deps already handled above)
RUN npx playwright install chromium

# Verify libglib is loadable
RUN ldconfig && ldd /root/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | head -5 || echo "LDD CHECK DONE"

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["npm", "run", "start"]
