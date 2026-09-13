# PC-IAC-026 — The `sample/` Pattern

**Source**: course rule PC-IAC-026, v1.0. **Status**: Adopted.

## Requirement

Every reference module's `sample/` directory MUST be a runnable example with
exactly these responsibilities:

| File | Contains | Must not contain |
| --- | --- | --- |
| `terraform.tfvars` | Example configuration, with empty values (`""`, `[]`) where IDs are looked up | Hard-coded resource IDs or ARNs, secrets |
| `variables.tf` | Types and descriptions | Logic |
| `data.tf` | Lookups by standard name | Logic |
| `locals.tf` | Name construction and ID injection | Resources, module calls |
| `main.tf` | One `module` block with `source = "../"`, fed from `local.*` | `locals`, resources |
| `outputs.tf` | Outputs that prove the example works | |
| `providers.tf` | The `principal` provider | A backend; examples use local state |
| `README.md` | How to run it | |

## Automated check

The structure contract (PC-IAC-001) checks the files; a contract fails when
`sample/main.tf` contains a `locals` block or a resource.
