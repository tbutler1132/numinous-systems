#!/bin/bash
# Pull binary assets from R2 to local
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
#   ./scripts/assets-pull.sh              # pull all artifacts
#   ./scripts/assets-pull.sh songs        # pull only songs
#   ./scripts/assets-pull.sh songs/between-this-world-and-the-next  # pull specific song

set -e

# Configuration
R2_REMOTE="r2"
R2_BUCKET="numinous-assets"
LOCAL_BASE="nodes/org/artifacts"

# What to sync
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  # Sync all artifacts with trunk/branches/archive folders
  echo "Pulling all artifact assets from R2..."
  rclone sync "$R2_REMOTE:$R2_BUCKET/artifacts/" "$LOCAL_BASE/" \
    --include "*/trunk/**" \
    --include "*/branches/**" \
    --include "*/archive/**" \
    --include "*/*/trunk/**" \
    --include "*/*/branches/**" \
    --include "*/*/archive/**" \
    --progress
else
  # Sync specific artifact path (handles both direct and nested structures)
  echo "Pulling $TARGET assets from R2..."
  rclone sync "$R2_REMOTE:$R2_BUCKET/artifacts/$TARGET/" "$LOCAL_BASE/$TARGET/" \
    --include "trunk/**" \
    --include "branches/**" \
    --include "archive/**" \
    --include "*/trunk/**" \
    --include "*/branches/**" \
    --include "*/archive/**" \
    --progress
fi

echo "Done."
