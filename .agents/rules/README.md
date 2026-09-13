# MicroTodoSuite Agent Rules

This directory is the single place where agents working in any MicroTodoSuite
repository read the rules they follow. Each repository's `AGENTS.md` points
here.

## Precedence

When two sources disagree, the higher one wins:

1. `microservice-app-docs/constitution.md`
2. `microservice-app-docs/docs/Pull request and task tracking conventions.md`
3. The rules in this directory
4. Skills and prompts

A rule here never relaxes a higher source. A conflict discovered between them is
reported and resolved by a recorded decision, never by choosing the convenient
side.

## Contents

| Path | Covers |
| --- | --- |
| `iac/` | Infrastructure as code: the 26 adapted course rules (`PC-IAC-001` to `PC-IAC-026`) and the project rules that extend them (`MTS-IAC-101` onward) |
| `mcp.md` | The MCP servers agents use, which of them are mandatory for which repositories, and how they are configured and verified |

## How an agent uses these rules

- Before writing or reviewing infrastructure code, it reads `iac/README.md` and
  every rule that index marks as applying to the change.
- In an infrastructure repository it runs `scripts/check-mcp.sh` first and
  stops if any required documentation server does not answer (`mcp.md`).
- It MUST check provider arguments, versions, and service limits against current
  vendor documentation through those servers, never from memory alone, and
  names what it checked in the pull request (`iac/MTS-IAC-108`).
- It runs the automated check each rule names and quotes the result in the pull
  request body.
- A rule it cannot satisfy is reported as an exception with a reason, in the
  pull request and in the rule's exception register, never skipped silently.

## Language

Every rule is written in English, in the third person, with requirements in RFC
2119 form. Rules adapted from Spanish course material cite their source and
never reproduce the original text.
