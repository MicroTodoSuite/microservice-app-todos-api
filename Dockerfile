FROM node:24-alpine3.22@sha256:191c9f0080fcbbc6547a85dc0ff7988072214a355aabdc1d2ec55a7dae5eea8a AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:fbbdda866ea71aef98c4abece17e3d61fbf820cc2ef3961522caa2478716171a

WORKDIR /app
COPY --from=dependencies --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot server.js routes.js todoController.js ./

USER nonroot:nonroot
EXPOSE 8082
CMD ["server.js"]
