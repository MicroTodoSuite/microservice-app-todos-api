---
name: "iac-review"
description: "Review a pull request that changes Terraform, GitHub Actions, or GitOps desired state against the IaC rules, the quoted evidence, security findings, and live impact; comment without approving."
---

# Review infrastructure as code

This skill applies when reviewing a pull request that changes Terraform, a GitHub Actions workflow, or GitOps desired state. An AI agent's review is advice to the named human reviewer: the agent comments and never approves (conventions §6). The rules are in `rules/iac/`, synced into every repository as `.agents/rules/iac/`.

## 1. Check the evidence before the code

- A Spec-Driven Development pair: the body quotes the failing test run at the `test(...)` commit and the passing run at the `feat(...)` commit. A missing red run means the cycle is unproven.
- Every provider argument that changed has its documentation lookup listed (server, tool, page) under "How it is verified" (`rules/iac/MTS-IAC-108`).
- The gate's checks are green on the head commit, and the body quotes their results.
- Cheap claims are re-run by the reviewer: `terraform test` in the module and the contracts on the branch.

## 2. Read the rules that no contract checks

| Rule | What to look for |
| --- | --- |
| PC-IAC-009 | Types and logic belong in `locals.tf`, not inline in resources |
| PC-IAC-010 | `for_each` keyed by stable strings; `lifecycle` blocks justified |
| PC-IAC-011 | Modules look nothing up beyond the allowed computational data sources |
| PC-IAC-013 | Module call arguments in the standard order; `version` only for registry sources |
| PC-IAC-014 | Dynamic blocks and splats only where they simplify |
| PC-IAC-020 | Encryption at rest, no public access, finite log retention, least privilege |
| PC-IAC-021 | Configuration flows through locals, not literals in resources |
| PC-IAC-024 | Every value traceable to a variable, a local, or a documented source |

Also flag every `depends_on` without a comment that says which ordering no attribute expresses.

## 3. Security

- Every HIGH or CRITICAL Trivy result and every SonarCloud security finding is either fixed or backed by a row in `docs/iac-exceptions.md` from its own reviewed pull request. A suppression inside a feature branch blocks the review.
- IAM policies grant named actions on named resources; a wildcard needs a stated reason.
- A launch template, security group, or endpoint that could expose a public address says why it cannot.

## 4. Live impact

- A root change: read the saved plan's `resource_changes` in its JSON, not the printed summary. A delete or a replacement of a durable resource blocks the review until the maintainer decides.
- A GitOps change: review the render (`kustomize build`), not the source. An image counts as pinned when the render names it by digest.

## 5. Write the review

Group the findings by severity. Each one names `file:line`, the rule, the concrete failure it causes, and a fix. State what was verified by running it, and what was only read.
