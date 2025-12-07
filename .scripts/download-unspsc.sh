#!/bin/bash
#
# Download UNSPSC Data
#
# Note: UNSPSC requires registration to download
# This script provides instructions for manual download
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/UNSPSC"

echo "UNSPSC Download Instructions"
echo "=============================="
echo ""
echo "UNSPSC requires free registration to download."
echo ""
echo "Steps:"
echo "1. Visit: https://www.unspsc.org/"
echo "2. Create a free account or log in"
echo "3. Navigate to: Downloads > Current Version"
echo "4. Download the latest version (Excel or CSV format)"
echo "5. Save to: $SOURCE_DIR/"
echo ""
echo "Alternatively, if you have UNSPSC data from another source:"
echo "- Place UNSPSC.Codes.tsv in: $SOURCE_DIR/"
echo ""
echo "After download, run: bun run generate:unspsc"
echo ""

# Check if we already have the file
if [ -f "$SOURCE_DIR/UNSPSC.Codes.tsv" ]; then
    echo "✓ UNSPSC.Codes.tsv already exists"
    echo ""
else
    echo "⚠ UNSPSC.Codes.tsv not found - manual download required"
    exit 1
fi
