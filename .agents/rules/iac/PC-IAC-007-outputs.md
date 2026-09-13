# PC-IAC-007 — Outputs

**Source**: course rule PC-IAC-007, v1.0. **Status**: Adapted.

## Requirement

- Every output MUST have a `description`.
- Outputs MUST be granular — an ID, an ARN, a name, a map of them — never a whole
  resource object.
- Output names MUST be `snake_case` and end in what they return: `_id`, `_arn`,
  `_name`, `_ids`, `_arns`, `_names`.
- `sensitive = true` is allowed only for a secret that is technically required
  downstream and cannot be read another way; by default it MUST NOT be used.

## Project adaptation

EKS, networking, and queue resources return kinds of value the course's three
suffixes do not name. An output name MUST end in one of: `_id`, `_ids`, `_arn`,
`_arns`, `_name`, `_names`, `_url`, `_urls`, `_endpoint`, `_endpoints`, `_cidr`,
`_cidrs`, `_data`, or `_version`.

## Automated check

tflint `terraform_documented_outputs`, and a contract that fails on an output
whose value is a bare resource reference.
