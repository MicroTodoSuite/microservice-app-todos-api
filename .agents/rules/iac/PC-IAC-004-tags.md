# PC-IAC-004 — Tags

**Source**: course rule PC-IAC-004, v1.0. **Status**: Adapted.

## Requirement

**Layer 1, transversal tags.** Every root MUST expose `common_tags` and apply it
through the AWS provider's `default_tags`. It MUST contain at least:

| Key | Value |
| --- | --- |
| `Client` | the client code (MTS-IAC-101) |
| `Project` | the project code |
| `Environment` | the environment code |
| `Owner` | the owning lane: `infrastructure`, `cicd`, or `observability` |
| `CostCenter` | `mts-shared`, `mts-economical`, or `mts-full` |
| `ManagedBy` | `terraform` |
| `Repository` | the repository that owns the resource's state |

**Layer 2, resource tags.** Every taggable resource in a module MUST set `Name`
explicitly to its PC-IAC-003 name, merged with the module's `additional_tags`:

```hcl
tags = merge({ Name = each.value.name }, each.value.additional_tags)
```

Every module that creates resources MUST accept `additional_tags`.

## Project adaptation

- `CostCenter` separates the economical and full profiles in cost reports.
- The AzureRM provider has no `default_tags`; Azure roots merge `common_tags`
  into every resource's `tags` explicitly (MTS-IAC-104).

## Automated check

The naming contract also asserts the seven transversal keys on every planned,
taggable resource, and `Name` equal to the resource's name.
