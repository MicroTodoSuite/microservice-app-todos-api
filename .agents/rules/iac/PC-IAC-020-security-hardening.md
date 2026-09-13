# PC-IAC-020 — Security Hardening

**Source**: course rule PC-IAC-020, v1.0. **Status**: Adapted.

## Requirement

- **Encryption at rest** MUST be enabled on every data store — S3, EBS, EFS,
  Secrets Manager, ECR, Key Vault, storage accounts — preferably with a
  customer-managed key.
- **Encryption in transit**: public endpoints MUST enforce TLS 1.2 or later.
- **Least privilege**: IAM policies MUST name actions and resources; `*` needs a
  recorded exception. Security groups and network security groups MUST be
  specific; `0.0.0.0/0` is forbidden on any port other than public HTTP and
  HTTPS, and forbidden in private networks.
- **Instance metadata**: compute MUST require IMDSv2 (`http_tokens = "required"`).
- **Public access**: every S3 bucket MUST block public access at bucket level.
- **Private connectivity**: private subnets MUST reach S3 through a gateway VPC
  endpoint.
- **Perimeter**: public application endpoints MUST expose an `enable_waf` input.
- **Certificates** MUST come from ACM or Key Vault, never from files in Terraform.

## Project adaptation

- Interface endpoints for ECR, STS, and Secrets Manager SHOULD be used; the
  economical profile MAY route them through NAT to stay inside its budget, as a
  recorded cost exception with the monthly figure.
- The dev EKS public API allows `0.0.0.0/0` on port 443 under a human-approved
  trade-off recorded in ops spec 001; it is HTTPS, so the rule permits it, and it
  MUST NOT be copied to `fstg` or `fprd`.

## Automated check

Trivy (`trivy config`), failing on HIGH and CRITICAL findings (PC-IAC-018).

## Agent procedure

Before writing a resource, an agent checks the provider's current hardening
arguments through the documentation MCP server or the vendor's documentation.
