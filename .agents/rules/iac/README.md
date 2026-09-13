# Infrastructure-as-Code Rules

**Source**: 26 course rules, `PC-IAC-001` to `PC-IAC-026`, version 1.0, dated
2025-12-10 and 2025-12-11, written in Spanish for AWS and Terraform. They were
reviewed in full on 2026-09-11 and are adapted here into English. The original
files are kept outside the organization and are not reproduced.

**Scope**: every Terraform root and module in the organization — AWS today,
Azure for the disaster-recovery estate, and any provider added later. Rules
`MTS-IAC-1xx` extend the course rules where the project uses something they do
not cover.

## Status of each rule

- **Adopted** — applies as the course wrote it.
- **Adapted** — applies with a recorded project adaptation, stated in the rule.
- **Superseded** — replaced by a maintainer decision; the rule says by what.

| Rule | Title | Status |
| --- | --- | --- |
| PC-IAC-001 | Module structure | Adapted — modules live in a provider repository (MTS-IAC-102); `sample/` is the single example directory |
| PC-IAC-002 | Variables | Adapted — boolean variables need no validation block; environment codes from MTS-IAC-101 |
| PC-IAC-003 | Naming | Adapted — codes and exceptions in MTS-IAC-101; names are built in the root (PC-IAC-025) |
| PC-IAC-004 | Tags | Adapted — Azure applies tags explicitly |
| PC-IAC-005 | Providers and aliases | Adapted — Azure and upstream-module aliases |
| PC-IAC-006 | Versions | Adapted — roots may pin exactly; lock files are committed |
| PC-IAC-007 | Outputs | Adapted — output suffixes for URLs, endpoints, CIDRs, data, and versions |
| PC-IAC-008 | State backend | Adapted — one backend per cloud; the state bucket carries the account ID |
| PC-IAC-009 | Types and logic in locals | Adopted |
| PC-IAC-010 | Collections and lifecycle | Adopted |
| PC-IAC-011 | Data sources | Adapted — a closed list of computational data sources is allowed in modules |
| PC-IAC-012 | Locals structure | Adopted |
| PC-IAC-013 | Module call ordering | Adapted — `version` only for registry sources |
| PC-IAC-014 | Dynamic blocks and splat | Adopted |
| PC-IAC-015 | Module consumption | **Superseded in part** by MTS-IAC-102: one repository per provider, not per module; remote SemVer references still mandatory |
| PC-IAC-016 | Secrets | Adopted |
| PC-IAC-017 | Cross-domain communication | Adopted |
| PC-IAC-018 | Testing and validation | Adapted — `sample/` satisfies the example requirement; Trivy replaces Checkov |
| PC-IAC-019 | Remote state | Adopted |
| PC-IAC-020 | Security hardening | Adapted — cost-bounded VPC endpoints; recorded dev exceptions |
| PC-IAC-021 | Configuration through locals | Adopted |
| PC-IAC-022 | Domain separation | Adapted — domain table extended for EKS, ECR, and account-level resources |
| PC-IAC-023 | Single-responsibility modules | Adapted — upstream modules are configured not to create IAM or security groups |
| PC-IAC-024 | Configuration traceability | Adopted |
| PC-IAC-025 | Naming built in the root | Adopted |
| PC-IAC-026 | The `sample/` pattern | Adopted |
| MTS-IAC-101 | Naming reference | Project rule |
| MTS-IAC-102 | Module repositories and versioning | Project rule (maintainer decision G4, 2026-09-11) |
| MTS-IAC-103 | Account and region parameters | Project rule |
| MTS-IAC-104 | Azure | Project rule |
| MTS-IAC-105 | Kubernetes desired state | Project rule |
| MTS-IAC-106 | GitHub Actions as infrastructure | Project rule |
| MTS-IAC-107 | Changing live infrastructure | Project rule |
| MTS-IAC-108 | Vendor practices and mandatory documentation | Project rule (maintainer request, 2026-09-11) |

## Defects found in the source material

Recorded so that no one relies on them:

- PC-IAC-018 requires `examples/` while PC-IAC-001 and PC-IAC-026 require
  `sample/`. Resolved in favour of `sample/`, the more specific rules.
- PC-IAC-020 ends with leftover conversational text announcing a rule "PC-IAC-021:
  State access isolation" that does not exist; the real PC-IAC-021 covers
  configuration through locals. The text is ignored.
- PC-IAC-003 repeats its section 4 verbatim.
- PC-IAC-013's example combines a Git `source` with a `version` argument, which
  Terraform accepts only for registry sources.

## Exceptions

An exception to any rule is recorded in the pull request that needs it and in
the repository's `docs/iac-exceptions.md`, with the rule ID, the resource, the
reason, and an expiry condition. An exception without an expiry condition is a
decision, and needs the maintainer.

The file holds one Markdown table, which the contracts read:

```
| Rule | Path | Resource | Reason | Expiry |
| --- | --- | --- | --- | --- |
| PC-IAC-017 | aws/environments/fdev/workload | data.terraform_remote_state.network | Why | When it ends |
```

`Path` is a directory relative to the repository root and covers everything
beneath it; `Resource` is the address the finding names, or `*`. A row without a
reason or an expiry waives nothing.
