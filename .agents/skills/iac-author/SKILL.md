---
name: "iac-author"
description: "Write or change Terraform in a MicroTodoSuite infrastructure repository under the IaC rules: verify the documentation MCP servers, check every argument against current docs, test first, run the gate locally, and record findings as decisions."
---

# Author infrastructure as code

This skill applies before any Terraform is written or changed in `microservice-app-ops`, `terraform-aws-modules`, `terraform-azure-modules`, or another MicroTodoSuite infrastructure repository. The rules live in `rules/` of `microservice-app-ai-agents`, and every repository carries a synced copy in `.agents/rules/`.

## 1. Stop unless the documentation servers answer

Run `scripts/check-mcp.sh <kind> <repository>` from `microservice-app-ai-agents`, with the kind `terraform-aws`, `terraform-azure`, or `gitops`. If a required server does not answer, stop and report; nothing continues from memory (`rules/mcp.md`, `rules/iac/MTS-IAC-108`).

## 2. Read the rules that apply

Read `rules/iac/README.md`, then every rule it marks as applying to the change. The ones most often at stake:

| Change | Rules |
| --- | --- |
| A module | PC-IAC-001 layout, 002 variables, 005 providers, 007 outputs, 011 data sources, 018 tests, 023 single responsibility, 025 names built in the root, 026 `sample/` |
| A root | PC-IAC-008 backend, 019 remote state, 021 configuration through locals, 022 domain separation, MTS-IAC-103 account and region |
| Anything live | MTS-IAC-107 changing live infrastructure; MTS-IAC-105 Kubernetes desired state |
| Names | MTS-IAC-101: `<client>-<project>-<environment>-<type>-<key>`, at most 28 characters |

## 3. Check every argument against current documentation

For each provider argument, version, service limit, and naming constraint, consult the MCP servers at the time of the change:
- `terraform`: `get_latest_provider_version`, then `get_provider_details` for the resource at that version.
- `aws-knowledge` or `microsoft-learn`: service behaviour, limits, and naming rules.

Record every lookup (server, tool, and page), because the pull request lists them under "How it is verified". A provider floor is the release whose documentation was read, unless an older release was verified too.

## 4. Write the test first

A module's tests are `tests/*.tftest.hcl` against a `mock_provider` with `command = plan`: one run per behaviour, and one `expect_failures` run per validation. Commit them as `test(<scope>): specify ...`, confirm that `terraform test` fails, and quote that line. Then commit `feat(<scope>): implement ...`.

Failure modes already met in this organization:
- Two variables whose validations reference each other form a cycle that Terraform rejects; one of the rules becomes a `precondition` on the resource.
- A computed attribute is unknown at plan time; assert on configured values or on `mock_resource` defaults.
- Terraform rejects `terraform validate` on a module that declares `configuration_aliases`; `terraform test` validates the module and `sample/` is validated instead.
- `||` does not short-circuit in a validation; guard optional values with `try()` or `can()`.

## 5. Run the gate locally

```bash
python3 <.github checkout>/scripts/iac/contracts.py repo . --kind modules   # or --kind live
terraform fmt -check -recursive
terraform -chdir=<module> init -backend=false && terraform -chdir=<module> test
terraform -chdir=<module>/sample init -backend=false && terraform -chdir=<module>/sample validate
tflint --recursive --config <.github checkout>/scripts/iac/tflint.hcl
trivy config --severity HIGH,CRITICAL --exit-code 1 .
```

Each result goes into the pull request as the quoted last line, not as a summary.

## 6. Fix findings or record a decision

A contract, tflint, Trivy, or SonarCloud finding is fixed in the code. Where the team accepts it instead, the decision is a row in `docs/iac-exceptions.md` with a reason and an expiry, added in its own reviewed pull request; any `NOSONAR` or `.trivyignore` entry cites that row. A feature branch never carries a suppression.

## 7. Never change live infrastructure from a session

Applies use only a saved plan that the maintainer approved, after an external state backup under `~/backups-microtodosuite/`, or a `no-prior-state` receipt for a new key (MTS-IAC-107). Kubernetes changes go through `microservice-app-gitops` and ArgoCD, never `kubectl apply`.

## 8. Deliver

Open and finish the pull request with the `delivery` skill.
