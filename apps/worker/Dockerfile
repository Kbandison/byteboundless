FROM node:20-slim

WORKDIR /app

# Install all system deps needed by Playwright Chromium
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    libglib2.0-0 libnspr4 libdbus-1-3 libexpat1 \
    libx11-6 libx11-xcb1 libxcb1 libxcb-dri3-0 libxext6 libxfixes3 \
    libgtk-3-0 libharfbuzz-icu0 libenchant-2-2 libsecret-1-0 \
    libhyphen0 libflite1 libgles2 libwoff1 libvpx-dev libopus0 \
    libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 \
    gstreamer1.0-libav libmanette-0.2-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install
COPY package.json ./
RUN npm install

# Install ALL Playwright browsers + deps (chromium + headless shell)
RUN npx playwright install --with-deps

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["npm", "run", "start"]
