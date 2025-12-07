#!/bin/bash
#
# Download UN Data
#
# Downloads UN/LOCODE, UN M49, and UN/EDIFACT data
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/UN"

echo "Downloading UN Standards..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# UN/LOCODE
echo "Downloading UN/LOCODE..."
# Latest version (update the year/version as needed)
curl -L -o "locode.zip" \
  "https://service.unece.org/trade/locode/Service/LocodeColumn.htm?Request=LocodeColumn&Locode=&Function=&Country=&Language=&Submit=Display" || \
curl -L -o "locode.zip" \
  "https://unece.org/sites/default/files/2024-12/loc242csv.zip"

if [ -f "locode.zip" ]; then
    echo "Extracting UN/LOCODE..."
    unzip -o locode.zip

    # Rename and combine files
    if [ -f "UNLOCODE CodeListPart*.csv" ]; then
        cat UNLOCODE\ CodeListPart*.csv > UN.LOCODE.CodeList.csv
    fi
fi

# UN M49 - Statistical Regions
echo "Downloading UN M49 (Statistical Regions)..."
curl -L -o "UN.M49.Regions.csv" \
  "https://unstats.un.org/unsd/methodology/m49/overview/" || \
curl -L -o "UN.M49.Regions.csv" \
  "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv"

# UN/EDIFACT message types
echo "Downloading UN/EDIFACT Message Types..."
# Note: EDIFACT data may need to be scraped or obtained from UNECE directly
# For now, we'll create a placeholder or use a community dataset
echo "Note: EDIFACT data may require manual download from https://unece.org/trade/uncefact/edifact"

echo ""
echo "✓ UN standards downloaded"
echo ""
echo "Downloaded:"
echo "  - UN/LOCODE (Location codes)"
echo "  - UN M49 (Regional codes)"
echo "  - UN/EDIFACT (may need manual download)"
echo ""
echo "Run: bun run generate:un"
echo ""
echo "Note: Check https://unece.org/trade/cefact/unlocode for latest LOCODE version"
