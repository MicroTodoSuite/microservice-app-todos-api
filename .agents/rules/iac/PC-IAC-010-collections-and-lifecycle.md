# PC-IAC-010 — Collections and Lifecycle

**Source**: course rule PC-IAC-010, v1.0. **Status**: Adopted.

## Requirement

- Multiple instances of a resource MUST use `for_each` over a map or set.
- `count` is allowed only for a single conditional instance
  (`count = var.enabled ? 1 : 0`) or an immutable sequence.
- `lifecycle { prevent_destroy = true }` MUST protect every resource whose loss is
  unrecoverable or causes a serious outage: the state bucket and its KMS key, the
  public DNS zone, ECR repositories holding released images, and Key Vaults.
- `ignore_changes` MUST be limited to attributes changed outside Terraform by
  design — for example a node group's desired size under an autoscaler — and
  each use MUST carry a comment naming that external actor.
- Implicit dependencies MUST be preferred; `depends_on` only for dependencies
  Terraform cannot see, each with a comment.

## Project interaction

A deliberate rebuild (MTS-IAC-107) removes `prevent_destroy` in its own reviewed
pull request, destroys from a saved plan, and restores the protection in the
next one. It is never removed in the same change that destroys.

## Automated check

tflint, plus a contract listing the protected resource types and failing when one
lacks `prevent_destroy`.
