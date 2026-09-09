#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow="$repo_root/.github/workflows/ci.yml"
service_name="${repo_root##*/}"
service_name="${service_name#microservice-app-}"
replacement_account="575172595729"
retired_account="916491575487"
retired_ci_ref="MicroTodoSuite/.github/.github/workflows/ci.yml@5c4e133fc528ef6ff596d146150321ca94760721"

fail() {
  printf 'ci-account-contract: %s\n' "$*" >&2
  exit 1
}

grep -Fq -- "${replacement_account}.dkr.ecr.us-east-1.amazonaws.com/microtodosuite/${service_name}" "$workflow" \
  || fail "neutral ECR input does not target the replacement account"
grep -Fq -- "arn:aws:iam::${replacement_account}:role/microtodosuite-github-ecr-publisher" "$workflow" \
  || fail "publisher role input does not target the replacement account"
if grep -Fq -- "$retired_account" "$workflow"; then
  fail "active CI workflow still references the retired account"
fi
if grep -Fq -- "$retired_ci_ref" "$workflow"; then
  fail "CI caller still pins the reusable workflow before account recovery"
fi
grep -Eq 'uses: MicroTodoSuite/\.github/\.github/workflows/ci\.yml@[0-9a-f]{40}$' "$workflow" \
  || fail "CI reusable workflow is not pinned to an immutable commit"

printf 'ci-account-contract: PASS (%s)\n' "$service_name"

