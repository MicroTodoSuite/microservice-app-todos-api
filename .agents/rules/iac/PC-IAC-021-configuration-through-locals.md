# PC-IAC-021 — Configuration Through Locals

**Source**: course rule PC-IAC-021, v1.0. **Status**: Adopted.

## Requirement

A root MUST NOT write a complex structure — `map(object)`, `list(object)`, or
anything longer than three lines — directly in a `module` block. The flow MUST
be:

```
var.config (from .tfvars) -> local.config_final (locals.tf) -> module argument
```

Simple strings, numbers, and booleans MAY be passed directly.

## Automated check

Reviewed through the iac-review skill.
