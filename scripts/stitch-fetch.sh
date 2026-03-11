#!/usr/bin/env bash
# Fetch Stitch project screens (images + HTML code) for UNTIL
# Prerequisites: npx @_davideast/stitch-mcp init (one-time auth)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/stitch-output"
PROJECT_ID="1707733117784992041"

mkdir -p "$OUTPUT_DIR/images"
mkdir -p "$OUTPUT_DIR/code"

# Screen IDs from Stitch project
declare -A SCREENS=(
  ["2ad5e8a97377474baa3f1bcbec4aba42"]="CountdownTimers"
  ["2b5cba9aff6b4a01ac1ac022d33c9b9e"]="HourCalculation"
  ["307e23b60a9549769100aa1930168a38"]="HomeTimeProgress"
  ["7972a8c5b83c4c3e9b9a8612e29cc2dc"]="Settings"
  ["8b737491c2024314afc5a978e616027e"]="CustomCounters"
  ["ac6960cce00d49eb8bb14d2f422e3088"]="LifeVisualization"
  ["bf4a7cd0b0e14670b3fd0a4903d7b8f1"]="MonthlyGoals"
  ["e474da70-094e-4231-a619-b4c5aa52cc5b"]="Screenshot"
)

echo "Fetching Stitch screens for project $PROJECT_ID..."
echo "Output: $OUTPUT_DIR"
echo ""

for SCREEN_ID in "${!SCREENS[@]}"; do
  NAME="${SCREENS[$SCREEN_ID]}"
  echo "--- $NAME ($SCREEN_ID) ---"

  # Fetch HTML code
  if npx @_davideast/stitch-mcp tool get_screen_code -d "{\"projectId\": \"$PROJECT_ID\", \"screenId\": \"$SCREEN_ID\"}" > "$OUTPUT_DIR/code/${NAME}.html" 2>/dev/null; then
    echo "  ✓ Code saved to code/${NAME}.html"
  else
    echo "  ✗ Failed to fetch code (check auth: npx @_davideast/stitch-mcp init)"
  fi

  # Fetch image (base64) - stitch-mcp returns base64; we decode to PNG
  IMG_OUT="$OUTPUT_DIR/images/${NAME}.png"
  if RESULT=$(npx @_davideast/stitch-mcp tool get_screen_image -d "{\"projectId\": \"$PROJECT_ID\", \"screenId\": \"$SCREEN_ID\"}" 2>/dev/null); then
    # If output is JSON with base64 field, extract it; else assume raw base64
    if echo "$RESULT" | head -1 | grep -q '^{'; then
      echo "$RESULT" | node -e "const d=require('fs').readFileSync(0,'utf8'); try { const j=JSON.parse(d); console.log(j.content || j.base64 || j.data || d); } catch { console.log(d); }" 2>/dev/null | base64 -d > "$IMG_OUT" 2>/dev/null || true
    else
      echo "$RESULT" | base64 -d > "$IMG_OUT" 2>/dev/null || true
    fi
    if [[ -s "$IMG_OUT" ]]; then
      echo "  ✓ Image saved to images/${NAME}.png"
    else
      rm -f "$IMG_OUT"
      echo "  ✗ Image fetch failed or empty"
    fi
  else
    echo "  ✗ Failed to fetch image"
  fi
  echo ""
done

echo "Done. Check $OUTPUT_DIR"
