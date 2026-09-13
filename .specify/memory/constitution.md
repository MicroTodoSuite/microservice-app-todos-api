<!--
Sync Impact Report
- Version change: 3.1.0 -> 4.0.0 (MAJOR: principle 12 is redefined)
- Modified principles:
  - 12. Proven Disaster Recovery and Disclosed Data Loss: Azure becomes an independent
    recovery domain with active-passive failover; latency-based active-active is gated on
    a replicated data store. Basis: `docs/ADR-0001 Multicloud strategy.md`.
- Modified sections:
  - Cost-optimized profile: a maintainer-approved rebuild under new resource names is
    permitted and is not a retirement (maintainer decision G3, 2026-09-11); optional
    cold DR moves to an off-provider store.
  - Authorized full-profile rollout: failover routing replaces active-active routing as
    the gated production traffic mode.
- Affected repositories: microservice-app-ops (spec 004 rebuild), microservice-app-gitops
  (spec 009 user story 5 and the non-retirement boundary, FR-003), microservice-app-docs.
- Follow-up TODOs: amend spec 009 FR-003 and user story 5 in a gitops pull request.

Prior report (3.1.0), retained for auditability:
- Version change: 3.0.0 -> 3.1.0
- Added principles:
  - 13. Traceable Delivery: pull-request format and task-record obligations become binding.
- Modified principles: none. No existing principle is redefined or retired, so this is
  an additive amendment.
- Added sections: none beyond the new principle.
- Removed sections: none.
- Affected repositories: all nine. Each gains `.github/pull_request_template.md` and a
  Conventions entry in `AGENTS.md` (symlinked as `CLAUDE.md`).
- Follow-up TODOs: approve a cross-repository specification before implementing or
  applying the full profile; reconcile the six task registers still marked as needing a
  decision in `full-platform/plan-reconciliation.md`.

Prior report (3.0.0), retained for auditability:
- Version change: 1.3.0 -> 3.0.0
- Modified principles:
  - Cost-Governed Design: cost evidence now gates every full-profile infrastructure apply.
  - Observable and Resilient Operations: profile-specific telemetry and service-mesh requirements are explicit.
  - Least Privilege and Secret Hygiene: the full profile requires mesh mTLS in addition to the shared baseline.
  - Proven Disaster Recovery and Disclosed Data Loss: the active-active Azure target is now an authorized delivery target.
- Added sections: authorized full-profile rollout and economical-to-full transition safeguards.
- Removed sections: profile selectability demonstration (replaced by the authorized rollout section).
-->

# MicroTodoSuite Constitution

Version: 4.0.0

Ratified: 2026-08-10

Assessment basis: `docs/MicroTodoSuite evolution plan.md`, `context-snapshot.xml`, and repository/live evidence through 2026-08-30.

## Purpose

This constitution defines the binding engineering and governance rules for evolving
MicroTodoSuite from its current cloud runtimes toward both the operational economical
AWS platform and the authorized full multi-cloud platform. It distinguishes enforceable
direction from current fact: existing code is evidence, drift is debt, and an
unimplemented plan item must never be represented as an available capability.

## Non-negotiable principles

### 1. Environment Isolation

**Use one AWS account with explicit environment isolation.** AWS environments MUST share one account and be isolated by dedicated clusters and VPCs, or by namespaces with ResourceQuotas, LimitRanges, NetworkPolicies, and RBAC only when the cost-optimized profile is formally adopted — Rationale: isolation must be structural and auditable rather than account sprawl or naming convention.

### 2. GitOps-Only Deployment

**Use GitOps as the only deployment path.** Every workload, platform add-on, configuration, and image change for a managed environment MUST be committed to `microservice-app-gitops` and reconciled by ArgoCD; direct `kubectl apply`, cloud-CLI application mutation, and CI-to-cluster deployment are forbidden — Rationale: Git history must be the complete, reversible record of desired state.

Exception: a documented, minimal, one-time bootstrap sequence MAY use direct
cluster mutation solely to install the GitOps controller itself and its
initial root Application, before any GitOps-managed state exists. This
exception MUST NOT be used for any other purpose, MUST be limited to the
smallest set of commands that installs the controller and hands control to
it, and MUST be recorded in bootstrap documentation so it remains auditable.

### 3. Stable Trunk Development

