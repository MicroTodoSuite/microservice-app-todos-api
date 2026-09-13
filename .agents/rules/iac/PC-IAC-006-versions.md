# PC-IAC-006 — Versions

**Source**: course rule PC-IAC-006, v1.0. **Status**: Adapted.

## Requirement

- Roots and modules MUST declare `required_version` with `>=`.
- Roots MUST pin providers to a patch-compatible range (`~> 6.58.0`) or exactly
  (`= 6.58.0`), and MUST commit `.terraform.lock.hcl`.
- Modules MUST declare a minimum provider version (`>= 6.0.0`) compatible with
  every root that consumes them, and MUST NOT commit a lock file.
- Modules MUST NOT configure a backend.
- The Terraform version used by humans and CI MUST come from one file,
  `.terraform-version`, in each repository.

## Project adaptation

The course shows the root backend inside `versions.tf` with literal values;
PC-IAC-008 requires partial configuration, which wins. Exact pins are allowed in
roots because they are stricter than the course requires.

## Automated check

A contract compares every workflow's Terraform version with `.terraform-version`,
and fails on a module lock file or a module backend.
