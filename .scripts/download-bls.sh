#!/bin/bash
#
# Download BLS Data
#
# Downloads Bureau of Labor Statistics data (OES, educational attainment, etc.)
# Source: https://www.bls.gov/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/BLS"

echo "Downloading BLS Data..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# OES (Occupational Employment Statistics) - May 2024
echo "Downloading OES Data (May 2024)..."
curl -L -o "oesm24all.zip" \
  "https://www.bls.gov/oes/special.requests/oesm24all.zip"

echo "Extracting OES data..."
unzip -o oesm24all.zip

# Find and rename the all data file
if [ -f "all_data_M_2024.xlsx" ]; then
    mv all_data_M_2024.xlsx BLS.OES.May2024.xlsx
fi

# Military Crosswalk
echo "Downloading Military Crosswalk..."
curl -L -o "military_crosswalk.xlsx" \
  "https://www.bls.gov/emp/tables/military-crosswalk.xlsx" || true

# Educational Attainment
echo ""
echo "Note: Educational attainment tables require manual download"
echo "Visit: https://www.bls.gov/emp/tables/educational-attainment.htm"
echo "Download required files and save to: $SOURCE_DIR/"
echo ""
echo "Required files:"
echo "  - National (by occupation)"
echo "  - By state"
echo "  - By metropolitan area"
echo "  - By NAICS industry"
echo "  - By sector"
echo ""

echo "✓ BLS OES data downloaded"
echo ""
echo "Downloaded:"
echo "  - OES May 2024 (employment and wage data)"
echo "  - Military crosswalk (if available)"
echo ""
echo "Manual download required:"
echo "  - Educational attainment tables"
echo ""
echo "Run: bun run generate:bls"
