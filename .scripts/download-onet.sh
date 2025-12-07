#!/bin/bash
#
# Download O*NET Data
#
# Downloads the latest O*NET database from the O*NET Center
# Source: https://www.onetcenter.org/database.html
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/ONET"

echo "Downloading O*NET Database..."
echo "Source directory: $SOURCE_DIR"
echo ""

# Create directory if it doesn't exist
mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# O*NET version (update this when new versions are released)
ONET_VERSION="29_1"
DOWNLOAD_URL="https://www.onetcenter.org/dl_files/database/db_${ONET_VERSION}_excel.zip"

echo "Downloading O*NET ${ONET_VERSION} (Excel format)..."
curl -L -o "onet_db_${ONET_VERSION}.zip" "$DOWNLOAD_URL"

echo "Extracting files..."
unzip -o "onet_db_${ONET_VERSION}.zip"

# The Excel files need to be converted to TSV
# This is typically done by the transformation script
echo ""
echo "✓ O*NET database downloaded successfully"
echo ""
echo "Files are in Excel format and will be converted to TSV by the transformation script."
echo "Run: bun run generate:onet"
echo ""
echo "Note: Check https://www.onetcenter.org/database.html for the latest version."
echo "Current version: ${ONET_VERSION}"
