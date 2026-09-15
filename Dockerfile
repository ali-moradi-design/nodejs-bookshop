# Bookstore API — single-stage Node image
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src
# Build needs typescript; install temporarily
RUN npm install --no-save typescript tsc-alias && npm run build && npm prune --omit=dev

COPY .env.example ./.env.example

RUN mkdir -p uploads/books

EXPOSE 4000

CMD ["node", "dist/server.js"]
