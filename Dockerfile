FROM node:22-bookworm-slim

WORKDIR /app

ENV NPM_CONFIG_REGISTRY=https://mirror.abrha.net/repository/npm/ \
    NEXT_TELEMETRY_DISABLED=1 \
    BACKEND_URL=http://api:3000 \
    NODE_OPTIONS=--max-old-space-size=1536

RUN npm install -g pnpm@9.15.9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "start"]
