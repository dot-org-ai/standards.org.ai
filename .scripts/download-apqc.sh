#!/bin/bash
#
# APQC Download Instructions
#
# APQC Process Classification Framework requires membership or purchase
# This script provides instructions for manual download
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/APQC"

echo "APQC Download Instructions"
echo "==========================="
echo ""
echo "APQC Process Classification Framework (PCF) requires:"
echo "  - APQC membership, OR"
echo "  - Individual purchase, OR"
echo "  - Free version with registration (limited)"
echo ""
echo "Steps to Download:"
echo "=================="
echo "1. Visit: https://www.apqc.org/process-frameworks"
echo "2. Select: Process Classification Framework (PCF)"
echo "3. Choose version:"
echo "   - Cross-Industry PCF 7.4 (base framework)"
echo "   - Industry-specific variants (optional)"
echo "4. Register or purchase access"
echo "5. Download: Excel format (.xlsx)"
echo "6. Save to: $SOURCE_DIR/"
echo ""
echo "Recommended downloads:"
echo "======================"
echo "  - APQC_PCF_7.4.xlsx (Cross-Industry)"
echo "  - Industry variants (if needed):"
echo "    - Healthcare Provider"
echo "    - Banking"
echo "    - Retail"
echo "    - etc."
echo ""
echo "Files should be named:"
echo "  - K014749_APQC Process Classification Framework (PCF) - Cross-Industry - Excel Version 7.4.xlsx"
echo "  - [Industry-specific files as downloaded]"
echo ""
echo "After download, the transformation script will:"
echo "  - Extract processes, metrics, glossary terms"
echo "  - Create hierarchy relationships"
echo "  - Generate industry variant comparisons"
echo ""
echo "Run: bun run generate:apqc"
echo ""

# Check if we have APQC data
if ls "$SOURCE_DIR"/APQC*.tsv 1> /dev/null 2>&1; then
    echo "✓ Some APQC data files found (pre-processed TSV)"
else
    echo "⚠ No APQC TSV data files found"
fi

if ls "$SOURCE_DIR"/*.xlsx 1> /dev/null 2>&1 || ls "$SOURCE_DIR"/*.xls 1> /dev/null 2>&1; then
    echo "✓ APQC Excel files found"
    echo "  Files: $(ls "$SOURCE_DIR"/*.xlsx "$SOURCE_DIR"/*.xls 2>/dev/null | wc -l)"
else
    echo "⚠ No APQC Excel files found - download required"
fi

echo ""
