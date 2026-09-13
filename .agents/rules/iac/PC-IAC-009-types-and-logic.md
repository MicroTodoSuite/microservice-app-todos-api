# PC-IAC-009 — Types, Conversions, and Logic in Locals

**Source**: course rule PC-IAC-009, v1.0. **Status**: Adopted.

## Requirement

- Every variable MUST be explicitly typed; nothing relies on type inference.
- Every type conversion (`tolist`, `toset`, `tomap`, `tonumber`, `tostring`)
  MUST happen in `locals.tf`.
- Injecting a dynamic value — a data source or another module's output — into a
  configuration object MUST happen in `locals.tf`, never inside a `module`
  block.
- Defaults for empty fields MUST use the pattern
  `length(x) > 0 ? x : data.example.default.id` in `locals.tf`.
- Access to attributes that may be absent MUST use `try()` or `can()`.

## Automated check

Reviewed through the iac-review skill; a module block containing a `for`
expression or `merge()` over a data source is flagged.
