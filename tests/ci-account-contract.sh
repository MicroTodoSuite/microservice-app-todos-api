#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow="$repo_root/.github/workflows/ci.yml"
service_name="${repo_root##*/}"
service_name="${service_name#microservice-app-}"
retired_ci_ref="MicroTodoSuite/.github/.github/workflows/ci.yml@5c4e133fc528ef6ff596d146150321ca94760721"
account_variable='${{ vars.AWS_ACCOUNT_ID }}'

fail() {
  printf 'ci-account-contract: %s\n' "$*" >&2
  exit 1
}

# The AWS account lives in one organization variable. A literal account in this
# workflow is one more file to find and edit the next time the account changes.
grep -Fq -- "ecr-repository: ${account_variable}.dkr.ecr.us-east-1.amazonaws.com/microtodosuite/${service_name}" "$workflow" \
  || fail "neutral ECR input does not read the organization account variable"
publisher_inputs="$(grep -c 'publisher-role-arn:' "$workflow" || true)"
variable_inputs="$(grep -cF -- "publisher-role-arn: arn:aws:iam::${account_variable}:role/microtodosuite-github-ecr-publisher" "$workflow" || true)"
[[ "$publisher_inputs" -gt 0 && "$publisher_inputs" == "$variable_inputs" ]] \
  || fail "only $variable_inputs of $publisher_inputs publisher role inputs read the organization account variable"
if grep -Eq 'arn:aws:iam::[0-9]{12}:|[0-9]{12}\.dkr\.ecr\.' "$workflow"; then
  fail "active CI workflow still pins a literal AWS account"
fi
if grep -Fq -- "$retired_ci_ref" "$workflow"; then
  fail "CI caller still pins the reusable workflow before account recovery"
fi
grep -Eq 'uses: MicroTodoSuite/\.github/\.github/workflows/ci\.yml@[0-9a-f]{40}$' "$workflow" \
  || fail "CI reusable workflow is not pinned to an immutable commit"

printf 'ci-account-contract: PASS (%s)\n' "$service_name"