**Develop from a stable trunk.** Every repository MUST use `main`, short-lived branches, mandatory review and checks, and feature flags for incomplete behavior — Rationale: small integrations reduce merge risk without exposing unfinished work.

### 4. Authoritative Specifications

**Make version-controlled specifications authoritative.** Work MUST derive from the shared constitution and, as applicable, `specs/<feature>.md`, clarification decisions, `plan.md`, and `tasks.md`; REST and event behavior MUST be contract-first through OpenAPI and AsyncAPI, while small fixes MAY begin at tasks but never from an unrecorded prompt — Rationale: people, automation, and AI agents need the same reviewable source of truth.

### 5. Cost-Governed Design

**Measure cost without silently weakening the design.** Every Terraform change MUST
produce reviewed Infracost evidence before apply. Every full-profile stage MUST also
define a cost ceiling or explicit human acceptance of its estimate before resources are
created. OpenCost MUST be installed and verified before runtime cost allocation is
claimed — Rationale: the full architecture intentionally spends more, but every expense
and cost-saving infrastructure adaptation remains visible and deliberate.

### 6. Immutable Build Promotion

**Build once and promote immutable evidence.** CI MUST build, test, scan, generate an SBOM, sign one immutable image digest, and promote that same digest through dev, staging, production, and DR using GitOps — Rationale: rebuilding or deploying `latest` breaks provenance and makes rollback unreliable.

### 7. Progressive and Reversible Releases

**Release progressively and reversibly.** Development and staging MAY roll, production MUST use metric-gated Argo Rollouts canaries with automatic rollback, DR MUST receive the production-validated version, and rollback MUST be a Git revert — Rationale: exposure and recovery must be controlled by measured health and recorded state.

### 8. Quality and Supply-Chain Gates

**Automate quality and supply-chain gates.** Every PR MUST run the test categories for which its owning specification defines a runnable contract. Every released image MUST, at minimum, pass source tests and Trivy, produce a Syft SBOM, receive a Cosign signature, and pass Kyverno admission. SonarQube, integration, E2E, performance, and DAST become blocking when a checked-in harness/profile exists or a feature depends on or claims that capability; any deferral MUST be explicit in the feature specification and current-state assessment — Rationale: release gates must be executable and truthful, while absent future tooling is never reported as passing.

### 9. Observable and Resilient Operations

**Design for observable, resilient, and healthy operation.** Every deployed service MUST
have startup, readiness, and liveness probes plus a service-owned endpoint or metric used
by release health gates. OpenTelemetry, Jaeger, Prometheus/Grafana, ELK/Filebeat,
Alertmanager, and KEDA MUST be live before the full profile is accepted. Istio remains
forbidden in the economical cluster and is mandatory, with verified mTLS and traffic
policy, in full-profile workload clusters — Rationale: each profile must provide the
capabilities it claims without allowing one profile's topology to leak into the other.

### 10. Least Privilege and Secret Hygiene

**Enforce least privilege and secret hygiene.** CI cloud writes MUST use OIDC; workloads
MUST use namespace-scoped RBAC and MUST use IRSA or workload identity when calling cloud
APIs; secrets MUST come through External Secrets; every ingress MUST use TLS; and released
images MUST pass Trivy and Kyverno. The full profile MUST additionally enforce Istio mTLS,
Falco runtime detection, and scheduled `kube-bench` and `kube-hunter` evidence before it is
accepted — Rationale: the full profile is not complete merely because its workloads run;
its declared identity, transport, admission, and runtime controls must also work.

### 11. Declarative and Policy-Controlled Platform

**Keep the platform declarative and policy-controlled.** Terraform MUST own VPC, EKS, IAM/IRSA, ECR, Route 53, and AKS foundations, while ArgoCD MUST own Istio/Kiali, KEDA, cert-manager, External Secrets, Kyverno, Chaos Mesh, Falco, OpenCost, and application manifests — Rationale: ownership boundaries prevent configuration drift and imperative recovery procedures.

### 12. Proven Disaster Recovery and Disclosed Data Loss

