# MTS-IAC-104 — Azure

**Status**: Project rule, recorded 2026-09-11. Applies the course rules to Azure.

## Requirement

- Roots configure `provider "azurerm"` with `alias = "principal"`, the
  subscription ID from configuration, `features {}`, and authentication through
  OIDC — never a client secret. Modules declare `azurerm.project`.
- The AzureRM provider has no `default_tags`: every resource MUST set
  `tags = merge(var.common_tags, { Name = <name> }, var.additional_tags)`.
- Names follow MTS-IAC-101, including the separator-free forms for registries and
  storage accounts.
- State uses the `azurerm` backend with a dedicated storage account, blob
  versioning, and soft delete; the account has public network access disabled
  where the runner can still reach it.
- Key Vault uses RBAC authorization and purge protection.
- AKS uses workload identity and the OIDC issuer; no service-principal secrets.
- Every AKS size and node count MUST fit the subscription's regional vCPU quota,
  checked before planning. The current subscription allows six vCPUs per region.

## Agent procedure

An agent checks `az vm list-usage` for the target region and the Azure naming
rules for each resource type through the Azure documentation MCP server or
Microsoft Learn before writing Azure resources.
