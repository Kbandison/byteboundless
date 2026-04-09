FROM node:20-bookworm

WORKDIR /app

COPY package.json ./
RUN npm install

# Let Playwright install browsers AND all system deps automatically
RUN npx playwright install --with-deps chromium

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

CMD ["npm", "run", "start"]
