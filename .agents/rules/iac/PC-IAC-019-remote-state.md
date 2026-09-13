# PC-IAC-019 — Restricted Use of Remote State

**Source**: course rule PC-IAC-019, v1.0. **Status**: Adopted.

## Requirement

`data "terraform_remote_state"` MAY be used only when a data source cannot
reasonably retrieve the value — typically several related outputs with no single
lookup. Each use MUST:

- carry a comment starting `EXCEPTION PC-IAC-019:` stating why a data source does
  not work and which outputs are read;
- be listed in the consuming root's README;
- read only granular outputs, never whole objects;
- be approved in review and marked as technical debt if a data-source path may
  exist later.

The producing root MUST expose only the outputs such consumers need.

## Automated check

Covered by the PC-IAC-017 contract.
