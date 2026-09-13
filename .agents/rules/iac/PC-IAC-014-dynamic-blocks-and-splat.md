# PC-IAC-014 — Dynamic Blocks and Splat Expressions

**Source**: course rule PC-IAC-014, v1.0. **Status**: Adopted.

## Requirement

- A nested block that repeats according to configuration MUST be generated with
  `dynamic`; identical static blocks that a list could generate are not allowed.
- Lists of attributes MUST be extracted with splat expressions — `aws_subnet.this[*].id`,
  or `values(aws_subnet.this)[*].id` for `for_each` collections — rather than
  redundant `for` expressions.

## Automated check

Reviewed through the iac-review skill.
