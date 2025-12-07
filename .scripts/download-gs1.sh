#!/bin/bash
#
# GS1 Download Instructions
#
# GS1 data requires login and membership
# This script provides instructions for manual download
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/GS1"

echo "GS1 Download Instructions"
echo "=========================="
echo ""
echo "GS1 data requires GS1 membership or login to download."
echo ""
echo "GPC (Global Product Classification):"
echo "======================================"
echo "1. Visit: https://gpc-browser.gs1.org/"
echo "2. Log in with GS1 credentials (or create free account)"
echo "3. Navigate to: Downloads section"
echo "4. Download: GPC Schema (Excel format)"
echo "5. Save to: $SOURCE_DIR/"
echo "   Filename: GPC as of [Date] EN.xlsx"
echo ""
echo "EPCIS Vocabularies:"
echo "==================="
echo "1. Visit: https://ref.gs1.org/standards/epcis/"
echo "2. Download:"
echo "   - Business Step vocabulary"
echo "   - Disposition vocabulary"
echo "   - Location types"
echo "   - Identifier types"
echo "3. Save to: $SOURCE_DIR/"
echo ""
echo "Files to create:"
echo "  - GS1.Schema.tsv (from GPC Excel)"
echo "  - GS1.BusinessStep.VerbMapping.tsv"
echo "  - GS1.Disposition.VerbMapping.tsv"
echo "  - GS1.Location.Types.tsv"
echo "  - GS1.GLN.FunctionalTypes.tsv"
echo "  - GS1.Identifier.ClassMapping.tsv"
echo ""
echo "After download, run: bun run generate:gs1"
echo ""

# Check if we have any GS1 data
if ls "$SOURCE_DIR"/GS1.*.tsv 1> /dev/null 2>&1; then
    echo "✓ Some GS1 data files found"
else
    echo "⚠ No GS1 data files found - manual download required"
fi

if ls "$SOURCE_DIR"/GPC*.xlsx 1> /dev/null 2>&1; then
    echo "✓ GPC Excel file found"
else
    echo "⚠ GPC Excel file not found"
fi

echo ""
