# MTS-IAC-108 — Vendor Practices and Mandatory Documentation

**Status**: Project rule, recorded 2026-09-11 at the maintainer's request.

## Requirement

The course rules (PC-IAC-001 to PC-IAC-026) and the project rules are the
baseline. The providers' current recommended practices complement them; the two
are not alternatives:

| Vendor | Practice sources |
| --- | --- |
| HashiCorp | Terraform style guide, module structure, testing, and version constraints |
| AWS | AWS Well-Architected Framework, AWS Prescriptive Guidance for the Terraform AWS provider, and each service's security best-practice guide, such as the EKS Best Practices Guide |
| Microsoft | Azure Well-Architected Framework, Cloud Adoption Framework naming and tagging, Azure Verified Modules specifications, and the Azure MCP Server's Terraform best practices |

- Where a vendor practice is stricter or more secure than a project rule, both
  apply.
- Where a vendor practice contradicts a project rule — for example Azure Verified
  Modules naming against PC-IAC-003 — the project rule applies in this
  organization, and the difference is recorded in that rule's file as an
  adaptation.
- Where a project rule contradicts a vendor's current security guidance, the rule
  is treated as a defect: the agent raises it, and the maintainer records a
  decision. Neither side is followed silently.
- For every resource type, provider argument, version, service limit, or naming
  constraint that an agent writes or reviews, it MUST consult the vendor
  documentation through the servers `rules/mcp.md` makes mandatory, at the time
  of the change:

| Question | Server |
| --- | --- |
| Provider or module version, resource arguments, deprecations | `terraform` |
| AWS service behaviour, limits, regional availability, recommended practice | `aws-knowledge` |
| Azure service behaviour, naming rules, recommended practice | `microsoft-learn` and `azure` |

- Versions, arguments, and limits change; an agent MUST NOT rely on its training
  data for them.
- The pull request lists what was consulted (`rules/mcp.md`).

## Automated check

`scripts/check-mcp.sh` before work begins. The planned conventions workflow will
fail an infrastructure pull request whose "How it is verified" section lists no
documentation consulted.