**Prove disaster recovery and disclose data loss.** The full profile MUST use AWS as its
single primary platform and Azure as an independent recovery domain. Azure MUST hold a
warm-standby production destination reconciled by its own ArgoCD root and running the
same immutable production digest, and MUST hold off-provider recovery copies —
Terraform state replicas, cluster backups, and the production image mirror — so that the
loss of the AWS region or of the AWS account is recoverable. Production traffic MUST
reach Azure only through health-checked failover (active-passive). Latency-based
active-active routing MUST NOT be enabled until a replicated data store makes a user's
requests consistent across clouds. Chaos Mesh game days MUST prove failover before real
traffic is enabled, and Redis plus business data continuity limits MUST remain explicit
until durable replication exists — Rationale: an untested failover path or hidden state
loss is not disaster recovery, and routing users across two independent in-memory data
sets is not availability.

### 13. Traceable Delivery

**Deliver nothing that cannot be traced back to a task and forward to its record.**
Every pull request MUST follow `docs/Pull request and task tracking conventions.md`:
one concern per short-lived branch, a Conventional Commit title, the required body
sections, and the task identifiers it advances. Every completed task MUST be marked
in the same pull request that completed it, and MUST be marked only against a located
artifact — never from a summary, a green check, a rendered manifest, or recollection.
Partial delivery MUST be annotated rather than ticked, work outside every register MUST
either gain a task or record in its pull request why none applies, and a register that
contradicts reality MUST be reconciled by a recorded decision rather than by quietly
editing whichever side is more convenient. An AI agent MUST follow these conventions,
MAY NOT approve a pull request, and MAY NOT author an acceptance artifact — Rationale:
work whose record drifts from its delivery cannot be reviewed, audited, or trusted, and
a register nobody maintains silently becomes fiction.

## Operational baseline: cost-optimized (economical)

Effective 2026-08-09, the cost-optimized architecture profile defined in
`docs/MicroTodoSuite evolution plan.md` section 17 remains the operational baseline while
the full profile is built and validated in parallel.

- Development, staging, and production environments share a single AWS EKS
  cluster, isolated by Kubernetes namespace rather than by separate
  clusters or VPCs.
- Each environment namespace MUST have ResourceQuotas, LimitRanges,
  NetworkPolicies, and RBAC enforcing isolation, per principle 1's
  cost-optimized allowance.
- No Istio/service mesh is used; resilience patterns are implemented in
  service libraries, and canary deployment uses native Argo Rollouts
  replica-based traffic shifting rather than Istio percentage routing.
- No Azure AKS disaster-recovery target is provisioned under this profile;
  resilience relies on multi-AZ placement within the single cluster, with
  optional cold DR via Velero backups to an off-provider store in Azure, so that
  a lost AWS account does not take the backups with it.
- Node capacity SHOULD favor Spot instances for cost, reserving On-Demand
  capacity for evidence-gathering windows or genuinely stateful workloads.

This trades weaker workload isolation for materially lower cost. It is a deliberate,
informed trade-off, not an oversight. Its cluster, workloads, and GitOps ownership MUST
remain operational throughout the full-profile rollout, except during an approved rebuild
window. Retirement or production cutover requires a separate approved decision with
rollback evidence; the rollout itself grants no authority to destroy or repurpose the
economical environment. A rebuild is not a retirement: destroying and recreating the
economical environment under new resource names is permitted when the maintainer
approves a rebuild plan that preserves every persistent and sensitive item, applies only
reviewed saved plans, and validates the recreated platform before the window closes
(maintainer decision G3, 2026-09-11; ops spec 004).

Workload activation under this profile requires namespace isolation, GitOps-only reconciliation, immutable test/scan/SBOM/signature evidence, Kyverno admission, External Secrets and IRSA where applicable, explicit probes, native production canaries, and live acceptance evidence. Capability-gated controls above MUST have a versioned follow-up spec and owner before they are claimed; their documented absence is neither an implicit pass nor a blocker for an unrelated release.

## Authorized full-profile rollout

The full version in `docs/MicroTodoSuite evolution plan.md` is an authorized parallel
delivery target. Its implementation MUST satisfy all of the following boundaries:

- Development, staging, and production each run in a dedicated AWS EKS cluster and VPC
  inside the existing AWS account. The already-created `demo-full` foundation MAY be
  assigned to one of these roles only through the approved feature specification.
- Azure AKS provides the production disaster-recovery destination. AWS and Azure MUST
  reconcile independently through per-cluster ArgoCD roots and deploy the same immutable
  production digest.
