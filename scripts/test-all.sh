#!/usr/bin/env bash
set -o pipefail

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

npm run test --workspaces 2>&1 | tee "$tmp"
code=${PIPESTATUS[0]}

green='\033[32m'
red='\033[31m'
dim='\033[2m'
bold='\033[1m'
reset='\033[0m'

read -r tests pass fail < <(awk '/^ℹ tests/{t+=$3}/^ℹ pass/{p+=$3}/^ℹ fail/{f+=$3}END{printf "%d %d %d",t,p,f}' "$tmp")

echo ""
echo -e "${dim}── All workspaces ──${reset}"
if [ "$fail" -gt 0 ]; then
  echo -e "  ${bold}${red}${tests} tests, ${pass} passed, ${fail} failed${reset}"
else
  echo -e "  ${bold}${green}${tests} tests, ${pass} passed, ${fail} failed${reset}"
fi

exit $code
