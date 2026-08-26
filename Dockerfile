FROM node:24-alpine3.22@sha256:191c9f0080fcbbc6547a85dc0ff7988072214a355aabdc1d2ec55a7dae5eea8a AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:ffab599740d4aaa66029d02b9e6d3de4f622fefb7410081c5ef69c86430f364d

WORKDIR /app
COPY --from=dependencies --chown=65532:65532 /app/node_modules ./node_modules
COPY --chown=65532:65532 server.js routes.js todoController.js ./

# The distroless nonroot account maps to UID/GID 65532. A numeric image user
# lets Kubernetes verify runAsNonRoot before it starts the container.
USER 65532:65532
EXPOSE 8082
CMD ["server.js"]
