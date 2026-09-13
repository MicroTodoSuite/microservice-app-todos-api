# PC-IAC-018 — Testing and Validation

**Source**: course rule PC-IAC-018, v1.0. **Status**: Adapted.

## Requirement

**Modules** MUST include `tests/` with `terraform test` files covering their
validations and main behaviour, and a runnable `sample/` (PC-IAC-026). A module
repository's `main` MUST pass every module's tests.

**Every pull request** touching Terraform MUST run, and fail on error:

- `terraform fmt -check`, `terraform validate`
- tflint with the provider ruleset
- a security scanner — Trivy (`trivy config`) — failing on any HIGH or CRITICAL finding
- `terraform test` for every changed module
- the structure, naming, tag, provider, and module-source contracts these rules
  define

**Every apply** MUST come from a saved `terraform plan` published as an
artifact and reviewed first. An apply to `fprd` MUST have explicit, recorded
manual approval of that exact plan (MTS-IAC-107).

## Project adaptation

The course's `examples/` directory is satisfied by `sample/`.

The course names Checkov as the scanner; the project uses Trivy. Trivy is
already pinned in the organization's image pipeline, and it assigns a severity
to every Terraform misconfiguration, so "fail on high and critical" is one flag.
Checkov's open-source edition reports severities only with a Prisma Cloud API
key, so the same threshold cannot be expressed with it alone.

Terraform 1.15 rejects `terraform validate` on a module that declares
`configuration_aliases`. A module is therefore validated by `terraform test`,
which evaluates it in the context its tests provide, and its `sample/` is
validated as a root. A finding in a
live environment's existing code that the scanner raises during adoption is
recorded as an exception with an expiry, not suppressed silently.

## Automated check

The reusable workflow `MicroTodoSuite/.github/.github/workflows/iac-checks.yml`
runs every check above on each pull request of a Terraform repository, and its
self-test proves each contract by mutation. `scripts/iac/contracts.py plan`
checks a saved plan's names, tags, and domain before it is applied.

## Agent procedure

An agent runs the checks locally before opening a pull request and quotes their
output; a check it cannot run locally is named as not run.
