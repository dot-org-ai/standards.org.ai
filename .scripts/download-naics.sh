#!/bin/bash
#
# Download NAICS Data
#
# Downloads the NAICS 2022 structure from U.S. Census Bureau
# Source: https://www.census.gov/naics/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/NAICS"

echo "Downloading NAICS 2022..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# NAICS 2022 structure
echo "Downloading NAICS 2022 Structure..."
curl -L -o "2022_NAICS_Structure.xlsx" \
  "https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx"

# Also download the descriptions if available
echo "Downloading NAICS 2022 Descriptions..."
curl -L -o "2022_NAICS_Descriptions.xlsx" \
  "https://www.census.gov/naics/2022NAICS/2022_NAICS_Descriptions.xlsx" || true

echo ""
echo "✓ NAICS 2022 downloaded successfully"
echo ""
echo "Files will be converted to TSV by the transformation script."
echo "Run: bun run generate:naics"
echo ""
echo "Note: NAICS is updated every 5 years. Next update: 2027"
