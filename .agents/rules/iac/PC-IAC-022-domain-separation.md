# PC-IAC-022 — Separation by Domain

**Source**: course rule PC-IAC-022, v1.0. **Status**: Adapted.

## Requirement

Each environment is split into roots by domain, applied in this order, each with
its own state:

1. **networking** — VPC, subnets, route tables, internet and NAT gateways,
   Elastic IPs, VPC endpoints, transit gateway attachments, flow logs.
2. **security** — security groups, network ACLs, IAM roles and policies
   (including IRSA roles), KMS keys, WAF.
3. **workload** — EKS clusters and node capacity, application buckets, load
   balancers, log groups, and application records.

A root MUST NOT create a resource belonging to another domain. It reads what it
needs through data sources (PC-IAC-017).

## Project adaptation

The course's table covers ECS, Lambda, and RDS. The project adds:

| Resource | Domain | Root |
| --- | --- | --- |
| State bucket and its KMS key | account | `shd/state` |
| GitHub OIDC provider, deploy role, image publisher and verifier roles | account security | `shd/security` |
| ECR repositories | account registry | `shd/registry` |
| Public Route 53 zone | account networking | `shd/dns` |
| EKS cluster and node groups | workload | `<env>/workload` |
| IRSA roles | security | `<env>/security`, reading the cluster's OIDC issuer |
| Karpenter interruption queue | workload | `<env>/workload` |

An IRSA role needs the cluster's OIDC issuer, which exists only after the
workload root. The order therefore becomes networking, security (cluster and node
roles), workload, then a second security pass for IRSA roles, recorded as one
exception per environment.

The contracts read a root's domain from its directory name: `networking`,
`security`, or `workload` under an environment, and `state`, `registry`, `dns`,
`security`, or `networking` under `shd`, where the egress hub is
`shd/networking`. A root with any other name is reported as not split by domain.
Secrets Manager containers belong to the security domain.

## Automated check

A contract maps resource types to domains and fails on a root that creates a type
outside its domain.
