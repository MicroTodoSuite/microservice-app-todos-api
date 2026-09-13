# PC-IAC-024 — Traceability of Complex Configuration

**Source**: course rule PC-IAC-024, v1.0. **Status**: Adopted.

## Requirement

Configuration that varies by environment MUST originate in that environment's
`.tfvars`, never as a literal in `locals.tf`:

1. declared in `variables.tf`, with `default = {}` or `[]` when optional;
2. valued in `<environment>.tfvars`;
3. enriched in `locals.tf` with dynamic IDs and ARNs (PC-IAC-009);
4. consumed in `main.tf` from the local (PC-IAC-021).

Pure computations and constants intrinsic to a module MAY live in `locals.tf`.

## Automated check

Reviewed through the iac-review skill; a `locals` map literal with more than one
environment-sized value is flagged.
