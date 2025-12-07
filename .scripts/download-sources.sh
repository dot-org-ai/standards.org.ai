#!/bin/bash
#
# Download All Data Sources
#
# This script downloads fresh data from all available public sources.
# Some sources require manual download due to authentication requirements.
#
# Usage: bash .scripts/download-sources.sh
#

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_DIR="$PROJECT_ROOT/.source"

echo "=================================================="
echo "  Standards.org.ai - Data Source Downloader"
echo "=================================================="
echo ""
echo "Downloading fresh data from public sources..."
echo "Project root: $PROJECT_ROOT"
echo "Source directory: $SOURCE_DIR"
echo ""

# Track success/failure
SUCCESSFUL=()
FAILED=()
MANUAL=()

# Helper function to run individual download scripts
download_source() {
    local source_name=$1
    local download_script="$SCRIPT_DIR/download-${source_name}.sh"

    if [ -f "$download_script" ]; then
        echo "----------------------------------------"
        echo "Downloading: $source_name"
        echo "----------------------------------------"
        if bash "$download_script"; then
            SUCCESSFUL+=("$source_name")
            echo "✓ $source_name download completed"
        else
            FAILED+=("$source_name")
            echo "✗ $source_name download failed"
        fi
        echo ""
    else
        MANUAL+=("$source_name")
        echo "⚠ $source_name: Manual download required (no script available)"
        echo ""
    fi
}

# Download public sources with automated scripts
download_source "onet"
download_source "naics"
download_source "napcs"
download_source "iso"
download_source "un"
download_source "unspsc"
download_source "bls"
download_source "iana"
download_source "advancecte"

# Manual download notifications
echo "=================================================="
echo "  Manual Download Required"
echo "=================================================="
echo ""
echo "The following sources require manual download:"
echo ""
echo "1. GS1 (GPC, EPCIS)"
echo "   - Requires GS1 login/membership"
echo "   - Visit: https://gpc-browser.gs1.org/"
echo "   - Download: GPC Excel file (latest version)"
echo "   - Save to: $SOURCE_DIR/GS1/"
echo ""
echo "2. APQC (Process Classification Framework)"
echo "   - Requires APQC membership or purchase"
echo "   - Visit: https://www.apqc.org/process-frameworks"
echo "   - Download: PCF 7.4 Cross-Industry Excel"
echo "   - Save to: $SOURCE_DIR/APQC/"
echo ""
echo "3. BLS (Some datasets)"
echo "   - Educational attainment tables require manual download"
echo "   - Visit: https://www.bls.gov/emp/tables/educational-attainment.htm"
echo "   - Save to: $SOURCE_DIR/BLS/"
echo ""

# Summary
echo "=================================================="
echo "  Download Summary"
echo "=================================================="
echo ""

if [ ${#SUCCESSFUL[@]} -gt 0 ]; then
    echo "✓ Successful downloads (${#SUCCESSFUL[@]}):"
    for source in "${SUCCESSFUL[@]}"; do
        echo "  - $source"
    done
    echo ""
fi

if [ ${#FAILED[@]} -gt 0 ]; then
    echo "✗ Failed downloads (${#FAILED[@]}):"
    for source in "${FAILED[@]}"; do
        echo "  - $source"
    done
    echo ""
fi

if [ ${#MANUAL[@]} -gt 0 ]; then
    echo "⚠ Manual download required (${#MANUAL[@]}):"
    for source in "${MANUAL[@]}"; do
        echo "  - $source"
    done
    echo ""
fi

echo "=================================================="
echo ""

# Next steps
echo "Next steps:"
echo "1. Complete manual downloads (see above)"
echo "2. Run transformations: bun run generate"
echo "3. Verify output in .data/ directory"
echo ""
echo "For detailed instructions, see: .source/README.md"
echo ""
