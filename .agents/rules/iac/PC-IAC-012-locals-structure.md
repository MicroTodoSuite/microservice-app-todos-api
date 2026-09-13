# PC-IAC-012 — Structure of Locals

**Source**: course rule PC-IAC-012, v1.0. **Status**: Adopted.

## Requirement

- Each `locals.tf` MUST contain exactly one `locals` block.
- Local names MUST be `snake_case`, ordered from the most basic values to the
  final configuration structures.
- A root MUST define `governance_prefix = "${var.client}-${var.project}-${var.environment}"`
  and derive every name from it (PC-IAC-025).
- Every transformed configuration MUST be a new, descriptively named local
  (`var.services` becomes `local.services_with_defaults`).
- Nested lists MUST be flattened with `flatten()` in `locals.tf` before they feed
  `for_each`.

## Automated check

A contract counts `locals` blocks per file.
