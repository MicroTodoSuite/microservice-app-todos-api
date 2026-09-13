# PC-IAC-023 — Single-Responsibility Modules

**Source**: course rule PC-IAC-023, v1.0. **Status**: Adapted.

## Requirement

A reference module MUST create only the resources intrinsic to one service. It
MUST NOT create IAM roles or policies, security groups, VPCs, subnets, route
tables, or load balancers. Role ARNs and network and security-group IDs MUST
arrive as inputs.

## Project adaptation

The project builds on upstream registry modules such as
`terraform-aws-modules/eks/aws`, which create IAM roles and security groups by
default. A project module wrapping one MUST disable that creation
(`create_iam_role = false`, `create_node_security_group = false`, and their
equivalents) and pass in what the security root created. Where an upstream module
cannot be configured that way, the wrapper records an exception naming the
resource.

`environment-foundation`, which today creates networking, IAM, ECR, secrets, and
DNS together, is decomposed under this rule.

## Automated check

A contract fails on a forbidden resource type inside a module directory.
