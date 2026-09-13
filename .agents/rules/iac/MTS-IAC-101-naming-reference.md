# MTS-IAC-101 — Naming Reference

**Status**: Project rule, recorded 2026-09-11 (maintainer decisions G2 and G3).
Implements PC-IAC-003, PC-IAC-004, and PC-IAC-025.

## Governance codes

| Segment | Value | Meaning |
| --- | --- | --- |
| `client` | `lex` | Lexfield Legal — a fictitious law firm, the client for which GaCode Solutions, the team's company, builds and operates MicroTodoSuite |
| `project` | `mts` | MicroTodoSuite |

| `environment` | Meaning |
| --- | --- |
| `shd` | Account-level resources shared by every environment: state backend, ECR, GitHub OIDC trust, public DNS zone, transit egress hub |
| `eco` | The economical profile's shared cluster, which hosts the `dev`, `staging`, `prod`, and `demo` namespaces |
| `fdev` | Full profile, development |
| `fstg` | Full profile, staging |
| `fprd` | Full profile, production, in AWS and in the Azure recovery estate |

A logical environment inside `eco` — a namespace — goes in `{key}`
(`lex-mts-eco-role-jwtdev`).

The client was first set to `gcs` (GaCode Solutions) and corrected the same day
by the maintainer: GaCode Solutions is the team's own company, the provider, not
the client. The client is a law firm, named Lexfield Legal for this project. No
resource had yet been created under `gcs`.

## Resource types

**AWS**

| Resource | `type` | | Resource | `type` |
| --- | --- | --- | --- | --- |
| VPC | `vpc` | | IAM role | `role` |
| Subnet | `sub` | | IAM policy | `pol` |
| Route table | `rtb` | | KMS key alias | `kms` |
| Internet gateway | `igw` | | S3 bucket | `s3` |
| NAT gateway | `nat` | | ECR repository | `ecr` |
| Elastic IP | `eip` | | Secrets Manager secret | `sm` |
| Transit gateway | `tgw` | | EKS cluster | `eks` |
| TGW attachment | `tgwa` | | EKS node group | `ng` |
| VPC endpoint | `vpce` | | Launch template | `lt` |
| Flow log | `fl` | | CloudWatch log group | `cwl` |
| Security group | `sg` | | SQS queue | `sqs` |
| Network ACL | `nacl` | | Load balancer | `alb`, `nlb` |

**Azure** — abbreviations from the Cloud Adoption Framework

| Resource | `type` | | Resource | `type` |
| --- | --- | --- | --- | --- |
| Resource group | `rg` | | AKS cluster | `aks` |
| Virtual network | `vnet` | | Container registry | `acr` |
| Subnet | `snet` | | Key Vault | `kv` |
| Network security group | `nsg` | | Storage account | `st` |
| Public IP | `pip` | | Managed identity | `id` |
| Log Analytics workspace | `log` | | DNS zone | `dns` |

## Keys

Lowercase letters and digits, no hyphen, at most 10 characters: `main`,
`bootstrap`, `puba`, `priva`, `jwtdev`, `ecrpublish`, `authapi`, `logmsgproc`.

With three-letter client and project codes, a key of up to 10 characters keeps
every name within 28: `lex-mts-fdev-role-ecrpublish` is 28.

## Service constraints — recorded exceptions

| Resource | Rule the service imposes | Applied form |
| --- | --- | --- |
| S3 bucket | Globally unique name | `lex-mts-shd-s3-tfstate-{account_id}`; the 28-character limit applies to the part before the account ID (PC-IAC-008) |
| ECR repository | Allows `/` | The standard name, no path: `lex-mts-shd-ecr-authapi` |
| Container registry (Azure) | Letters and digits only, 5–50 | Separators removed: `lexmtsfprdacrdr` |
| Storage account (Azure) | Letters and digits only, 3–24 | Separators removed: `lexmtsfprdstbackup` |
| AKS node pool | 1–12 lowercase letters and digits | The key only: `system`, `workload` |
| Route 53 and Azure DNS zones | The name is the domain | The domain; `Name` tag follows the pattern |
| IAM OIDC provider | The name is the issuer URL | Unchanged; `Name` tag follows the pattern |
| Resources named by AWS | EKS cluster security group, service-linked roles | Unchanged; they carry the cluster's tags |
| KMS alias | The name begins with `alias/` | `alias/` followed by the standard name: `alias/lex-mts-shd-kms-tfstate` |
| CloudWatch log group whose name a service prescribes | EKS writes to `/aws/eks/<cluster>/cluster` | `/aws/<service>/<standard name>[/<suffix>]`; the `Name` tag is a standard name of type `cwl` |

## Out of scope

Kubernetes object names follow MTS-IAC-105. Human IAM users are not managed by
Terraform and are governed by the account's access policy, not this rule.
