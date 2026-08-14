# Orun OS — WhatsApp Baileys gateway
# Self-contained image (does not need the monorepo). Persists the WhatsApp
# session in /data/auth_state (volume), so the QR is scanned only once.

FROM node:22-bookworm-slim

# libsignal is installed from a git URL — git is required by npm install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY tsconfig.json ./

ENV AUTH_DIR=/data/auth_state

CMD ["node", "--experimental-strip-types", "src/index.ts"]
