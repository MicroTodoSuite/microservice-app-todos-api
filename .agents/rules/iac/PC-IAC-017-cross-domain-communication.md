# PC-IAC-017 — Communication Between Domains

**Source**: course rule PC-IAC-017, v1.0. **Status**: Adopted.

## Requirement

- Domains (PC-IAC-022) MUST exchange information through data sources in the
  consuming root, filtered by the standard name built from the governance
  variables:

```hcl
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["${local.governance_prefix}-vpc-main"]
  }
}
```

- `terraform_remote_state` is an exception governed by PC-IAC-019.
- Collections MUST be extracted with splat expressions (PC-IAC-014) and injected
  into modules as granular IDs and ARNs.

## Automated check

A contract lists every `terraform_remote_state` block and requires an exception
entry for each.
