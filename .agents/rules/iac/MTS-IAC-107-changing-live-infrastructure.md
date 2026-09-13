# MTS-IAC-107 — Changing Live Infrastructure

**Status**: Project rule, recorded 2026-09-11.

## Every apply

1. A timestamped external state backup under `~/backups-microtodosuite/`, or a
   `no-prior-state` receipt for a new key.
2. A saved plan, inspected from `terraform show -json`, not from printed text.
3. Recorded approval of that exact plan.
4. `terraform apply -input=false <plan>`; never a convenience apply.
5. A post-apply check that the other environments' refreshed plans are still
   `no-op`.

## Destruction

Destroying live infrastructure is allowed only through a maintainer-approved
rebuild plan that names, in order: every resource destroyed, every persistent
item preserved and how (state files, secret values, registry images, volume
snapshots, DNS records), the recreation order, the validation that proves the
rebuild works, and the check that leaves no orphan. The first such rebuild is the
naming-convention adoption decided on 2026-09-11 (ops spec 004).

A secret value is copied between secrets without being printed or written to
disk in clear text.
