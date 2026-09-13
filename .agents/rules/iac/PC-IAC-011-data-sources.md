# PC-IAC-011 — Data Sources

**Source**: course rule PC-IAC-011, v1.0. **Status**: Adapted.

## Requirement

- Data sources that look up infrastructure MUST be declared only in roots. Their
  results reach modules through input variables.
- Every lookup MUST filter explicitly — by ID, ARN, or the standard `Name` tag
  (PC-IAC-017) — never by an ambiguous search.
- A lookup returning a list MUST be narrowed with `one()`, never indexed with
  `[0]`.

## Project adaptation

The course allows "generic data sources such as the current region" in modules
without listing them. The closed list allowed in modules is:
`aws_region`, `aws_partition`, `aws_caller_identity`,
`aws_iam_policy_document`, `azurerm_client_config`, and `azurerm_subscription`.
`aws_iam_policy_document` is included because it only renders JSON; it looks
nothing up.

## Automated check

A contract fails on any other `data` block inside a module directory.