- The full platform includes Istio and Kiali, KEDA, cert-manager, External Secrets,
  Kyverno, Argo Rollouts, Prometheus, Grafana, Jaeger, ELK/Filebeat, Alertmanager, Falco,
  Chaos Mesh, OpenCost, and the declared audit jobs. A capability is complete only after
  its live behavior and failure mode are verified.
- Route 53 failover routing, production traffic, and destructive cutover remain
  disabled until ingress TLS, health checks, canary rollback, cross-cloud consistency,
  and an approved failover game day all pass. Latency-based active-active routing
  additionally requires a replicated data store (principle 12).
- Account-level singletons remain single-owner resources. Additional clusters consume
  them through explicit multi-cluster trust or cluster-local identities without creating
  duplicate repositories, providers, or globally named roles.
- Quota-compatible instance families, reduced NAT gateway counts, and other approved
  infrastructure substitutions MAY be used when they preserve functional behavior,
  least privilege, encryption, health, and recovery evidence. Every reduced-availability
  trade-off MUST be recorded in the owning specification and plan.
- All workload and add-on changes remain GitOps-only. Each new cluster may receive only
  the audited one-time ArgoCD installation and root Application before ArgoCD assumes
  complete ownership.

Implementation MUST proceed in independently reviewable stages. A failed stage MUST stop
later activation, and rollback MUST preserve the working economical platform.

## Current state vs. plan

Status meanings: **HONORED** = concrete implementation exists; **PARTIAL** = some required behavior exists; **ASPIRATIONAL** = no implementation evidence exists; **CONTRADICTED** = current behavior violates the planned rule.

