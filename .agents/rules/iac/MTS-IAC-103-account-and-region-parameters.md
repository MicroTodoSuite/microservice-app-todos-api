# MTS-IAC-103 — Account and Region Parameters

**Status**: Project rule, recorded 2026-09-11.

## Requirement

- The AWS account ID is **configuration, not a secret**, and MUST be declared once
  per concern:

| Consumer | Declaration |
| --- | --- |
| Terraform in `microservice-app-ops` | `config/aws-account.env`, supplied to every root as `var.aws_account_id` |
| GitOps manifests in `microservice-app-gitops` | `config/aws-account.env`, propagated by `scripts/set-aws-account.sh` |
| GitHub Actions in every repository | Organization variable `AWS_ACCOUNT_ID` |

- No other file may carry an account ID as a literal. `tests/contract/aws-account-parameter.sh`
  enforces it in each repository, with every remaining exception listed with
  the exact account it permits and its reason.
- Roots MUST bind the provider to it with `allowed_account_ids`
  (PC-IAC-005) and derive ARNs from it rather than typing them.
- The region is an **environment** parameter: each environment's `.tfvars`
  declares `region`, and nothing else in the root types a region.
- Moving to another account is `scripts/set-aws-account.sh <id>` in each
  repository plus one update of the organization variable. Retired accounts stay
  listed and cannot be reused silently.

## Automated check

The two account contracts in each repository and the CI account contract in each
service repository.
