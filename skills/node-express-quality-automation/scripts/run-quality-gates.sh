#!/usr/bin/env bash
set -uo pipefail

project_dir="${1:-.}"
cd "$project_dir" || exit 2

if [[ ! -f package.json ]]; then
  printf 'error: package.json not found in %s\n' "$PWD" >&2
  exit 2
fi

if [[ -f pnpm-lock.yaml ]]; then
  runner=(pnpm)
elif [[ -f yarn.lock ]]; then
  runner=(yarn)
elif [[ -f bun.lockb || -f bun.lock ]]; then
  runner=(bun run)
else
  runner=(npm run)
fi

has_script() {
  node -e "const p=require('./package.json'); process.exit(p.scripts?.[process.argv[1]] ? 0 : 1)" "$1"
}

run_script() {
  local script="$1"
  printf '\n==> %s\n' "$script"
  "${runner[@]}" "$script"
}

failures=0
ran=0

for script in typecheck type-check check-types lint test; do
  if has_script "$script"; then
    ran=1
    run_script "$script" || failures=$((failures + 1))
  fi
done

if ! has_script typecheck && ! has_script type-check && ! has_script check-types && [[ -f tsconfig.json ]] && [[ -x node_modules/.bin/tsc ]]; then
  ran=1
  printf '\n==> tsc --noEmit\n'
  node_modules/.bin/tsc --noEmit || failures=$((failures + 1))
fi

if ! has_script lint && [[ -f eslint.config.js || -f eslint.config.mjs || -f eslint.config.cjs || -f eslint.config.ts || -f eslint.config.mts ]] && [[ -x node_modules/.bin/eslint ]]; then
  ran=1
  printf '\n==> eslint .\n'
  node_modules/.bin/eslint . || failures=$((failures + 1))
fi

if [[ "$ran" -eq 0 ]]; then
  printf 'error: no configured quality checks were found\n' >&2
  exit 2
fi

if [[ "$failures" -ne 0 ]]; then
  printf '\n%d quality gate(s) failed\n' "$failures" >&2
  exit 1
fi

printf '\nAll discovered quality gates passed\n'

