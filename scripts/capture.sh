#!/bin/bash
# Quick capture for vital-systems inbox
# Add to your .zshrc: source ~/Projects/vital-systems/scripts/capture.sh

VITAL_SYSTEMS_ROOT="${VITAL_SYSTEMS_ROOT:-$HOME/Projects/numinous-systems}"

inbox() {
  local inbox_file="$VITAL_SYSTEMS_ROOT/nodes/inbox.md"
  local entry="$*"
  
  if [[ -z "$entry" ]]; then
    echo "Usage: inbox your note here"
    return 1
  fi
  
  if [[ ! -f "$inbox_file" ]]; then
    echo "Error: Inbox file not found: $inbox_file"
    return 1
  fi
  
  echo "- $entry" >> "$inbox_file"
  echo "✓ inbox: $entry"
}
