# PC-IAC-002 — Variables

**Source**: course rule PC-IAC-002, v1.0. **Status**: Adapted.

## Requirement

- Every variable MUST declare `type` and `description`.
- Every variable of type string, number, list, set, map, object, or tuple MUST
  declare at least one `validation` block: not empty, a format, a range, or a
  consistency check between fields.
- A `default` MAY be declared only for values that do not identify or size
  infrastructure. Identifiers, CIDRs, and sizes MUST have no default.
- Every root and every module MUST accept the governance variables:

| Variable | Validation |
| --- | --- |
| `client` | `can(regex("^[a-z0-9]{2,10}$", var.client))` |
| `project` | `can(regex("^[a-z0-9]{2,15}$", var.project))` |
| `environment` | `contains(["shd", "eco", "fdev", "fstg", "fprd"], var.environment)` |

- A collection that drives `for_each` MUST be `map(object({...}))`, never
  `list(object)`, so keys stay stable (PC-IAC-010).
- Optional object attributes MUST use `optional(type, default)`.
- A variable carrying a secret MUST set `sensitive = true` (PC-IAC-016).
- A `.tfvars` file MUST NOT contain a secret.

## Project adaptation

- A `bool` variable needs no validation block; its type is already its whole
  domain.
- The environment codes replace the course's `dev`, `qa`, `pdn`; they are
  defined in MTS-IAC-101.

## Automated check

tflint with `terraform_documented_variables` and `terraform_typed_variables`,
plus a contract that fails on a non-boolean variable without `validation`.
