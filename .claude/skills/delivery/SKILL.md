---
name: "delivery"
description: "Open and finish a pull request under the MicroTodoSuite delivery conventions: branch and commit form, the Spec-Driven Development pair, a complete body with quoted evidence, task tracking, and the merge rules."
argument-hint: "Optional: the change being delivered"
user-invocable: true
disable-model-invocation: false
---

# Deliver a change

This skill applies to every pull request in every MicroTodoSuite repository, opened by a person or an agent. It condenses `microservice-app-docs/docs/Pull request and task tracking conventions.md`, which is binding (constitution principle 13) and wins wherever the two differ.

## 1. Branch and commits

- One concern per short-lived branch `<type>/<short-kebab-summary>`, with the type `feat`, `fix`, `test`, `docs`, `chore`, `ci`, or `promote`.
- Commits follow Conventional Commits with a scope: `<type>(<scope>): <imperative summary, lower case, no trailing period>`. The body explains why.
- A Spec-Driven Development pair lands as `test(<scope>): specify ...`, committed failing, then `feat(<scope>): implement ...`. It is never squashed.
- Everything is written in English, in a professional third person, with no emoji. Normative text uses RFC 2119 keywords.

## 2. The pull request body

The title is the primary commit's subject. The body fills every section of `.github/pull_request_template.md`:

| Section | Content |
| --- | --- |
| What changes | The behaviour difference, not a file list |
| Why | The problem, and what breaks today without the change |
| Tasks | Every task ID it advances, qualified by repository and spec: `gitops specs/009-full-platform-rollout T045` |
| How it is verified | The exact commands and their decisive output lines; the failing run of an SDD pair; the documentation consulted for infrastructure |
| Risk and rollback | What could break and how to undo it |
| What this PR does not do | Scope left out on purpose |

A body claims only what its author observed. Red checks, skipped steps, and earlier claims that proved wrong are stated plainly.

## 3. Tasks

- The register update ships in the same pull request as the work. Where the register lives in another repository, a paired pull request carries it.
- A task is ticked only after its named artifact has been located and inspected, never from a summary, a green check, or a rendered manifest.
- Partial delivery is annotated, never ticked. Work that no task covers gets a task first, or the body records why none applies.
- Nobody ticks a task on someone else's behalf or authors an acceptance artifact.

## 4. Merge

| Repository | Approvals |
| --- | --- |
| `microservice-app-gitops` | 1; the author requests review and waits |
| Every other repository | 0; the author merges its own green pull request and deletes the branch |

- A squash merge is the default; an SDD pair merges with a merge commit.
- The author does not merge in three cases, and the body says which holds:
  - an outside precondition is unmet;
  - the maintainer asked for another change touching the same files to land first;
  - the merge would change a live environment.
- Never merge with `--admin`, never force-push `main`, never disable a protection rule, and never approve one's own pull request.
- An agent may open, describe, update, and merge its own green pull request where no approval is required. It never approves, and it stops and reports at a refused permission or a failing gate instead of routing around it.

## 5. Repository and organization settings

Settings changes, such as repository merge options, Actions permissions, or GitHub App access, belong to the maintainer. An agent writes down the exact command or setting and holds the pull requests that depend on it.
