# PC-IAC-013 — Module Call Ordering

**Source**: course rule PC-IAC-013, v1.0. **Status**: Adapted.

## Requirement

Every `module` block MUST order its arguments in these groups, separated by a
blank line:

| Group | Contents |
| --- | --- |
| A | `source`, and `version` for registry sources |
| B | `providers` |
| C | Governance variables: `client`, `project`, `environment` |
| D | Transversal inputs: IDs and ARNs from data sources or other modules |
| E | Configuration: payloads from `local.*` |
| F | Meta-arguments: `for_each`, `count`, `depends_on` |

## Project adaptation

A Git source pins its version with `?ref=` inside `source`; the `version`
argument exists only for registry sources. The course's example combines the
two, which Terraform rejects.

## Automated check

Reviewed through the iac-review skill.
