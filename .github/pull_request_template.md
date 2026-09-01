<!--
Binding: microservice-app-docs/docs/Pull request and task tracking conventions.md
Constitution principle 13 (Traceable Delivery) makes it non-negotiable.

Every section below is required. Where one genuinely does not apply, write
"N/A" and one clause saying why. Do not delete sections.

Title: the same Conventional Commit string as the primary commit, e.g.
  feat(us3): implement the auth-api operational contract

Written in English — title, body, and review comments. No bilingual sections.
See section 3 of the conventions. Discussing the change in another language is
fine; writing it into the repository is not.
-->

## What changes

<!-- The behavior difference, not a file list. GitHub already shows the files. -->

## Why

<!-- The problem this solves. For a defect: what breaks today, and what the
     user or operator actually experiences when it does. -->

## Tasks

<!-- Task IDs advanced, qualified by repository and spec. One per line.
     Example: gitops specs/009-full-platform-rollout T045

     The tasks.md update ships in THIS pull request, not a follow-up.
     Tick only against a located artifact — never from a summary, a green
     check, or a rendered manifest. Annotate partial delivery instead of
     ticking it.

     If no register applies, say so here and say why. -->

- [ ] The task register is updated in this pull request
- [ ] Every task ticked here was verified by locating its artifact

## How it is verified

<!-- The exact commands run and their result. Quote the decisive output.
     "Tests pass" is not verification.
     For a guard whose job is to refuse: the mutation result.
     For infrastructure: the plan summary, from the plan JSON. -->

## Risk and rollback

<!-- What could break, and how to undo it. For GitOps this is normally
     "revert the commit" — say so rather than leaving it blank. -->

## What this PR does not do

<!-- Scope deliberately left out, so a reviewer does not look for it. -->

---

<!-- Reminders that are not optional:
     - No self-approval. No `--admin` merge. No force-push to main.
     - Never disable a branch protection rule to land your own work.
     - An AI agent may open and update this PR. It may not approve it, and may
       not author an acceptance artifact.
     - Report faithfully: if CI is red, say what is red. If a step was skipped,
       say it was skipped. -->

