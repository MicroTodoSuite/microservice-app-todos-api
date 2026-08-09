# Dependency stage. Pinned Node LTS, not the Node 8 EOL image used before.
FROM node:20.18.1-alpine3.20 AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Runtime stage. Same base, only production dependencies and source, no npm cache.
FROM node:20.18.1-alpine3.20 AS runtime

RUN apk add --no-cache curl \
    && addgroup -g 10001 todos-api \
    && adduser -D -u 10001 -G todos-api todos-api

WORKDIR /app

COPY --from=deps --chown=todos-api:todos-api /app/node_modules ./node_modules
COPY --chown=todos-api:todos-api . .

USER 10001:10001

# Documents the default; the app still reads the real value from TODO_API_PORT at runtime.
EXPOSE 8082

# /metrics is the only route that doesn't require a JWT bearer token.
# Shell form is required here for ${TODO_API_PORT} expansion and the `|| exit 1` fallback.
# hadolint ignore=DL3025
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f "http://localhost:${TODO_API_PORT:-8082}/metrics" || exit 1

CMD ["node", "server.js"]
