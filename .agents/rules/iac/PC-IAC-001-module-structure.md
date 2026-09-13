# PC-IAC-001 — Module Structure

**Source**: course rule PC-IAC-001, v1.0. **Status**: Adapted.

## Requirement

A reference module MUST be a directory inside its provider's module repository
(MTS-IAC-102), and MUST contain:

| File | Purpose |
| --- | --- |
| `README.md` | Purpose, inputs, outputs, requirements, and an example call |
| `CHANGELOG.md` | Keep a Changelog format, maintained by the release tooling |
| `versions.tf` | `required_version` and `required_providers` (PC-IAC-006) |
| `providers.tf` | Consumer alias declarations only; never provider configuration (PC-IAC-005) |
| `variables.tf` | Every input (PC-IAC-002) |
| `locals.tf` | One `locals` block (PC-IAC-012) |
| `data.tf` | Only the data sources PC-IAC-011 allows in modules |
| `main.tf` | The module's resources |
| `outputs.tf` | Every output (PC-IAC-007) |
| `.gitignore` | Terraform state, plans, `.terraform/`, and `*.tfvars` except `sample/terraform.tfvars` |
| `sample/` | The executable example defined by PC-IAC-026 |
| `tests/` | `terraform test` files (PC-IAC-018) |

Each file MUST contain at least a descriptive comment, even when empty of code.
A module MUST NOT spread its resources across additional top-level `.tf` files;
a module large enough to need that is two modules (PC-IAC-023).

## Project adaptation

- The course places each module in its own repository. The maintainer decided on
  one repository per provider (MTS-IAC-102); the layout above applies to each
  module directory inside it.
- PC-IAC-018 names `examples/`; this rule and PC-IAC-026 name `sample/`. The
  project uses `sample/` only.

## Automated check

A structure contract in the module repository's CI fails when a module directory
lacks any required file or `sample/` file.

## Agent procedure

When creating a module, an agent copies the repository's module template rather
than writing the layout from memory, then fills every file.
