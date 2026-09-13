# PC-IAC-015 — Module Consumption

**Source**: course rule PC-IAC-015, v2.0. **Status**: Superseded in part by
MTS-IAC-102.

## Requirement

- A root MUST consume reference modules from a remote source pinned to a SemVer
  tag. A branch reference (`ref=main`) or a bare commit MUST NOT be used.
- A local path (`../modules/x`) MAY be used only on a development branch while the
  module is being written or fixed. A root on `main` MUST reference a released tag.

## What was superseded

The course mandates one repository per module. On 2026-09-11 the maintainer
decided on one module repository per cloud provider instead, with each module
versioned independently. MTS-IAC-102 defines the repositories, the tag format,
and the release process.

## Transition exception

Until the modules are extracted into the provider repositories, the live roots
consume them by local path. The exception expires when the extraction lands, and
is tracked on the project board.

## Automated check

A contract fails on a `main`-branch root whose module source is local, a branch,
or an unpinned Git reference.
