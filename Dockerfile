FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --omit=dev

COPY . .
ENV PORT=3000
ENV DATABASE_PATH=/data/betterwrite.sqlite
EXPOSE 3000
CMD ["node", "backend/server.js"]
