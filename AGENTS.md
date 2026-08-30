## Overview
This Node.js REST API provides authenticated list, create, and delete operations for per-user todo items stored in process memory.
It exposes Prometheus metrics, reports traces to Zipkin, and publishes create/delete events to Redis for `log-message-processor`.

## Stack
- Language/runtime: CommonJS JavaScript on Node.js 8.17.0 with npm 6.13.4, as documented and used by `node:8.17.0-alpine`.
- Framework: Express 4.15.4 (`^4.15.4` in `package.json`, pinned to 4.15.4 in `package-lock.json`).
- Integrations: `express-jwt` 5.3.0, Redis client 2.8.0, `prom-client` 12.0.0, `zipkin` 0.11.2, `zipkin-context-cls` 0.11.0, and Zipkin Express/HTTP packages 0.11.2.

## Commands
- Install/build: `npm install` (the README's documented build step and the Dockerfile's dependency-install command).
- Reproducible CI install: `npm ci` (used by the release workflow).
- Local run: `JWT_SECRET=PRFT TODO_API_PORT=8082 npm start`; the `start` script runs `nodemon server.js`.
- CI container build: `docker build -t $ACR_NAME/${{ env.SERVICE_NAME }}:${{ steps.get-version.outputs.version }} -t $ACR_NAME/${{ env.SERVICE_NAME }}:latest .`.
- Tests: no test files, test framework, or `test` script are present, so this repository defines no test command.

## Structure
- `server.js`: creates the Express app and configures Redis, JWT validation, Prometheus metrics, Zipkin tracing, and the listener.
- `routes.js`: maps `/todos` and `/todos/:taskId` to controller operations.
- `todoController.js`: stores per-user todos in memory and publishes create/delete events to Redis.
- `package.json` / `package-lock.json`: npm scripts plus declared and locked dependencies.
- `.github/workflows/`: semantic-release automation and the Azure Container Apps image build/deployment workflow.
- `Dockerfile`: the current Node 8 Alpine production image definition.

## Conventions
- Source files live at the repository root rather than under `src/`; modules use CommonJS and `'use strict'`.
- Todo state is keyed by `req.user.username`; a new user receives three seeded items, and mutations are explicitly not concurrency-safe.
- `/metrics` is registered before JWT middleware and is public; all `/todos` routes require a JWT bearer token.
- The API has no update route, and only create/delete operations publish Redis messages containing the Zipkin trace ID.
- Open every pull request through `.github/pull_request_template.md` and follow `microservice-app-docs/docs/Pull request and task tracking conventions.md`: one concern per short-lived `<type>/<summary>` branch, a Conventional Commit title with a scope, and every template section filled. Constitution principle 13 makes this binding, not advisory.
- Keep the Spec-Driven Development commit pair intact: `test(<scope>): specify ...` must be committed failing before `feat(<scope>): implement ...`. Never squash the pair; the failing-test commit is the evidence the cycle was followed.
- Track every task. Name in the pull-request body the task IDs it advances, qualified by repository and spec, and update `tasks.md` in that same pull request rather than a follow-up. Mark a task `[X]` only after locating and inspecting its named artifact — never from a summary, a green check, a rendered manifest, or recollection. Annotate partial delivery instead of ticking it; work no register covers either gains a task or records in the PR body why none applies.
- Reconcile, never quietly edit, when a register and reality disagree: a specification that pins a version nobody shipped is a maintainer decision, and `microservice-app-docs/full-platform/plan-reconciliation.md` is the worked example.
- Never merge with `--admin`, force-push to `main`, disable a branch protection rule to land your own work, or approve your own pull request. As an AI agent you may open, describe, and update a pull request; you may never approve one and never author an acceptance or approval artifact — only a named human unlocks a gate.
- Report outcomes faithfully in commits and pull-request bodies: name what is red, say what was skipped, and correct an earlier claim that turns out to be wrong rather than leaving the record wrong.

## Notes for the Kubernetes migration
- The service listens on `TODO_API_PORT` (default `8082`) and serves `/metrics` on the same port.
- Runtime variables are `TODO_API_PORT` (`8082`), `JWT_SECRET` (`foo` fallback), `REDIS_HOST` (`localhost`), `REDIS_PORT` (`6379`), `REDIS_CHANNEL` (`log_channel`), and `ZIPKIN_URL` (`http://127.0.0.1:9411/api/v2/spans`).
- Treat `JWT_SECRET` as a Kubernetes Secret shared with token-issuing components; do not rely on the source fallback.
- External dependencies are Redis pub/sub, the HTTP Zipkin collector, and JWT compatibility with the Auth API; there is no database.
- In-memory todos disappear on restart and diverge across replicas, so persistence and horizontal-scaling behavior require an explicit migration decision.
- The image declares neither `EXPOSE` nor `HEALTHCHECK`, and the app has no health/readiness route; only `/metrics` and authenticated todo routes exist.
- Review the Node 8 base image, root execution, `npm install`, inclusion of dev dependencies, the `npm start`/`nodemon` process chain, and the missing `.dockerignore` before production use.
- The current workflow pushes `latest` and a release tag to ACR, directly updates an existing Azure Container App, and restarts its revision.
- No Container Apps manifest is checked in; inventory its external environment, secrets, ingress, and scaling settings before cutover.
- Kubernetes environment changes must be committed to `microservice-app-gitops` and reconciled by ArgoCD; never deploy directly with `kubectl apply`.
