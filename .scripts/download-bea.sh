#!/bin/bash
#
# Download BEA Input-Output Accounts data.
#
# Fetches the BEA Input-Output Supplementary tables bundle (Supply, Use, Make,
# Total Requirements at sector/summary/detail) + the BEA-industry↔NAICS
# concordance. We use the Industry-by-Industry Total Requirements (Summary,
# After Redefinitions) table as the directed inter-industry supply backbone.
#
# Sources:
#   https://apps.bea.gov/industry/iTables Static Files/AllTablesSUP.zip
#   https://www.bea.gov/sites/default/files/2023-10/BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/BEA"

echo "Downloading BEA Input-Output data..."
echo "Source directory: $SOURCE_DIR"
mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

UA="Mozilla/5.0 (compatible; standards.org.ai/1.0)"

# 1. BEA-industry ↔ NAICS concordance (summary/detail → 2017 NAICS).
echo "Downloading BEA↔NAICS concordance..."
curl -fL -A "$UA" -o "BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx" \
  "https://www.bea.gov/sites/default/files/2023-10/BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx"

# 2. Supplementary IO tables bundle (~20 MB). Extract only the IxI Total
#    Requirements Summary + Sector tables (the directed-flow matrices we use).
echo "Downloading BEA Supplementary IO tables bundle (~20 MB)..."
curl -fL -A "$UA" -o "AllTablesSUP.zip" \
  "https://apps.bea.gov/industry/iTables%20Static%20Files/AllTablesSUP.zip"

echo "Extracting Industry-by-Industry Total Requirements tables..."
unzip -o "AllTablesSUP.zip" \
  "IxI_TR_1997-2023_Summary.xlsx" \
  "IxI_TR_1997-2023_Sector.xlsx" \
  -d "$SOURCE_DIR"

# Keep the bundle out of git-LFS (large; only the two extracted xlsx are tracked).
rm -f "AllTablesSUP.zip"

echo ""
echo "✓ BEA IO data downloaded:"
echo "  - BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx"
echo "  - IxI_TR_1997-2023_Summary.xlsx  (Industry-by-Industry Total Requirements, Summary)"
echo "  - IxI_TR_1997-2023_Sector.xlsx   (… Sector grain)"
echo ""
echo "Run: bun run .scripts/bea-io.ts"
