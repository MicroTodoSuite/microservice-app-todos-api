# PC-IAC-025 — Governance Processing in the Root

**Source**: course rule PC-IAC-025, v1.0. **Status**: Adopted.

## Requirement

- The root MUST build every final physical name in its `locals.tf` and inject it
  into the module's configuration payload.
- A module MUST NOT assemble names from `client`, `project`, and `environment`.
  It MAY append an internal suffix to a received name
  (`"${each.value.name}-replica"`) when it creates companion resources, and the
  result still counts against the length limit.
- Governance variables are still passed to modules, for tags.

## Automated check

A contract fails on a module that interpolates `var.client`, `var.project`, or
`var.environment` into a `name`.
