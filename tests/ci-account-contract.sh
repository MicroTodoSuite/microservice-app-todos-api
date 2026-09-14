#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow="$repo_root/.github/workflows/ci.yml"
service_name="$(sed -n 's/^[[:space:]]*service-name:[[:space:]]*\([^[:space:]]*\)[[:space:]]*$/\1/p' "$workflow" | head -1)"
retired_ci_ref="MicroTodoSuite/.github/.github/workflows/ci.yml@5c4e133fc528ef6ff596d146150321ca94760721"
account_variable='${{ vars.AWS_ACCOUNT_ID }}'

fail() {
  printf 'ci-account-contract: %s\n' "$*" >&2
  exit 1
}

# The account remains an organization variable, while the repository suffix is
# the immutable output of the rebuilt shared registry root.
case "$service_name" in
  auth-api) repository_suffix=authapi ;;
  frontend) repository_suffix=frontend ;;
  log-message-processor) repository_suffix=logmsgproc ;;
  todos-api) repository_suffix=todosapi ;;
  users-api) repository_suffix=usersapi ;;
  *) fail "unsupported service-name input: $service_name" ;;
esac

expected_repository="${account_variable}.dkr.ecr.us-east-1.amazonaws.com/lex-mts-shd-ecr-${repository_suffix}"
grep -Fq -- "ecr-repository: ${expected_repository}" "$workflow" \
  || fail "ECR input does not target ${expected_repository}"
publisher_inputs="$(grep -c 'publisher-role-arn:' "$workflow" || true)"
variable_inputs="$(grep -cF -- "publisher-role-arn: arn:aws:iam::${account_variable}:role/lex-mts-shd-role-ecrpublish" "$workflow" || true)"
[[ "$publisher_inputs" -gt 0 && "$publisher_inputs" == "$variable_inputs" ]] \
  || fail "only $variable_inputs of $publisher_inputs inputs use the rebuilt publisher role"
if grep -Eq 'microtodosuite/(auth-api|frontend|log-message-processor|todos-api|users-api)|microtodosuite-github-ecr-publisher' "$workflow"; then
  fail "active CI workflow still references a retired publication name"
fi
if grep -Eq 'arn:aws:iam::[0-9]{12}:|[0-9]{12}\.dkr\.ecr\.' "$workflow"; then
  fail "active CI workflow still pins a literal AWS account"
fi
if grep -Fq -- "$retired_ci_ref" "$workflow"; then
  fail "CI caller still pins the reusable workflow before account recovery"
fi
grep -Eq 'uses: MicroTodoSuite/\.github/\.github/workflows/ci\.yml@[0-9a-f]{40}$' "$workflow" \
  || fail "CI reusable workflow is not pinned to an immutable commit"

printf 'ci-account-contract: PASS (%s)\n' "$service_name"