| Plan principle or component | Status | Snapshot evidence and discrepancy |
| --- | --- | --- |
| Single AWS account and isolated dev/staging/prod | **PARTIAL** | The economical EKS cluster runs all three logical environments and the dedicated `demo-full` EKS/VPC foundation is active. Dedicated full-profile staging and production EKS foundations are absent. |
| GitOps-only delivery | **PARTIAL / LEGACY CONTRADICTION** | The economical EKS root currently reconciles 25 Applications, including all fifteen business Applications, and they are Synced/Healthy. `demo-full` and future full-profile destinations are not yet registered. Legacy Azure workflows still contain direct cloud mutations. |
| Trunk-Based Development and feature flags | **PARTIAL** | Repositories use `main`, PR triggers, and short-lived `feat/*` references, and ops documentation names trunk-based development. No feature-flag implementation or enforcement is present, and historical docs still describe GitHub Flow for application repositories. |
| Specification as source of truth | **PARTIAL** | GitOps features 001-005 include versioned specs, plans, tasks, contracts, and acceptance criteria. Coverage is not uniform across repositories, and feature 005 must be reconciled with this amendment before implementation resumes. |
| FinOps-informed design | **ASPIRATIONAL / DEFERRED** | No checked-in Infracost or live OpenCost evidence exists. Runtime-cost claims remain unavailable, while unrelated economical-profile activation is allowed only with this gap disclosed. |
| Planned repository topology | **PARTIAL** | The GitOps and organization `.github` shared-workflow repositories now exist alongside the service, ops, docs, Prometheus, and AI-agents repositories. Adoption and AI-agent assets remain incomplete. |
| Terraform cloud foundation | **PARTIAL** | The economical and `demo-full` AWS foundations are merged and live with isolated remote state. `demo-full` uses the approved one-NAT and `m7i-flex.large` substitutions. Additional EKS foundations, AKS, Route 53, Infracost gates, and workload identities remain unbuilt. |
| Kubernetes platform add-ons | **PARTIAL** | ArgoCD, KEDA, cert-manager, External Secrets, Kyverno, and Argo Rollouts are live on the economical cluster. Full-profile observability, mesh, runtime security, chaos, and cost components are defined only in part or absent. |
| ArgoCD layout, promotion, rollback, and notifications | **PARTIAL** | The economical root and its 24 child Applications are Git-owned and Synced/Healthy. No full-profile cluster has an approved registration or root, and cross-cloud promotion and notifications remain unverified. |
| Environment-specific deployment strategy | **PARTIAL** | All fifteen economical business Applications are active and healthy. Metric-gated Istio canaries and destination-specific full-profile releases remain unverified. |
| Reusable CI, OIDC, and artifact supply chain | **PARTIAL / RELEASE-BLOCKED** | Five services call the central workflow, which defines build-once digests, AWS OIDC, Trivy, Syft, and Cosign stages. Test execution is largely unwired, SonarQube is inactive, and successful image-specific baseline evidence plus Kyverno signature admission remain prerequisites to release. |
| Resilience and configuration patterns | **PARTIAL** | Services read environment variables, Terraform converts selected values to secret references, Todos retries Redis connections, and an ops workflow imperatively applies Azure's recommended resiliency policy. General service-library circuit breaker, bulkhead, and timeout behavior is not demonstrated; OpenFeature and Spring Cloud Config are absent. |
| Test strategy and quality reporting | **PARTIAL / RELEASE-BLOCKED** | The central workflow exposes explicit unit, integration, contract, E2E, performance, DAST, and Sonar gates, but most are fail-closed scaffolds without runnable suites. No business image has complete baseline release evidence. |
| Observability and workload health | **PARTIAL** | Business workloads are live with probes and selected OpenTelemetry configuration. The capacity-constrained economical root does not activate Prometheus/Grafana, Jaeger, or Loki, and the full ELK/Alertmanager path remains unbuilt. |
| Security controls | **PARTIAL / RELEASE-BLOCKED** | RBAC, External Secrets, Kyverno, network-policy enforcement, and supply-chain stages exist. Full-profile mTLS, ingress TLS, Falco evidence, multi-cluster workload identity, signature admission, and audit-job results remain incomplete. |
| Change management and traceability | **PARTIAL / CONTRADICTED** | Semantic-release, semantic versions, release tags, and changelogs exist. Deployments nevertheless select `:latest`; PR rollback plans, spec-to-image traceability, immutable promotion, and GitOps `git revert` rollback are absent. |
| Cost-optimized resilience, chaos engineering, and cost controls | **PARTIAL** | Shared EKS, three bounded namespaces, VPC CNI enforcement, GitOps, selected add-ons, and per-environment Redis are live. Default-deny evidence, business activation, canaries, continuity, Spot capacity, resilience libraries, and FinOps evidence remain incomplete or explicitly deferred. |
| Data continuity | **CONTRADICTED AS A DR CAPABILITY; HONESTLY IDENTIFIED AS A RISK** | Redis is an unreplicated, unpersisted Pub/Sub service, Todos stores data in process memory, and Users uses pod-local H2 seed data. Restarts and scaling can lose or diverge state, so the code confirms the plan's warning but provides no continuity. |
| AI-agents repository | **PARTIAL** | The repository contains context documentation plus scripts to generate `AGENTS.md` files and index repositories. The advertised `.claude/agents`, `.claude/skills`, and `.claude/mcp` content does not appear in the snapshot, so specialized agents, Spec Kit skills, and MCP configuration are not delivered. |
| Suggested roadmap | **PARTIAL, FULL ROLLOUT AUTHORIZED** | The economical runtime and the first dedicated EKS foundation exist. The approved full-profile work now requires a cross-repository specification, staged infrastructure, GitOps registrations, platform capabilities, AKS/Route 53, and live acceptance evidence. |

## Amendment process

1. Any contributor may propose an amendment through a pull request to `microservice-app-docs`; the PR MUST state the exact text changed, rationale, alternatives, affected repositories, compatibility impact, migration tasks, and rollback approach.
2. The PR MUST update the current-state assessment when it changes an architectural target or when new implementation evidence changes a status.
3. Approval MUST come from a maintainer of `microservice-app-docs`, a maintainer of `microservice-app-ops` or `microservice-app-gitops` for platform concerns, and a maintainer of every materially affected service; an AI agent may draft but may not approve an amendment.
4. An addition, change, profile switch, or retirement becomes effective only after those approvals and merge to `main`; the constitution version and ratification date MUST change in the same commit.
5. Retired principles MUST retain an auditable explanation in Git history and MUST include migration work for specifications, code, and GitOps state that depended on them.

## Governance

This constitution outranks feature specifications; approved feature specifications outrank plans and tasks; all of them outrank current code and deployed state. A conflicting feature specification MUST be changed to comply or blocked until a constitution amendment is approved first. Existing contradictory code creates remediation work and never establishes precedent or an implicit waiver. Ambiguity is resolved in a documented pull-request decision by the same maintainers required for an amendment, and no conversation, prompt, emergency command, or undocumented exception may override that decision hierarchy.

**Version**: 4.0.0 | **Ratified**: 2026-08-10 | **Last Amended**: 2026-09-11
