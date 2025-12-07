#!/bin/bash
#
# Download NAPCS Data
#
# Downloads the NAPCS 2022 structure from U.S. Census Bureau
# Source: https://www.census.gov/naics/napcs/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/NAPCS"

echo "Downloading NAPCS 2022..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# NAPCS 2022 structure
echo "Downloading NAPCS 2022 Structure..."
curl -L -o "NAPCS.2022.Structure.csv" \
  "https://www.census.gov/naics/napcs/NAPCS2022_Structure.csv"

echo ""
echo "✓ NAPCS 2022 downloaded successfully"
echo ""
echo "Run: bun run generate:napcs"
echo ""
echo "Note: NAPCS is updated every 5 years, aligned with NAICS. Next update: 2027"
