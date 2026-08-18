#!/usr/bin/env bash
# Unit gate entrypoint (spec 006 / T010) consumed by the reusable CI `unit` job.
# Installs from the committed lockfile and runs Jest with coverage; jest.config.js
# enforces the 70% business-logic threshold (server.js bootstrap excluded, D2).
set -euo pipefail
npm ci
npx jest --coverage
