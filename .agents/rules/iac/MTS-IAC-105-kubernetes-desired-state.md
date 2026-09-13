# MTS-IAC-105 — Kubernetes Desired State

**Status**: Project rule, recorded 2026-09-11.

## Requirement

- Kubernetes state changes only through commits to `microservice-app-gitops`,
  reconciled by ArgoCD. No `kubectl apply`, `patch`, `scale`, or `delete` against
  a GitOps-managed cluster, except the two audited bootstrap mutations.
- Images are referenced by immutable digest; tags are not deployable.
- Cloud identifiers that manifests must carry — account, role ARNs, registry
  hosts — come from Terraform outputs and one declared source per repository
  (MTS-IAC-103), never typed by hand.
- Vendored upstream manifests are pinned by checksum and not edited in place.
- Kubernetes object names follow the GitOps repository's conventions, not
  PC-IAC-003.
