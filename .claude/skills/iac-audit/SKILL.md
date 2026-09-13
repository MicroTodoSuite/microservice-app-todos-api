---
name: "iac-audit"
description: "Audit an infrastructure repository against the IaC rules: run contracts, tflint, Trivy, and renders, read the rules no contract checks, and write a register whose every finding names the task that removes it."
argument-hint: "Optional: the repository and revision to audit"
user-invocable: true
disable-model-invocation: false
---

# Audit a repository against the IaC rules

This skill applies to a scheduled or requested audit of an infrastructure repository against `rules/iac/` (synced into every repository as `.agents/rules/iac/`). The audit produces a register, `docs/iac-audit.md`, with the raw output of every tool under `docs/iac-audit/<date>/`, and it adds one task per class of finding to the program register. `microservice-app-ops` `docs/iac-audit.md` (2026-09-12) is the worked example.

## 1. Pin what is audited

Record the commit of every subject repository, of `rules/`, and of the contracts in the `.github` repository. A finding is only as good as the revision it names.

## 2. Run every automated check and keep the raw output

| Check | Command | Scope |
| --- | --- | --- |
| Rule contracts | `contracts.py repo . --kind live`, and `contracts.py module <dir>` per module | Every root and module |
| Lint | `tflint --recursive` with the gate's configuration | The whole repository |
| Misconfiguration | `trivy config --severity HIGH,CRITICAL` | The Terraform tree, including downloaded modules |
| Workflows | Read every workflow for actions pinned by SHA and declared permissions (MTS-IAC-106) | `.github/workflows/` |
| Desired state | Render with `kustomize build`, then read the render (MTS-IAC-105) | Every kustomization |

Desired state is judged on the render. A tag in a source manifest that its kustomization replaces with a digest is not a finding; the 2026-09-12 audit counted one such tag, and its correction is recorded beside the finding.

## 3. Read the rules that have no contract

PC-IAC-009, 010, 011, 013, 014, 020, 021, and 024 are checked by reading the code. Any claim about service behaviour is checked through the MCP documentation servers (`rules/mcp.md`) and cited.

## 4. Write the register

The register has these sections, in order:
1. How to read the register.
2. The method.
3. A summary table: source, number of findings, and the task that removes them.
4. The findings per source.
5. The rules reviewed by reading.
6. Workflows.
7. Desired state.
8. The tasks the audit adds.
9. The evidence.

Every finding names the task that removes it. An audit waives nothing: an exception is a team decision in its own reviewed pull request (`rules/iac/README.md`).

## 5. Register the tasks

A paired pull request in `microservice-app-ai-agents` adds the audit's tasks to the program register; the audit's pull request names them.

## 6. Correct, never rewrite

A finding later shown to be wrong keeps its original text and gains a dated correction beside it, with the evidence. The register stays a truthful record of what the audit said.
