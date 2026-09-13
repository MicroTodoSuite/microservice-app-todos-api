# PC-IAC-008 — State Backend

**Source**: course rule PC-IAC-008, v1.0. **Status**: Adapted.

## Requirement

- A backend MUST be declared only in a root, never in a module.
- AWS roots MUST use the S3 backend with `encrypt = true`, a customer-managed KMS
  key, and `use_lockfile = true`. There is no DynamoDB lock table, by recorded
  decision.
- The backend block MUST be partial (`backend "s3" {}`); values come from a
  `-backend-config` file generated from the backend root's outputs, never typed
  by hand.
- Each root MUST have its own state key: `<environment>/<domain>/terraform.tfstate`.
  Two roots sharing a key destroy an environment instead of failing, so key
  uniqueness is checked in CI.

## Project adaptation

- Azure roots use the `azurerm` backend (Blob storage, lease locking, encryption
  at rest) — the course names S3 only because it covers AWS only (MTS-IAC-104).
- The state bucket is named `{client}-{project}-shd-s3-tfstate-{account_id}`.
  Bucket names are global, and the project has lost two AWS accounts whose
  buckets still reserve their names; the account suffix is the only reliable
  guarantee. This is a recorded exception to PC-IAC-003's length limit.
- The backend root itself starts with local state and is backed up externally
  (MTS-IAC-107).

## Automated check

The existing state-key uniqueness check, plus a contract that fails on a module
backend and on a root backend block containing values.
