# PC-IAC-024 — Traceability of Complex Configuration

**Source**: course rule PC-IAC-024, v1.0. **Status**: Adopted.

## Requirement

Configuration that varies by environment MUST originate in that environment's
`.tfvars`, never as a literal in `locals.tf`:

1. declared in `variables.tf`, with `default = {}` or `[]` when optional;
2. valued in `<environment>.tfvars`;
3. enriched in `locals.tf` with dynamic IDs and ARNs (PC-IAC-009);
4. consumed in `main.tf` from the local (PC-IAC-021).

Pure computations and constants intrinsic to a module MAY live in `locals.tf`.

Environment configuration includes the region and zones (MTS-IAC-103), CIDR
blocks, instance types and other sizes, domains, and the GitHub organization in
OIDC subjects. `0.0.0.0/0` is not environment configuration.

## Automated check

In every live root, `scripts/iac/contracts.py` in `MicroTodoSuite/.github`
rejects a literal CIDR block other than `0.0.0.0/0`, an instance type, a GitHub
organization in an OIDC subject (`repo:<organization>/`), and a domain held by a
`domain`, `domain_name`, `zone_name`, `hostname`, or `fqdn` attribute. PC-IAC-002
already refuses a default on a variable that identifies or sizes
infrastructure. Other sizes, counts, and structured environment values are
reviewed through the iac-review skill.
