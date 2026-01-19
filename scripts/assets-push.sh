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
LOCAL_BASE="nodes/org/artifacts"

# What to sync
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  # Sync all artifacts with trunk/branches/archive folders
  echo "Pushing all artifact assets to R2..."
  rclone sync "$LOCAL_BASE/" "$R2_REMOTE:$R2_BUCKET/artifacts/" \
    --include "*/trunk/**" \
    --include "*/branches/**" \
    --include "*/archive/**" \
    --include "*/*/trunk/**" \
    --include "*/*/branches/**" \
    --include "*/*/archive/**" \
    --progress
else
  # Sync specific artifact path (handles both direct and nested structures)
  echo "Pushing $TARGET assets to R2..."
  rclone sync "$LOCAL_BASE/$TARGET/" "$R2_REMOTE:$R2_BUCKET/artifacts/$TARGET/" \
    --include "trunk/**" \
    --include "branches/**" \
    --include "archive/**" \
    --include "*/trunk/**" \
    --include "*/branches/**" \
    --include "*/archive/**" \
    --progress
fi

echo "Done."
