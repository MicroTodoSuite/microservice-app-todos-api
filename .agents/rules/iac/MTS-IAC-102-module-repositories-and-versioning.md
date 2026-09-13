# MTS-IAC-102 — Module Repositories and Versioning

**Status**: Project rule, recorded 2026-09-11 (maintainer decision G4).
Supersedes PC-IAC-015's "one module, one repository".

## Repositories

Reusable modules live in **one repository per cloud provider**:

| Repository | Holds |
| --- | --- |
| `terraform-aws-modules` | AWS modules |
| `terraform-azure-modules` | Azure modules |
| `terraform-<provider>-modules` | Any provider added later |

A module is one top-level directory with the PC-IAC-001 layout. Modules never
import each other by relative path across the repository; a module that needs
another's output receives it as an input.

Live repositories consume modules and never contain a copy of one.

The repository names coincide with the public `terraform-aws-modules`
organization on the Terraform Registry. Sources therefore always use the full Git
URL, never a registry address, so the two cannot be confused:

```hcl
module "eks" {
  source = "git::https://github.com/MicroTodoSuite/terraform-aws-modules.git//eks?ref=eks-v1.4.0"
}
```

## Independent versions

Each module is versioned on its own, so a change to one never forces consumers of
another to move:

- Release tooling: release-please in manifest mode, one component per module
  directory.
- Tags: `<module>-v<MAJOR>.<MINOR>.<PATCH>`, for example `eks-v1.4.0`.
- Each module keeps its own `CHANGELOG.md`.
- Commits touching a module use the module's name as Conventional Commit scope
  (`feat(eks): …`); a `BREAKING CHANGE` footer produces a major version.
- A commit touching two modules is split; one change, one module.

## Consumers

- A live root pins the exact tag. Upgrading is a reviewed pull request that
  changes `?ref=` and shows the plan.
- Dependabot or Renovate MAY propose tag upgrades; they never merge unreviewed
  into a root that owns production.

## CI in the module repository

On every pull request, every module is checked by the reusable workflow
`MicroTodoSuite/.github/.github/workflows/iac-checks.yml`: `terraform fmt`,
`terraform test` (which validates the module, PC-IAC-018), tflint, Trivy, and the
rule contracts, plus `terraform validate` of each module's `sample/`. Release pull requests are created
by release-please from merged Conventional Commits.
