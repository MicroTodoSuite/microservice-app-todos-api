# MTS-IAC-106 — GitHub Actions as Infrastructure

**Status**: Project rule, recorded 2026-09-11.

## Requirement

- Every action MUST be pinned by full commit SHA, with the version in a comment.
- Workflows MUST declare least-privilege `permissions`, defaulting to
  `contents: read`.
- Cloud access MUST use OIDC federation to a role scoped to the exact repository
  and branch; static cloud keys are forbidden.
- Non-secret configuration — account ID, region, project keys — comes from
  organization or repository variables; secrets from GitHub secrets.
- Shared logic lives in reusable workflows in `MicroTodoSuite/.github`, which
  callers pin by SHA.
