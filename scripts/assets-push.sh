#!/bin/bash
# Push local binary assets to R2
#
# Prerequisites:
#   1. Install rclone: brew install rclone
#   2. Configure R2 remote: rclone config
#      - Choose "s3" provider
#      - Choose "Cloudflare R2" 
#      - Enter your R2 credentials
#      - Name it "r2" (or update R2_REMOTE below)
#
# Usage:
#   ./scripts/assets-push.sh              # push all artifacts
#   ./scripts/assets-push.sh songs        # push only songs
#   ./scripts/assets-push.sh songs/between-this-world-and-the-next  # push specific song

set -e

# Configuration
R2_REMOTE="r2"
R2_BUCKET="numinous-assets"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_BASE="$REPO_ROOT/nodes/org/artifacts"

# What to sync
TARGET="${1:-}"

FILTER_FLAGS=(
  --filter "- .DS_Store"
  --filter "+ */trunk/**"
  --filter "+ */branches/**"
  --filter "+ */archive/**"
  --filter "+ */*/trunk/**"
  --filter "+ */*/branches/**"
  --filter "+ */*/archive/**"
  --filter "- *"
)

if [ -z "$TARGET" ]; then
  SRC="$LOCAL_BASE/"
  DST="$R2_REMOTE:$R2_BUCKET/artifacts/"
  echo "Pushing all artifact assets to R2..."
else
  SRC="$LOCAL_BASE/$TARGET/"
  DST="$R2_REMOTE:$R2_BUCKET/artifacts/$TARGET/"
  FILTER_FLAGS=(
    --filter "- .DS_Store"
    --filter "+ trunk/**"
    --filter "+ branches/**"
    --filter "+ archive/**"
    --filter "+ */trunk/**"
    --filter "+ */branches/**"
    --filter "+ */archive/**"
    --filter "- *"
  )
  echo "Pushing $TARGET assets to R2..."
fi

# Dry-run preview
echo ""
echo "=== Dry run preview ==="
rclone sync "$SRC" "$DST" "${FILTER_FLAGS[@]}" --dry-run 2>&1
echo "=== End preview ==="
echo ""

read -p "Proceed with push? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

rclone sync "$SRC" "$DST" "${FILTER_FLAGS[@]}" --progress

echo "Done."
