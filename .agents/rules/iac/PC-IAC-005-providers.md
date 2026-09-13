# PC-IAC-005 — Providers and Aliases

**Source**: course rule PC-IAC-005, v1.0. **Status**: Adapted.

## Requirement

**Roots** MUST configure one principal provider:

```hcl
provider "aws" {
  alias               = "principal"
  region              = var.region
  allowed_account_ids = [var.aws_account_id]

  assume_role {
    role_arn = var.deploy_role_arn
  }

  default_tags {
    tags = var.common_tags
  }
}
```

**Modules** MUST declare the consumer alias `aws.project` through
`configuration_aliases` in `versions.tf`, and every resource MUST set
`provider = aws.project`. A root passes it as
`providers = { aws.project = aws.principal }`.

## Project adaptation

- `allowed_account_ids` binds the provider to the declared account
  (MTS-IAC-103).
- A module that must act in a second region or account declares a second alias,
  documented in its README.
- When a module wraps an upstream registry module, it passes
  `providers = { aws = aws.project }` to it.
- Azure uses `azurerm.principal` in roots and `azurerm.project` in modules
  (MTS-IAC-104).
- Providers without credentials or regions, such as `random` and `tls`, need no
  alias.

## Automated check

A contract fails on a module resource without `provider = aws.project`, on a
module containing a `provider` block, and on a root provider without the alias,
`assume_role`, or `default_tags`.
