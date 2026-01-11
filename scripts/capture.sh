#!/bin/bash
# Quick capture for vital-systems logs
# Add to your .zshrc: source ~/Projects/vital-systems/scripts/capture.sh

VITAL_SYSTEMS_ROOT="${VITAL_SYSTEMS_ROOT:-$HOME/Projects/vital-systems}"

_vs_capture() {
  local log_file="$1"
  shift
  local entry="$*"
  local today=$(date +%Y-%m-%d)
  
  if [[ -z "$entry" ]]; then
    echo "Usage: note your note here"
    return 1
  fi
  
  if [[ ! -f "$log_file" ]]; then
    echo "Error: Log file not found: $log_file"
    return 1
  fi
  
  if grep -q "^## $today$" "$log_file"; then
    # Today's section exists - insert entry after date header
    awk -v date="## $today" -v entry="- $entry" '
      $0 == date { print; print ""; print entry; getline; next }
      { print }
    ' "$log_file" > "$log_file.tmp" && mv "$log_file.tmp" "$log_file"
  else
    # Create new section after ## Actions separator
    awk -v date="## $today" -v entry="- $entry" '
      BEGIN { found = 0; inserted = 0 }
      /^## Actions/ { found = 1 }
      found && !inserted && /^---$/ {
        print
        print ""
        print date
        print ""
        print entry
        print ""
        print "---"
        inserted = 1
        next
      }
      { print }
    ' "$log_file" > "$log_file.tmp" && mv "$log_file.tmp" "$log_file"
  fi
  
  echo "✓ $(basename $(dirname "$log_file")): $entry"
}

# Personal log
note() {
  _vs_capture "$VITAL_SYSTEMS_ROOT/nodes/personal/log.md" "$@"
}

# Org log
onote() {
  _vs_capture "$VITAL_SYSTEMS_ROOT/nodes/org/log.md" "$@"
}
