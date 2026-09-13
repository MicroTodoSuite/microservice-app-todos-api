# PC-IAC-003 — Naming

**Source**: course rule PC-IAC-003, v1.0. **Status**: Adapted.

## Requirement

**Identifiers in HCL** — resources, data sources, variables, outputs, locals —
MUST be `snake_case`. A module's principal resource MUST be named `this`.

**Physical names** of cloud resources MUST follow:

```
{client}-{project}-{environment}-{type}-{key}
```

- Lowercase letters and digits only, hyphen as the only separator.
- `{key}` MUST contain no hyphen; it identifies the instance (`main`, the map key
  of a `for_each`, or a short role such as `jwtdev`).
- The full name MUST NOT exceed 28 characters, unless the service imposes a
  different rule; MTS-IAC-101 lists every such exception.
- The values of `{client}`, `{project}`, `{environment}`, and `{type}` are
  defined in MTS-IAC-101 and nowhere else.
- The `Name` tag MUST carry the same string (PC-IAC-004).

## Project adaptation

- The course places name construction in "`locals.tf`" without saying whose;
  PC-IAC-025 settles it: the root builds every full name, and a module receives
  it. Section 4 of the course rule therefore applies to the root's `locals.tf`.
- Kubernetes object names are not cloud resources and follow MTS-IAC-105.

## Automated check

A naming contract evaluates the plan JSON: every `name`, `name_prefix`, or
`Name` tag of a planned resource matches the pattern for its type, or appears in
MTS-IAC-101's exception list.

## Agent procedure

An agent builds names from `local.governance_prefix` and the type table; it never
types a physical name as a literal.
