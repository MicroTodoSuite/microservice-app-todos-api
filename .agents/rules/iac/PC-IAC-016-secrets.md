# PC-IAC-016 — Secrets and Sensitive Data

**Source**: course rule PC-IAC-016, v1.0. **Status**: Adopted.

## Requirement

- A secret, key, password, token, or webhook MUST NOT be committed — in code, in
  any `.tfvars`, in a test fixture, or in an evidence file.
- A variable that receives a secret MUST set `sensitive = true`.
- Modules MUST NOT output secrets. A generated secret is written to Secrets
  Manager or Key Vault, not returned.
- Secrets are injected at runtime from Secrets Manager or Key Vault, or from CI
  secrets as `TF_VAR_*`. Terraform MAY create the secret container and write a
  generated value through a write-only argument; a human-supplied value is set
  outside Terraform.
- State MUST be encrypted (PC-IAC-008).

## Automated check

Secret scanning in CI, and a contract that fails on a sensitive variable lacking
`sensitive = true` by name (`*password*`, `*secret*`, `*token*`, `*webhook*`).
